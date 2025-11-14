"""
Unit tests for AIConversationService.

Tests AI-powered Q&A conversations with mocked Anthropic API.
"""
from unittest.mock import Mock, patch

import pytest

from app.models.schemas import ColumnInfo, ConversationMessage, DataSchema
from app.services.ai_conversation_service import AIConversationService


@pytest.fixture
def sample_schema():
    """Create sample data schema"""
    return DataSchema(
        columns=[
            ColumnInfo(
                name="date",
                type="datetime",
                unique_values=12,
                null_count=0,
                sample_values=["2024-01", "2024-02", "2024-03"],
            ),
            ColumnInfo(
                name="revenue",
                type="numeric",
                unique_values=12,
                null_count=0,
                sample_values=[100, 150, 200],
                min=100,
                max=200,
                mean=150,
                median=150,
            ),
        ],
        row_count=12,
        preview=[
            {"date": "2024-01", "revenue": 100},
            {"date": "2024-02", "revenue": 150},
        ],
    )


class TestAIConversationServiceInitialization:
    """Test suite for AIConversationService initialization"""

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_init_with_api_key(self, mock_settings, mock_anthropic_class):
        """Test initialization with API key sets enabled=True"""
        mock_settings.anthropic_api_key = "test-key"
        mock_anthropic_class.return_value = Mock()

        service = AIConversationService()

        assert service.enabled is True
        assert service.client is not None
        mock_anthropic_class.assert_called_once_with(api_key="test-key")

    @patch("app.services.ai_conversation_service.settings")
    def test_init_without_api_key(self, mock_settings):
        """Test initialization without API key sets enabled=False"""
        mock_settings.anthropic_api_key = None

        service = AIConversationService()

        assert service.enabled is False
        assert service.client is None


class TestGenerateQueryResponse:
    """Test suite for generate_query_response method"""

    @patch("app.services.ai_conversation_service.settings")
    def test_disabled_service_returns_error_message(self, mock_settings, sample_schema):
        """Test that disabled service returns error message"""
        mock_settings.anthropic_api_key = None
        service = AIConversationService()

        answer, conv_id, chart_config = service.generate_query_response(
            upload_id="test123",
            question="What is the total revenue?",
            schema=sample_schema,
        )

        assert "not available" in answer.lower()
        assert conv_id == ""
        assert chart_config is None

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_generates_response_successfully(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test successful query response generation"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="The total revenue is $450.")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()
        answer, conv_id, chart_config = service.generate_query_response(
            upload_id="test123",
            question="What is the total revenue?",
            schema=sample_schema,
        )

        assert answer == "The total revenue is $450."
        assert conv_id != ""  # New conversation ID generated
        assert chart_config is None  # No chart request

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_creates_new_conversation_id(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that new conversation ID is generated"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Answer")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()
        _, conv_id1, _ = service.generate_query_response(
            upload_id="test123", question="Question 1", schema=sample_schema
        )
        _, conv_id2, _ = service.generate_query_response(
            upload_id="test123", question="Question 2", schema=sample_schema
        )

        assert conv_id1 != ""
        assert conv_id2 != ""
        assert conv_id1 != conv_id2  # Different conversation IDs

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_uses_existing_conversation_id(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that existing conversation ID is reused"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Answer")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()

        # First question
        _, conv_id, _ = service.generate_query_response(
            upload_id="test123", question="Question 1", schema=sample_schema
        )

        # Second question with same conversation ID
        _, conv_id2, _ = service.generate_query_response(
            upload_id="test123",
            question="Question 2",
            schema=sample_schema,
            conversation_id=conv_id,
        )

        assert conv_id2 == conv_id  # Same conversation ID

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_detects_chart_request(self, mock_settings, mock_anthropic_class, sample_schema):
        """Test that chart generation requests are detected"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        # Response with CHART_CONFIG format (not code blocks)
        mock_message.content = [
            Mock(
                text='Here is a line chart showing revenue over time.\n\nCHART_CONFIG: {"chart_type": "line", "category_column": "date", "value_column": "revenue", "title": "Revenue Over Time"}'
            )
        ]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()
        answer, conv_id, chart_config = service.generate_query_response(
            upload_id="test123",
            question="Show me revenue over time",
            schema=sample_schema,
        )

        assert chart_config is not None
        assert chart_config["chart_type"] == "line"
        assert "title" in chart_config

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_api_error_returns_error_message(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that API errors are handled gracefully"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_client.messages.create.side_effect = Exception("API Error")
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()

        # First, create a conversation to get a conversation_id
        conv_id = "existing-conv-id"

        answer, returned_conv_id, chart_config = service.generate_query_response(
            upload_id="test123",
            question="What is the revenue?",
            schema=sample_schema,
            conversation_id=conv_id,
        )

        assert "error" in answer.lower()
        assert returned_conv_id == conv_id  # Returns the provided conversation_id on error
        assert chart_config is None


class TestConversationManagement:
    """Test suite for conversation storage and retrieval"""

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_stores_conversation_history(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that conversation history is stored"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Answer 1")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()

        # First question
        answer1, conv_id, _ = service.generate_query_response(
            upload_id="test123", question="Question 1", schema=sample_schema
        )

        # Get conversation history
        conversation = service._get_conversation("test123", conv_id)

        # Should store both user question AND assistant answer
        assert len(conversation) == 2
        assert conversation[0].role == "user"
        assert conversation[0].content == "Question 1"
        assert conversation[1].role == "assistant"
        assert conversation[1].content == "Answer 1"

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_maintains_conversation_context(
        self, mock_settings, mock_anthropic_class, sample_schema
    ):
        """Test that conversation context is maintained across questions"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()

        # Mock different responses for each call
        mock_message1 = Mock()
        mock_message1.content = [Mock(text="Answer 1")]
        mock_message2 = Mock()
        mock_message2.content = [Mock(text="Answer 2")]
        mock_client.messages.create.side_effect = [mock_message1, mock_message2]
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()

        # First question
        _, conv_id, _ = service.generate_query_response(
            upload_id="test123", question="Question 1", schema=sample_schema
        )

        # Second question in same conversation
        _, _, _ = service.generate_query_response(
            upload_id="test123",
            question="Question 2",
            schema=sample_schema,
            conversation_id=conv_id,
        )

        # Get conversation history
        conversation = service._get_conversation("test123", conv_id)

        # Should have 4 messages: Q1, A1, Q2, A2
        assert len(conversation) == 4
        assert conversation[0].content == "Question 1"
        assert conversation[1].content == "Answer 1"
        assert conversation[2].content == "Question 2"
        assert conversation[3].content == "Answer 2"

    @patch("app.services.ai_conversation_service.Anthropic")
    @patch("app.services.ai_conversation_service.settings")
    def test_clears_conversation(self, mock_settings, mock_anthropic_class, sample_schema):
        """Test that conversations can be cleared"""
        mock_settings.anthropic_api_key = "test-key"
        mock_client = Mock()
        mock_message = Mock()
        mock_message.content = [Mock(text="Answer")]
        mock_client.messages.create.return_value = mock_message
        mock_anthropic_class.return_value = mock_client

        service = AIConversationService()

        # Create conversation
        _, conv_id, _ = service.generate_query_response(
            upload_id="test123", question="Question", schema=sample_schema
        )

        # Clear all conversations (static method)
        AIConversationService.clear_conversations()

        # Verify it's cleared
        conversation = service._get_conversation("test123", conv_id)
        assert len(conversation) == 0


class TestBuildQueryPrompt:
    """Test suite for _build_query_prompt method"""

    @patch("app.services.ai_conversation_service.settings")
    def test_builds_prompt_with_schema(self, mock_settings, sample_schema):
        """Test that prompt includes schema information"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()
            prompt = service._build_query_prompt("What is revenue?", sample_schema, [])

            assert "revenue" in prompt.lower()
            assert "date" in prompt.lower()
            assert "12" in prompt  # row count

    @patch("app.services.ai_conversation_service.settings")
    def test_includes_conversation_history(self, mock_settings, sample_schema):
        """Test that prompt includes conversation history"""
        mock_settings.anthropic_api_key = "test-key"

        conversation = [
            ConversationMessage(
                role="user", content="Previous question", timestamp="2024-01-01T00:00:00"
            ),
            ConversationMessage(
                role="assistant", content="Previous answer", timestamp="2024-01-01T00:00:01"
            ),
        ]

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()
            prompt = service._build_query_prompt("New question", sample_schema, conversation)

            assert "Previous question" in prompt
            assert "Previous answer" in prompt


class TestParseChartRequest:
    """Test suite for _parse_chart_request method"""

    @patch("app.services.ai_conversation_service.settings")
    def test_parses_valid_chart_request(self, mock_settings):
        """Test parsing valid chart request JSON"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()

            # Use CHART_CONFIG: format (not code blocks)
            response = 'Here is the chart:\n\nCHART_CONFIG: {"chart_type": "bar", "category_column": "category", "value_column": "value", "title": "Bar Chart"}'
            chart_config = service._parse_chart_request(response)

            assert chart_config is not None
            assert chart_config["chart_type"] == "bar"
            assert chart_config["category_column"] == "category"
            assert chart_config["value_column"] == "value"
            assert chart_config["title"] == "Bar Chart"

    @patch("app.services.ai_conversation_service.settings")
    def test_returns_none_for_no_chart_request(self, mock_settings):
        """Test that None is returned when no chart request"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()

            response = "This is just a regular answer without charts."
            chart_config = service._parse_chart_request(response)

            assert chart_config is None

    @patch("app.services.ai_conversation_service.settings")
    def test_handles_invalid_json(self, mock_settings):
        """Test that invalid JSON is handled gracefully"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()

            # Invalid JSON after CHART_CONFIG:
            response = 'CHART_CONFIG: {invalid json}'
            chart_config = service._parse_chart_request(response)

            assert chart_config is None


class TestExtractCleanAnswer:
    """Test suite for _extract_clean_answer method"""

    @patch("app.services.ai_conversation_service.settings")
    def test_removes_json_code_blocks(self, mock_settings):
        """Test that CHART_CONFIG JSON is removed from answer"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()

            # Use CHART_CONFIG: format (not code blocks)
            answer = 'Revenue is trending up.\n\nCHART_CONFIG: {"chart_type": "line", "title": "Revenue Trend"}'
            clean = service._extract_clean_answer(answer)

            assert "Revenue is trending up." in clean
            assert "CHART_CONFIG:" not in clean
            assert "chart_type" not in clean

    @patch("app.services.ai_conversation_service.settings")
    def test_preserves_answer_without_json(self, mock_settings):
        """Test that answers without JSON are preserved"""
        mock_settings.anthropic_api_key = "test-key"

        with patch("app.services.ai_conversation_service.Anthropic"):
            service = AIConversationService()

            answer = "The total revenue is $450."
            clean = service._extract_clean_answer(answer)

            assert clean == answer
