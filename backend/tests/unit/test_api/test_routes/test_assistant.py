"""
Unit tests for assistant API routes (/api/assistant/*).

Tests cover:
- Query assistant endpoint (success, validation error, server error)
- List conversations
- Get conversation detail
- Delete conversation (success, not found)
"""
from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException, status
from starlette.requests import Request

from app.api.routes.assistant import (
    delete_conversation,
    get_conversation,
    list_conversations,
    query_assistant,
)
from app.models.schemas import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    FileContext,
)


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def mock_user():
    user = Mock()
    user.id = 1
    user.email = "test@example.com"
    user.username = "testuser"
    user.is_active = True
    return user


@pytest.fixture
def sample_file_context():
    return FileContext(
        file_id=1,
        filename="test.csv",
        project_id=1,
        project_name="Test Project",
    )


@pytest.fixture
def sample_query_response(sample_file_context):
    return AssistantQueryResponse(
        answer="Revenue is growing steadily.",
        conversation_id="conv-123",
        timestamp=datetime.now(timezone.utc),
        chart=None,
        files_used=[sample_file_context],
    )


# =============================================================================
# Test query_assistant endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_query_assistant_success(mock_db, mock_user, sample_query_response):
    """Test successful AI assistant query."""
    body = AssistantQueryRequest(
        file_ids=[1],
        question="What is the revenue trend?",
    )

    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.query_files.return_value = sample_query_response
        mock_service_class.return_value = mock_service

        result = await query_assistant(
            request=Mock(spec=Request),
            body=body,
            db=mock_db,
            current_user=mock_user,
        )

        assert result.answer == "Revenue is growing steadily."
        assert result.conversation_id == "conv-123"
        mock_service.query_files.assert_called_once_with(
            user_id=mock_user.id,
            file_ids=[1],
            question="What is the revenue trend?",
            conversation_id=None,
        )


@pytest.mark.asyncio
async def test_query_assistant_value_error(mock_db, mock_user):
    """Test assistant query with validation error (e.g., no valid files)."""
    body = AssistantQueryRequest(
        file_ids=[999],
        question="Show me data",
    )

    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.query_files.side_effect = ValueError("No valid files found")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await query_assistant(
                request=Mock(spec=Request),
                body=body,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_query_assistant_server_error(mock_db, mock_user):
    """Test assistant query with unexpected server error."""
    body = AssistantQueryRequest(
        file_ids=[1],
        question="Analyze this",
    )

    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.query_files.side_effect = Exception("AI service down")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await query_assistant(
                request=Mock(spec=Request),
                body=body,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


# =============================================================================
# Test list_conversations endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_conversations_success(mock_db, mock_user):
    """Test listing conversations."""
    mock_response = ConversationListResponse(conversations=[], total=0)

    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.list_conversations.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await list_conversations(
            db=mock_db,
            current_user=mock_user,
        )

        assert result.total == 0
        assert result.conversations == []
        mock_service.list_conversations.assert_called_once_with(user_id=mock_user.id)


# =============================================================================
# Test get_conversation endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_get_conversation_success(mock_db, mock_user):
    """Test getting a conversation by ID."""
    now = datetime.now(timezone.utc)
    mock_response = ConversationDetailResponse(
        conversation_id="conv-123",
        title="Test Conversation",
        file_context=[],
        messages=[],
        created_at=now,
        updated_at=now,
    )

    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.get_conversation.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await get_conversation(
            conversation_id="conv-123",
            db=mock_db,
            current_user=mock_user,
        )

        assert result.conversation_id == "conv-123"
        assert result.title == "Test Conversation"


@pytest.mark.asyncio
async def test_get_conversation_not_found(mock_db, mock_user):
    """Test getting a non-existent conversation."""
    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.get_conversation.side_effect = ValueError("Conversation not found")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await get_conversation(
                conversation_id="nonexistent",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test delete_conversation endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_delete_conversation_success(mock_db, mock_user):
    """Test successful conversation deletion."""
    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.delete_conversation.return_value = True
        mock_service_class.return_value = mock_service

        result = await delete_conversation(
            conversation_id="conv-123",
            db=mock_db,
            current_user=mock_user,
        )

        assert result is None
        mock_service.delete_conversation.assert_called_once_with(
            user_id=mock_user.id,
            conversation_id="conv-123",
        )


@pytest.mark.asyncio
async def test_delete_conversation_not_found(mock_db, mock_user):
    """Test deleting non-existent conversation."""
    with patch("app.api.routes.assistant.AIAssistantService") as mock_service_class:
        mock_service = Mock()
        mock_service.delete_conversation.return_value = False
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await delete_conversation(
                conversation_id="nonexistent",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
