"""
AI Assistant Service - Handles cross-file AI queries.

This service is responsible for:
- Querying across multiple files at once
- Aggregating schemas from multiple files
- Building multi-file context prompts
- Persisting conversation history to database

New feature added in Phase 11 (Feature Expansion).
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from anthropic import Anthropic
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import (
    Conversation,
    ConversationMessage,
    File,
    Project,
)
from app.models.schemas import (
    AssistantQueryResponse,
    ChartData,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationMessageDetail,
    ConversationSummary,
    DataSchema,
    FileContext,
)

logger = logging.getLogger(__name__)


def utc_now():
    """Return current UTC time."""
    return datetime.now(timezone.utc)


class AIAssistantService:
    """Service for AI-powered cross-file queries and conversations."""

    def __init__(self, db: Session) -> None:
        """
        Initialize AIAssistantService.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

        if settings.anthropic_api_key:
            self.client = Anthropic(api_key=settings.anthropic_api_key)
            self.enabled = True
        else:
            self.client = None
            self.enabled = False
            logger.warning("ANTHROPIC_API_KEY not set. AI Assistant will be disabled.")

    def query_files(
        self,
        user_id: int,
        file_ids: List[int],
        question: str,
        conversation_id: Optional[str] = None,
    ) -> AssistantQueryResponse:
        """
        Query across multiple files using AI.

        Args:
            user_id: ID of the user making the query
            file_ids: List of file IDs to query (max 5)
            question: User's question
            conversation_id: Optional existing conversation ID to continue

        Returns:
            AssistantQueryResponse with answer, conversation ID, and context
        """
        # Validate file access and get file data
        files_data = self._get_files_with_context(user_id, file_ids)
        if not files_data:
            raise ValueError("No valid files found or you don't have access to the specified files")

        # Build file context for response
        files_used = [fd["context"] for fd in files_data]

        if not self.enabled:
            return AssistantQueryResponse(
                answer="AI service is not available. Please configure ANTHROPIC_API_KEY.",
                conversation_id=conversation_id or str(uuid.uuid4()),
                timestamp=utc_now(),
                chart=None,
                files_used=files_used,
            )

        # Get or create conversation
        conversation = None
        if conversation_id:
            conversation = self._get_conversation(user_id, conversation_id)

        if not conversation:
            conversation_id = str(uuid.uuid4())
            # Create new conversation in DB
            conversation = Conversation(
                conversation_id=conversation_id,
                user_id=user_id,
                title=None,  # Will be auto-generated from first question
                file_context_json=json.dumps([fc.model_dump() for fc in files_used]),
                created_at=utc_now(),
                updated_at=utc_now(),
            )
            self.db.add(conversation)
            self.db.flush()

        # Get conversation history
        history = self._get_conversation_messages(conversation.id)

        # Build multi-file prompt
        prompt = self._build_multi_file_prompt(question, files_data, history)

        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}],
            )

            answer = message.content[0].text.strip()

            # Parse response for chart generation request
            chart_config = self._parse_chart_request(answer)
            chart = None
            if chart_config:
                chart = self._build_chart_from_config(chart_config, files_data)

            # Clean answer (remove CHART_CONFIG if present)
            clean_answer = self._extract_clean_answer(answer)

            # Store messages in conversation
            self._store_message(conversation.id, "user", question)
            self._store_message(conversation.id, "assistant", clean_answer, chart_config)

            # Auto-generate title if this is the first message
            if not conversation.title:
                conversation.title = self._generate_title(question)

            conversation.updated_at = utc_now()
            self.db.commit()

            return AssistantQueryResponse(
                answer=clean_answer,
                conversation_id=conversation_id,
                timestamp=utc_now(),
                chart=chart,
                files_used=files_used,
            )

        except Exception as e:
            logger.error(f"Error in AI Assistant query: {e}")
            self.db.rollback()

            return AssistantQueryResponse(
                answer="Sorry, I encountered an error processing your question. Please try again.",
                conversation_id=conversation_id,
                timestamp=utc_now(),
                chart=None,
                files_used=files_used,
            )

    def list_conversations(self, user_id: int) -> ConversationListResponse:
        """
        List all conversations for a user.

        Args:
            user_id: ID of the user

        Returns:
            ConversationListResponse with list of conversation summaries
        """
        conversations = (
            self.db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .all()
        )

        summaries = []
        for conv in conversations:
            # Parse file context
            file_context = []
            if conv.file_context_json:
                try:
                    ctx_list = json.loads(conv.file_context_json)
                    file_context = [FileContext(**ctx) for ctx in ctx_list]
                except (json.JSONDecodeError, TypeError):
                    pass

            # Count messages
            msg_count = (
                self.db.query(ConversationMessage)
                .filter(ConversationMessage.conversation_id == conv.id)
                .count()
            )

            summaries.append(
                ConversationSummary(
                    conversation_id=conv.conversation_id,
                    title=conv.title,
                    file_context=file_context,
                    message_count=msg_count,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                )
            )

        return ConversationListResponse(
            conversations=summaries,
            total=len(summaries),
        )

    def get_conversation(self, user_id: int, conversation_id: str) -> ConversationDetailResponse:
        """
        Get full conversation details.

        Args:
            user_id: ID of the user
            conversation_id: UUID of the conversation

        Returns:
            ConversationDetailResponse with full message history
        """
        conversation = self._get_conversation(user_id, conversation_id)
        if not conversation:
            raise ValueError("Conversation not found")

        # Parse file context
        file_context = []
        if conversation.file_context_json:
            try:
                ctx_list = json.loads(conversation.file_context_json)
                file_context = [FileContext(**ctx) for ctx in ctx_list]
            except (json.JSONDecodeError, TypeError):
                pass

        # Get messages
        db_messages = (
            self.db.query(ConversationMessage)
            .filter(ConversationMessage.conversation_id == conversation.id)
            .order_by(ConversationMessage.created_at.asc())
            .all()
        )

        messages = []
        for msg in db_messages:
            chart = None
            if msg.chart_json:
                try:
                    chart_data = json.loads(msg.chart_json)
                    chart = ChartData(**chart_data)
                except (json.JSONDecodeError, TypeError):
                    pass

            messages.append(
                ConversationMessageDetail(
                    id=msg.id,
                    role=msg.role,
                    content=msg.content,
                    chart=chart,
                    created_at=msg.created_at,
                )
            )

        return ConversationDetailResponse(
            conversation_id=conversation.conversation_id,
            title=conversation.title,
            file_context=file_context,
            messages=messages,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        )

    def delete_conversation(self, user_id: int, conversation_id: str) -> bool:
        """
        Delete a conversation.

        Args:
            user_id: ID of the user
            conversation_id: UUID of the conversation

        Returns:
            True if deleted, False if not found
        """
        conversation = self._get_conversation(user_id, conversation_id)
        if not conversation:
            return False

        self.db.delete(conversation)
        self.db.commit()
        return True

    # ===== Private Helper Methods =====

    def _get_files_with_context(
        self, user_id: int, file_ids: List[int]
    ) -> List[Dict[str, Any]]:
        """Get files with their context and schemas."""
        files_data = []

        for file_id in file_ids:
            # Query file with project join
            file_record = (
                self.db.query(File)
                .join(Project)
                .filter(File.id == file_id, Project.user_id == user_id)
                .first()
            )

            if not file_record:
                continue

            # Parse schema
            schema = None
            if file_record.schema_json:
                try:
                    schema = DataSchema(**json.loads(file_record.schema_json))
                except (json.JSONDecodeError, TypeError):
                    pass

            files_data.append({
                "file": file_record,
                "schema": schema,
                "context": FileContext(
                    file_id=file_record.id,
                    filename=file_record.filename,
                    project_id=file_record.project_id,
                    project_name=file_record.project.name,
                ),
            })

        return files_data

    def _get_conversation(self, user_id: int, conversation_id: str) -> Optional[Conversation]:
        """Get conversation by UUID, verifying user ownership."""
        return (
            self.db.query(Conversation)
            .filter(
                Conversation.conversation_id == conversation_id,
                Conversation.user_id == user_id,
            )
            .first()
        )

    def _get_conversation_messages(
        self, conversation_db_id: int
    ) -> List[Tuple[str, str]]:
        """Get conversation message history as (role, content) tuples."""
        messages = (
            self.db.query(ConversationMessage)
            .filter(ConversationMessage.conversation_id == conversation_db_id)
            .order_by(ConversationMessage.created_at.asc())
            .all()
        )
        return [(msg.role, msg.content) for msg in messages]

    def _store_message(
        self,
        conversation_db_id: int,
        role: str,
        content: str,
        chart_config: Optional[Dict] = None,
    ) -> None:
        """Store a message in the conversation."""
        chart_json = json.dumps(chart_config) if chart_config else None

        message = ConversationMessage(
            conversation_id=conversation_db_id,
            role=role,
            content=content,
            chart_json=chart_json,
            created_at=utc_now(),
        )
        self.db.add(message)
        self.db.flush()

    def _build_multi_file_prompt(
        self,
        question: str,
        files_data: List[Dict[str, Any]],
        history: List[Tuple[str, str]],
    ) -> str:
        """Build prompt with context from multiple files."""
        # Build file context section
        file_sections = []
        for fd in files_data:
            context = fd["context"]
            schema = fd["schema"]

            section = f"\n## File: {context.filename} (Project: {context.project_name})\n"

            if schema:
                section += f"Rows: {schema.row_count}\n"
                section += "Columns:\n"
                for col in schema.columns:
                    info = f"  - {col.name} ({col.type})"
                    if col.type == "numeric" and col.min is not None:
                        info += f": range {col.min:.2f} to {col.max:.2f}, avg {col.mean:.2f}"
                    elif col.type == "categorical" and col.unique_values:
                        info += f": {col.unique_values} unique values"
                        if col.sample_values:
                            samples = ", ".join(str(v) for v in col.sample_values[:3])
                            info += f" (e.g., {samples})"
                    section += info + "\n"

                # Sample data
                if schema.preview:
                    section += "\nSample rows:\n"
                    for i, row in enumerate(schema.preview[:2], 1):
                        row_str = ", ".join(f"{k}: {v}" for k, v in list(row.items())[:5])
                        section += f"  Row {i}: {row_str}\n"
            else:
                section += "(Schema not available)\n"

            file_sections.append(section)

        # Build conversation history
        history_text = ""
        if history:
            history_text = "\n\nConversation History:\n"
            for role, content in history[-6:]:  # Last 6 messages (3 exchanges)
                history_text += f"{role.capitalize()}: {content}\n"

        # Check if visualization request
        viz_keywords = ["show", "visualize", "chart", "graph", "plot", "display", "create", "compare"]
        is_viz_request = any(keyword in question.lower() for keyword in viz_keywords)

        if is_viz_request:
            prompt = f"""You are a data analyst assistant helping analyze data across multiple files.

FILES AVAILABLE:
{"".join(file_sections)}
{history_text}

User's Question: {question}

If the user is asking for a visualization, respond with:
1. A brief explanation (1-2 sentences)
2. CHART_CONFIG: {{"chart_type": "TYPE", "category_column": "COL", "value_column": "COL", "title": "Title", "file_id": FILE_ID}}

Chart types: bar, line, pie, scatter
Include file_id to specify which file to use for the chart.

If comparing data across files, explain the comparison in text form.
Use ONLY columns that exist in the specified files."""
        else:
            prompt = f"""You are a data analyst assistant helping analyze data across multiple files.

FILES AVAILABLE:
{"".join(file_sections)}
{history_text}

User's Question: {question}

Provide a helpful, specific answer based on the available data. When referencing data, specify which file it comes from. If comparing across files, highlight similarities and differences."""

        return prompt

    def _parse_chart_request(self, answer: str) -> Optional[Dict[str, Any]]:
        """Parse AI response for CHART_CONFIG JSON."""
        if "CHART_CONFIG:" not in answer:
            return None

        try:
            config_start = answer.find("CHART_CONFIG:")
            config_json = answer[config_start + len("CHART_CONFIG:"):].strip()

            if config_json.startswith("{"):
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

                if "chart_type" in config and "title" in config:
                    return config

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse CHART_CONFIG: {e}")

        return None

    def _extract_clean_answer(self, answer: str) -> str:
        """Remove CHART_CONFIG JSON from answer."""
        if "CHART_CONFIG:" in answer:
            config_start = answer.find("CHART_CONFIG:")
            return answer[:config_start].strip()
        return answer

    def _build_chart_from_config(
        self, config: Dict[str, Any], files_data: List[Dict[str, Any]]
    ) -> Optional[ChartData]:
        """Build ChartData from parsed config."""
        try:
            # Get file_id from config, default to first file
            file_id = config.get("file_id")
            target_file = None

            if file_id:
                for fd in files_data:
                    if fd["context"].file_id == file_id:
                        target_file = fd
                        break

            if not target_file and files_data:
                target_file = files_data[0]

            if not target_file or not target_file["schema"]:
                return None

            # Build minimal chart data
            return ChartData(
                chart_type=config["chart_type"],
                title=config["title"],
                x_column=config.get("category_column"),
                y_column=config.get("value_column"),
                category_column=config.get("category_column"),
                value_column=config.get("value_column"),
                data=[],  # Would need to query actual data
                priority=1,
            )

        except Exception as e:
            logger.error(f"Failed to build chart from config: {e}")
            return None

    def _generate_title(self, question: str) -> str:
        """Generate a short title from the first question."""
        # Truncate to ~50 chars, preserve word boundaries
        if len(question) <= 50:
            return question

        truncated = question[:47]
        last_space = truncated.rfind(" ")
        if last_space > 30:
            truncated = truncated[:last_space]

        return truncated + "..."
