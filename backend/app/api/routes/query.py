from fastapi import APIRouter, HTTPException
from app.models.schemas import QueryRequest, QueryResponse
from app.services.ai_service import AIService
from app.storage import get_upload
from datetime import datetime

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query", response_model=QueryResponse)
async def query_data(request: QueryRequest):
    """
    Answer natural language questions about uploaded data.

    Phase 4A: Returns text-only answers with conversation context.
    """
    # Validate upload_id exists
    upload_data = get_upload(request.upload_id)
    if not upload_data:
        raise HTTPException(
            status_code=404,
            detail=f"Upload ID {request.upload_id} not found"
        )

    schema = upload_data["schema"]

    # Generate AI response
    ai_service = AIService()
    if not ai_service.enabled:
        raise HTTPException(
            status_code=503,
            detail="AI service is not available. Please configure ANTHROPIC_API_KEY."
        )

    answer, conversation_id = ai_service.generate_query_response(
        upload_id=request.upload_id,
        question=request.question,
        schema=schema,
        conversation_id=request.conversation_id
    )

    return QueryResponse(
        answer=answer,
        conversation_id=conversation_id,
        timestamp=datetime.now()
    )
