"""
AI Conversation Service - Handles Q&A interactions with data.

This service is responsible for:
- Generating responses to natural language questions
- Managing conversation history
- Parsing chart visualization requests
- Building Q&A prompts with data context

Extracted from AIService as part of Phase 4.1 refactoring.
"""

import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from anthropic import Anthropic

from app.config import settings
from app.models.schemas import ConversationMessage, DataSchema

logger = logging.getLogger(__name__)

# Conversation storage (upload_id -> {conversation_id -> messages})
# TODO: Move to Redis in future phase
_conversations: Dict[str, Dict[str, List[ConversationMessage]]] = {}


class AIConversationService:
    """Service for AI-powered Q&A conversations about data"""

    def __init__(self) -> None:
        """Initialize AIConversationService."""
        if settings.anthropic_api_key:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            logger.warning("ANTHROPIC_API_KEY not set. AI Q&A will be disabled.")

    def generate_query_response(
        self,
        upload_id: str,
        question: str,
        schema: DataSchema,
        conversation_id: Optional[str] = None,
    ) -> tuple[str, str, Optional[Dict[str, Any]]]:
        """
        Generate response to user's natural language question about the data.

        Args:
            upload_id: ID of the uploaded file
            question: User's question
            schema: Dataset schema with column info and preview
            conversation_id: Optional existing conversation ID

        Returns:
            Tuple of (answer, conversation_id, chart_config)
            - answer: AI-generated response
            - conversation_id: Conversation ID (new or existing)
            - chart_config: Optional dict with chart generation instructions
        """
        if not self.enabled:
            return "AI service is not available. Please configure ANTHROPIC_API_KEY.", "", None

        # Get or create conversation
        if conversation_id:
            conversation = self._get_conversation(upload_id, conversation_id)
        else:
            conversation_id = str(uuid.uuid4())
            conversation = []

        # Build prompt with data context and conversation history
        prompt = self._build_query_prompt(question, schema, conversation)

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )

            answer = message.content[0].text.strip()

            # Parse response for chart generation request
            chart_config = self._parse_chart_request(answer)

            # Store conversation (store the answer without JSON formatting)
            clean_answer = self._extract_clean_answer(answer)
            self._store_conversation(upload_id, conversation_id, question, clean_answer)

            return clean_answer, conversation_id, chart_config

        except Exception as e:
            logger.error(f"Error generating query response: {e}")
            return "Sorry, I encountered an error processing your question.", conversation_id, None

    def _build_query_prompt(
        self, question: str, schema: DataSchema, conversation: List[ConversationMessage]
    ) -> str:
        """Build prompt for Q&A with data context"""
        # Format data schema
        column_info = []
        for col in schema.columns:
            info = f"- {col.name} ({col.type})"
            if col.type == "numeric" and col.min is not None:
                info += f": range {col.min:.2f} to {col.max:.2f}, avg {col.mean:.2f}"
            elif col.type == "categorical" and col.unique_values:
                info += f": {col.unique_values} unique values"
                if col.sample_values:
                    samples = ", ".join(str(v) for v in col.sample_values[:5])
                    info += f" (e.g., {samples})"
            column_info.append(info)

        # Format conversation history
        history = ""
        if conversation:
            history = "\n\nPrevious conversation:\n"
            for msg in conversation[-5:]:  # Last 5 messages
                history += f"{msg.role.capitalize()}: {msg.content}\n"

        # Check if this is a visualization request
        viz_keywords = ["show", "visualize", "chart", "graph", "plot", "display", "create"]
        is_viz_request = any(keyword in question.lower() for keyword in viz_keywords)

        if is_viz_request:
            prompt = f"""The user is requesting a DATA VISUALIZATION. You MUST respond in this EXACT format:

[Brief 1-sentence description]

CHART_CONFIG: {{"chart_type": "TYPE", "category_column": "COL", "value_column": "COL", "title": "Title"}}

Dataset columns:
{chr(10).join(column_info)}

Sample data:
{self._format_sample_data(schema.preview[:3])}

User question: {question}

SELECT THE CORRECT CHART TYPE:
- BAR chart: For categorical + numeric (e.g., revenue by region)
- PIE chart: For categorical + numeric showing parts of whole
- LINE chart: For datetime + numeric (trends over time)
- SCATTER: For two numeric columns

RESPOND NOW with the format above. Use ONLY columns that exist in the dataset."""
        else:
            prompt = f"""You are a data analyst helping a user understand their dataset.

Dataset Information:
- Total rows: {schema.row_count}
- Columns:
{chr(10).join(column_info)}

Sample data (first 3 rows):
{self._format_sample_data(schema.preview[:3])}
{history}

User's question: {question}

Provide a clear, concise answer based on the data. If you need specific data values that aren't in the sample, make reasonable inferences based on the schema and sample. Be helpful and specific."""

        return prompt

    def _format_sample_data(self, preview: List[Dict[str, Any]]) -> str:
        """Format sample data rows for prompt"""
        if not preview:
            return "(no sample data)"

        lines = []
        for i, row in enumerate(preview, 1):
            row_str = ", ".join(f"{k}: {v}" for k, v in row.items())
            lines.append(f"  Row {i}: {row_str}")

        return "\n".join(lines)

    def _get_conversation(
        self, upload_id: str, conversation_id: str
    ) -> List[ConversationMessage]:
        """Retrieve conversation history"""
        if upload_id not in _conversations:
            return []
        if conversation_id not in _conversations[upload_id]:
            return []
        return _conversations[upload_id][conversation_id]

    def _store_conversation(
        self, upload_id: str, conversation_id: str, question: str, answer: str
    ) -> None:
        """Store question and answer in conversation history"""
        if upload_id not in _conversations:
            _conversations[upload_id] = {}
        if conversation_id not in _conversations[upload_id]:
            _conversations[upload_id][conversation_id] = []

        now = datetime.now()

        # Add user question
        _conversations[upload_id][conversation_id].append(
            ConversationMessage(role="user", content=question, timestamp=now)
        )

        # Add assistant answer
        _conversations[upload_id][conversation_id].append(
            ConversationMessage(role="assistant", content=answer, timestamp=now)
        )

    def _parse_chart_request(self, answer: str) -> Optional[Dict[str, Any]]:
        """
        Parse AI response for CHART_CONFIG JSON.

        Returns:
            Chart config dict if found, None otherwise
        """
        if "CHART_CONFIG:" not in answer:
            return None

        try:
            # Extract JSON after CHART_CONFIG:
            config_start = answer.find("CHART_CONFIG:")
            config_json = answer[config_start + len("CHART_CONFIG:") :].strip()

            # Find the JSON object
            if config_json.startswith("{"):
                # Find matching closing brace
                brace_count = 0
                end_idx = 0
                for i, char in enumerate(config_json):
                    if char == "{":
                        brace_count += 1
                    elif char == "}":
                        brace_count -= 1
                        if brace_count == 0:
                            end_idx = i + 1
                            break

                config_json = config_json[:end_idx]
                config = json.loads(config_json)

                # Validate required fields
                if "chart_type" in config and "title" in config:
                    return config

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse CHART_CONFIG: {e}")

        return None

    def _extract_clean_answer(self, answer: str) -> str:
        """Remove CHART_CONFIG JSON from answer to get clean text"""
        if "CHART_CONFIG:" in answer:
            config_start = answer.find("CHART_CONFIG:")
            return answer[:config_start].strip()
        return answer

    @staticmethod
    def clear_conversations() -> None:
        """Clear all conversations (useful for testing)"""
        global _conversations
        _conversations.clear()
