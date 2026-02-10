"""
AI Assistant routes - Cross-file AI queries and conversation management.

New feature added in Phase 11 (Feature Expansion).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import User
from app.models.schemas import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ConversationDetailResponse,
    ConversationListResponse,
)
from app.services.ai_assistant_service import AIAssistantService

router = APIRouter(prefix="/api", tags=["assistant"])


@router.post("/assistant/query", response_model=AssistantQueryResponse)
async def query_assistant(
    request: AssistantQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AssistantQueryResponse:
    """
    Query the AI Assistant across multiple files.

    The assistant can answer questions about data in multiple files,
    compare datasets, and suggest visualizations.

    Maximum 5 files per query due to context limits.
    """
    service = AIAssistantService(db)

    try:
        response = service.query_files(
            user_id=current_user.id,
            file_ids=request.file_ids,
            question=request.question,
            conversation_id=request.conversation_id,
        )
        return response

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {str(e)}",
        )


@router.get("/assistant/conversations", response_model=ConversationListResponse)
async def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ConversationListResponse:
    """
    List all AI Assistant conversations for the current user.

    Returns conversations sorted by most recently updated.
    """
    service = AIAssistantService(db)
    return service.list_conversations(user_id=current_user.id)


@router.get("/assistant/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ConversationDetailResponse:
    """
    Get full details of a specific conversation.

    Returns all messages with their content and any generated charts.
    """
    service = AIAssistantService(db)

    try:
        return service.get_conversation(
            user_id=current_user.id,
            conversation_id=conversation_id,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )


@router.delete("/assistant/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete a conversation.

    Removes the conversation and all its messages permanently.
    """
    service = AIAssistantService(db)

    if not service.delete_conversation(
        user_id=current_user.id,
        conversation_id=conversation_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
