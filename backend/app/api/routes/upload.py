import logging
import os
import shutil
import uuid
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.core.file_validation import validate_file_content
from app.core.rate_limit import limiter
from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import User
from app.models.schemas import UploadResponse
from app.services.data_processor import DataProcessor
from app.services.upload_service import UploadService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["upload"])

# Temporary storage (in-memory for MVP, will use proper storage later)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
@limiter.limit("10/minute")
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Upload CSV or XLSX file for analysis"""

    # Validate filename exists
    filename = file.filename
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    # Validate file extension
    file_extension = filename.split(".")[-1].lower()
    if file_extension not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions)}",
        )

    # Validate file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    max_size_bytes = settings.max_file_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File too large: {file_size / 1024 / 1024:.2f}MB "
                f"(limit: {settings.max_file_size_mb}MB)"
            ),
        )

    # Validate file content matches extension
    content = await file.read()
    if not validate_file_content(content, filename):
        raise HTTPException(
            status_code=400,
            detail="File content does not match its extension.",
        )
    await file.seek(0)

    # Generate upload ID and save file
    upload_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}.{file_extension}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Parse and analyze file
        processor = DataProcessor()
        df = processor.parse_file(file_path, file_extension)

        # Validate dataframe
        is_valid, error_msg = processor.validate_dataframe(df)
        if not is_valid:
            os.remove(file_path)  # Clean up
            raise HTTPException(status_code=400, detail=error_msg)

        # Generate schema
        schema = processor.analyze_schema(df)

        # Store in database using UploadService (replaces in-memory storage)
        upload_service = UploadService(db)
        upload_service.store_upload(upload_id=upload_id, filename=filename, schema=schema, df=df)

        return UploadResponse(
            upload_id=upload_id,
            filename=filename,
            data_schema=schema,
            upload_timestamp=datetime.now(),
        )

    except pd.errors.ParserError as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Failed to parse file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail="Failed to parse file.")

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Upload failed for file {filename}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred.")
