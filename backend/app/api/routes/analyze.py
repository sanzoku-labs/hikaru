import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import User
from app.models.schemas import AnalyzeResponse
from app.services.analysis_service import AnalysisService
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["analyze"])


@router.get("/analyze/{upload_id}", response_model=AnalyzeResponse)
async def analyze_data(
    upload_id: str,
    user_intent: Optional[str] = Query(
        None, description="Optional: What the user wants to analyze"
    ),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Analyze uploaded file and generate charts with AI-powered suggestions.

    Takes an upload_id from a previous /upload call and:
    1. Uses AI to intelligently suggest 3-4 meaningful charts (with optional user intent)
    2. Generates charts based on AI suggestions (fallback to heuristics if AI unavailable)
    3. Generates AI insights for each chart (if API key configured)
    4. Generates global summary (if API key configured)
    """

    # Get upload data from database using UploadService
    upload_service = UploadService(db)
    upload_data = upload_service.get_upload(upload_id)

    # Verify user owns this upload (security check)
    from app.models.database import Upload
    upload_record = db.query(Upload).filter_by(upload_id=upload_id).first()
    if upload_record and upload_record.user_id and upload_record.user_id != current_user.id:
        raise HTTPException(status_code=404, detail=f"Upload ID {upload_id} not found")

    try:
        # Get data from storage (already parsed)
        df = upload_data["dataframe"]
        schema = upload_data["schema"]
        filename = upload_data["filename"]

        logger.info(
            f"Starting analysis for upload_id={upload_id}, filename={filename}, user_intent={user_intent}"
        )
        logger.info(f"Dataset: {schema.row_count} rows, {len(schema.columns)} columns")

        # Use AnalysisService for complete analysis workflow
        analysis_service = AnalysisService()
        result = analysis_service.perform_full_analysis(
            df=df, schema=schema, user_intent=user_intent, max_charts=4
        )

        logger.info(
            f"Analysis complete: {len(result['charts'])} charts generated, "
            f"global_summary={'present' if result['global_summary'] else 'none'}"
        )

        return AnalyzeResponse(
            upload_id=upload_id,
            filename=filename,
            data_schema=schema,
            charts=result["charts"],
            upload_timestamp=upload_data["timestamp"],
            global_summary=result["global_summary"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")
