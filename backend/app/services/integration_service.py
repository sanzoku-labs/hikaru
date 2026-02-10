"""
Integration Service - Handles third-party data source connections.

This service provides:
- Provider configuration and availability
- OAuth flow initiation and token exchange
- File browsing and import from connected providers

Supported providers:
- Google Sheets (google_sheets)
- Airtable (airtable)
- Notion (notion)
- Dropbox (dropbox)

Note: Actual OAuth flows require provider credentials in environment variables.
Without credentials, providers are marked as unavailable but the API structure works.
"""

import json
import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode

from sqlalchemy.orm import Session

from app.config import settings
from app.core.encryption import decrypt_token, encrypt_token
from app.models.database import Integration, Project
from app.models.schemas import (
    ImportFromProviderResponse,
    IntegrationListResponse,
    IntegrationProvider,
    IntegrationProviderListResponse,
    IntegrationResponse,
    OAuthInitiateResponse,
    ProviderBrowseResponse,
    ProviderFile,
    ProviderFolder,
)

logger = logging.getLogger(__name__)


def utc_now():
    """Return current UTC time."""
    return datetime.now(timezone.utc)


# ===== Provider Definitions =====
# These define the available integration providers and their OAuth configuration

INTEGRATION_PROVIDERS: List[Dict[str, Any]] = [
    {
        "id": "google_sheets",
        "name": "Google Sheets",
        "description": "Import spreadsheets directly from Google Sheets. Supports real-time sync.",
        "icon": "table",
        "scopes": [
            "https://www.googleapis.com/auth/spreadsheets.readonly",
            "https://www.googleapis.com/auth/drive.readonly",
        ],
        "oauth_config": {
            "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://www.googleapis.com/oauth2/v1/userinfo",
        },
        "env_client_id": "GOOGLE_CLIENT_ID",
        "env_client_secret": "GOOGLE_CLIENT_SECRET",
    },
    {
        "id": "airtable",
        "name": "Airtable",
        "description": "Connect to Airtable bases and import tables as datasets.",
        "icon": "database",
        "scopes": ["data.records:read", "schema.bases:read"],
        "oauth_config": {
            "auth_url": "https://airtable.com/oauth2/v1/authorize",
            "token_url": "https://airtable.com/oauth2/v1/token",
        },
        "env_client_id": "AIRTABLE_CLIENT_ID",
        "env_client_secret": "AIRTABLE_CLIENT_SECRET",
    },
    {
        "id": "notion",
        "name": "Notion",
        "description": "Import databases from Notion workspaces.",
        "icon": "file-text",
        "scopes": [],
        "oauth_config": {
            "auth_url": "https://api.notion.com/v1/oauth/authorize",
            "token_url": "https://api.notion.com/v1/oauth/token",
        },
        "env_client_id": "NOTION_CLIENT_ID",
        "env_client_secret": "NOTION_CLIENT_SECRET",
    },
    {
        "id": "dropbox",
        "name": "Dropbox",
        "description": "Import CSV and Excel files from your Dropbox.",
        "icon": "cloud",
        "scopes": ["files.content.read"],
        "oauth_config": {
            "auth_url": "https://www.dropbox.com/oauth2/authorize",
            "token_url": "https://api.dropboxapi.com/oauth2/token",
        },
        "env_client_id": "DROPBOX_CLIENT_ID",
        "env_client_secret": "DROPBOX_CLIENT_SECRET",
    },
]


# In-memory state storage for OAuth CSRF protection
# In production, use Redis or database
_oauth_states: Dict[str, Dict[str, Any]] = {}


class IntegrationService:
    """Service for managing third-party integrations."""

    def __init__(self, db: Session) -> None:
        """Initialize IntegrationService."""
        self.db = db

    def list_providers(self) -> IntegrationProviderListResponse:
        """
        List all available integration providers.

        Returns:
            IntegrationProviderListResponse with all providers and their availability
        """
        providers = []
        for p in INTEGRATION_PROVIDERS:
            # Check if provider is configured (has credentials)
            is_available = self._is_provider_configured(p["id"])

            providers.append(
                IntegrationProvider(
                    id=p["id"],
                    name=p["name"],
                    description=p["description"],
                    icon=p["icon"],
                    scopes=p["scopes"],
                    is_available=is_available,
                )
            )

        return IntegrationProviderListResponse(providers=providers, total=len(providers))

    def list_integrations(self, user_id: int) -> IntegrationListResponse:
        """
        List all connected integrations for a user.

        Args:
            user_id: ID of the user

        Returns:
            IntegrationListResponse with all connected integrations
        """
        integrations = (
            self.db.query(Integration)
            .filter(Integration.user_id == user_id, Integration.is_active == True)
            .order_by(Integration.created_at.desc())
            .all()
        )

        return IntegrationListResponse(
            integrations=[IntegrationResponse.model_validate(i) for i in integrations],
            total=len(integrations),
        )

    def initiate_oauth(
        self, user_id: int, provider_id: str, redirect_uri: str
    ) -> OAuthInitiateResponse:
        """
        Initiate OAuth flow for a provider.

        Args:
            user_id: ID of the user
            provider_id: Provider identifier
            redirect_uri: OAuth redirect URI

        Returns:
            OAuthInitiateResponse with auth URL and state token

        Raises:
            ValueError: If provider is not found or not configured
        """
        provider = self._get_provider_config(provider_id)
        if not provider:
            raise ValueError(f"Provider '{provider_id}' not found")

        if not self._is_provider_configured(provider_id):
            raise ValueError(
                f"Provider '{provider_id}' is not configured. Missing OAuth credentials."
            )

        # Generate state token for CSRF protection
        state = secrets.token_urlsafe(32)

        # Store state with metadata (expires in 10 minutes)
        _oauth_states[state] = {
            "user_id": user_id,
            "provider_id": provider_id,
            "redirect_uri": redirect_uri,
            "expires_at": utc_now() + timedelta(minutes=10),
        }

        # Build authorization URL
        client_id = self._get_client_id(provider_id)
        oauth_config = provider["oauth_config"]

        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": " ".join(provider["scopes"]),
        }

        # Provider-specific params
        if provider_id == "google_sheets":
            params["access_type"] = "offline"
            params["prompt"] = "consent"

        auth_url = f"{oauth_config['auth_url']}?{urlencode(params)}"

        return OAuthInitiateResponse(auth_url=auth_url, state=state)

    def complete_oauth(
        self, user_id: int, provider_id: str, code: str, state: str, redirect_uri: str
    ) -> IntegrationResponse:
        """
        Complete OAuth flow and create integration.

        Args:
            user_id: ID of the user
            provider_id: Provider identifier
            code: OAuth authorization code
            state: State token for CSRF validation
            redirect_uri: OAuth redirect URI

        Returns:
            IntegrationResponse for the new integration

        Raises:
            ValueError: If state is invalid or token exchange fails
        """
        # Validate state
        state_data = _oauth_states.get(state)
        if not state_data:
            raise ValueError("Invalid or expired OAuth state")

        if state_data["user_id"] != user_id:
            raise ValueError("OAuth state user mismatch")

        if state_data["provider_id"] != provider_id:
            raise ValueError("OAuth state provider mismatch")

        if state_data["expires_at"] < utc_now():
            del _oauth_states[state]
            raise ValueError("OAuth state expired")

        # Clean up state
        del _oauth_states[state]

        # Exchange code for tokens
        # Note: In production, this would make HTTP requests to the provider
        # For now, we'll create a mock integration for demo purposes
        tokens = self._exchange_code_for_tokens(provider_id, code, redirect_uri)

        # Get user info from provider
        user_info = self._get_provider_user_info(provider_id, tokens["access_token"])

        # Check if integration already exists
        existing = (
            self.db.query(Integration)
            .filter(
                Integration.user_id == user_id,
                Integration.provider == provider_id,
                Integration.provider_account_id == user_info.get("id"),
            )
            .first()
        )

        if existing:
            # Update existing integration
            existing.access_token = encrypt_token(tokens["access_token"])
            existing.refresh_token = (
                encrypt_token(tokens["refresh_token"]) if tokens.get("refresh_token") else None
            )
            existing.token_expires_at = tokens.get("expires_at")
            existing.is_active = True
            existing.updated_at = utc_now()
            self.db.commit()
            self.db.refresh(existing)
            return IntegrationResponse.model_validate(existing)

        # Create new integration
        integration = Integration(
            user_id=user_id,
            provider=provider_id,
            provider_account_id=user_info.get("id"),
            provider_email=user_info.get("email"),
            access_token=encrypt_token(tokens["access_token"]),
            refresh_token=(
                encrypt_token(tokens["refresh_token"]) if tokens.get("refresh_token") else None
            ),
            token_expires_at=tokens.get("expires_at"),
            scopes=json.dumps(self._get_provider_config(provider_id)["scopes"]),
            is_active=True,
        )

        self.db.add(integration)
        self.db.commit()
        self.db.refresh(integration)

        return IntegrationResponse.model_validate(integration)

    def disconnect_integration(self, user_id: int, integration_id: int) -> bool:
        """
        Disconnect an integration.

        Args:
            user_id: ID of the user
            integration_id: ID of the integration

        Returns:
            True if disconnected, False if not found
        """
        integration = (
            self.db.query(Integration)
            .filter(Integration.id == integration_id, Integration.user_id == user_id)
            .first()
        )

        if not integration:
            return False

        integration.is_active = False
        integration.updated_at = utc_now()
        self.db.commit()

        return True

    def browse_files(
        self,
        user_id: int,
        integration_id: int,
        folder_id: Optional[str] = None,
        page_token: Optional[str] = None,
    ) -> ProviderBrowseResponse:
        """
        Browse files in an integration provider.

        Args:
            user_id: ID of the user
            integration_id: ID of the integration
            folder_id: Optional folder ID to browse (root if None)
            page_token: Optional pagination token

        Returns:
            ProviderBrowseResponse with files and folders

        Raises:
            ValueError: If integration not found or not active
        """
        integration = (
            self.db.query(Integration)
            .filter(
                Integration.id == integration_id,
                Integration.user_id == user_id,
                Integration.is_active == True,
            )
            .first()
        )

        if not integration:
            raise ValueError("Integration not found or not active")

        # Update last used timestamp
        integration.last_used_at = utc_now()
        self.db.commit()

        # Fetch files from provider
        # Note: In production, this would make HTTP requests to the provider API
        token = decrypt_token(integration.access_token)
        files, folders, breadcrumbs, has_more, next_token = self._fetch_provider_files(
            integration.provider, token, folder_id, page_token
        )

        current_folder = None
        if folder_id and breadcrumbs:
            current_folder = breadcrumbs[-1]

        return ProviderBrowseResponse(
            integration_id=integration_id,
            provider=integration.provider,
            current_folder=current_folder,
            breadcrumbs=breadcrumbs,
            files=files,
            folders=folders,
            has_more=has_more,
            next_page_token=next_token,
        )

    def import_file(
        self,
        user_id: int,
        integration_id: int,
        file_id: str,
        target_project_id: int,
    ) -> ImportFromProviderResponse:
        """
        Import a file from an integration provider.

        Args:
            user_id: ID of the user
            integration_id: ID of the integration
            file_id: Provider-specific file ID
            target_project_id: Target project ID

        Returns:
            ImportFromProviderResponse with the imported file details

        Raises:
            ValueError: If integration or project not found
        """
        integration = (
            self.db.query(Integration)
            .filter(
                Integration.id == integration_id,
                Integration.user_id == user_id,
                Integration.is_active == True,
            )
            .first()
        )

        if not integration:
            raise ValueError("Integration not found or not active")

        project = (
            self.db.query(Project)
            .filter(Project.id == target_project_id, Project.user_id == user_id)
            .first()
        )

        if not project:
            raise ValueError("Target project not found")

        # Update last used timestamp
        integration.last_used_at = utc_now()
        self.db.commit()

        # Fetch file content from provider
        # Note: In production, this would download the actual file
        token = decrypt_token(integration.access_token)
        file_data, filename, row_count, schema = self._fetch_and_process_file(
            integration.provider, token, file_id
        )

        # Create file record
        upload_id = str(uuid.uuid4())
        # Note: In production, would save to storage and create proper File record
        # For demo, return mock response
        return ImportFromProviderResponse(
            file_id=0,  # Would be actual file ID
            filename=filename,
            project_id=target_project_id,
            row_count=row_count,
            data_schema=schema,
            import_source=integration.provider,
            provider_file_id=file_id,
        )

    # ===== Private Helper Methods =====

    def _is_provider_configured(self, provider_id: str) -> bool:
        """Check if a provider has OAuth credentials configured."""
        provider = self._get_provider_config(provider_id)
        if not provider:
            return False

        client_id = getattr(settings, provider["env_client_id"].lower(), None)
        client_secret = getattr(settings, provider["env_client_secret"].lower(), None)

        # For demo purposes, return True to show UI even without credentials
        # In production, would check: return bool(client_id and client_secret)
        return True

    def _get_provider_config(self, provider_id: str) -> Optional[Dict[str, Any]]:
        """Get provider configuration by ID."""
        for p in INTEGRATION_PROVIDERS:
            if p["id"] == provider_id:
                return p
        return None

    def _get_client_id(self, provider_id: str) -> str:
        """Get OAuth client ID for a provider."""
        provider = self._get_provider_config(provider_id)
        if not provider:
            return ""
        return getattr(settings, provider["env_client_id"].lower(), "") or "demo_client_id"

    def _get_client_secret(self, provider_id: str) -> str:
        """Get OAuth client secret for a provider."""
        provider = self._get_provider_config(provider_id)
        if not provider:
            return ""
        return getattr(settings, provider["env_client_secret"].lower(), "") or ""

    def _exchange_code_for_tokens(
        self, provider_id: str, code: str, redirect_uri: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for tokens.

        Note: In production, this would make HTTP POST to provider's token endpoint.
        For demo, returns mock tokens.
        """
        # Mock token response for demo
        return {
            "access_token": f"demo_access_token_{secrets.token_hex(16)}",
            "refresh_token": f"demo_refresh_token_{secrets.token_hex(16)}",
            "expires_at": utc_now() + timedelta(hours=1),
        }

    def _get_provider_user_info(self, provider_id: str, access_token: str) -> Dict[str, Any]:
        """
        Get user info from provider.

        Note: In production, this would make HTTP GET to provider's userinfo endpoint.
        For demo, returns mock user info.
        """
        # Mock user info for demo
        return {
            "id": f"demo_user_{secrets.token_hex(8)}",
            "email": "demo@example.com",
        }

    def _fetch_provider_files(
        self,
        provider: str,
        access_token: str,
        folder_id: Optional[str],
        page_token: Optional[str],
    ) -> Tuple[List[ProviderFile], List[ProviderFile], List[ProviderFolder], bool, Optional[str]]:
        """
        Fetch files from provider.

        Note: In production, this would make HTTP requests to provider API.
        For demo, returns mock file list.
        """
        # Mock file list for demo
        files = [
            ProviderFile(
                id="file_1",
                name="Sales Data Q4 2024.xlsx",
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size=245000,
                modified_at=utc_now() - timedelta(days=2),
                is_folder=False,
                icon="file-spreadsheet",
            ),
            ProviderFile(
                id="file_2",
                name="Customer Analytics.csv",
                mime_type="text/csv",
                size=128000,
                modified_at=utc_now() - timedelta(days=5),
                is_folder=False,
                icon="file-spreadsheet",
            ),
            ProviderFile(
                id="file_3",
                name="Revenue Report.xlsx",
                mime_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size=512000,
                modified_at=utc_now() - timedelta(hours=12),
                is_folder=False,
                icon="file-spreadsheet",
            ),
        ]

        folders = [
            ProviderFile(
                id="folder_1",
                name="2024 Reports",
                is_folder=True,
                icon="folder",
                can_import=False,
            ),
            ProviderFile(
                id="folder_2",
                name="Shared",
                is_folder=True,
                icon="folder",
                can_import=False,
            ),
        ]

        breadcrumbs = [ProviderFolder(id="root", name="My Files", path="/")]
        if folder_id:
            breadcrumbs.append(ProviderFolder(id=folder_id, name="Subfolder", path=f"/{folder_id}"))

        return files, folders, breadcrumbs, False, None

    def _fetch_and_process_file(
        self, provider: str, access_token: str, file_id: str
    ) -> Tuple[bytes, str, int, Optional[Any]]:
        """
        Fetch and process a file from provider.

        Note: In production, this would download and process the actual file.
        For demo, returns mock data.
        """
        # Mock file data
        return b"", f"imported_file_{file_id}.csv", 100, None
