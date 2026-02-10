"""
Unit tests for integrations API routes (/api/integrations/*).

Tests cover:
- List providers
- List integrations
- Initiate OAuth (success, error)
- Complete OAuth (success, error)
- Disconnect integration (success, not found)
- Browse files (success, error)
- Import file (success, error)
"""
from datetime import datetime, timezone
from unittest.mock import Mock, patch

import pytest
from fastapi import HTTPException, status

from app.api.routes.integrations import (
    browse_files,
    complete_oauth,
    disconnect_integration,
    import_file,
    initiate_oauth,
    list_integrations,
    list_providers,
)
from app.models.schemas import (
    ImportFromProviderRequest,
    ImportFromProviderResponse,
    IntegrationCreate,
    IntegrationListResponse,
    IntegrationProvider,
    IntegrationProviderListResponse,
    IntegrationResponse,
    OAuthInitiateResponse,
    ProviderBrowseResponse,
    ProviderFolder,
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


# =============================================================================
# Test list_providers endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_providers_success(mock_db, mock_user):
    """Test listing available integration providers."""
    mock_response = IntegrationProviderListResponse(
        providers=[
            IntegrationProvider(
                id="google_sheets",
                name="Google Sheets",
                description="Import from Google Sheets",
                icon="table",
                scopes=["read"],
                is_available=True,
            ),
        ],
        total=1,
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.list_providers.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await list_providers(
            db=mock_db,
            current_user=mock_user,
        )

        assert result.total == 1
        assert result.providers[0].id == "google_sheets"


# =============================================================================
# Test list_integrations endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_list_integrations_success(mock_db, mock_user):
    """Test listing user's connected integrations."""
    mock_response = IntegrationListResponse(integrations=[], total=0)

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.list_integrations.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await list_integrations(
            db=mock_db,
            current_user=mock_user,
        )

        assert result.total == 0
        mock_service.list_integrations.assert_called_once_with(user_id=mock_user.id)


# =============================================================================
# Test initiate_oauth endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_initiate_oauth_success(mock_db, mock_user):
    """Test successful OAuth initiation."""
    mock_response = OAuthInitiateResponse(
        auth_url="https://accounts.google.com/o/oauth2/auth?...",
        state="random-state-token",
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.initiate_oauth.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await initiate_oauth(
            provider="google_sheets",
            redirect_uri="http://localhost:5173/callback",
            db=mock_db,
            current_user=mock_user,
        )

        assert result.auth_url.startswith("https://")
        assert result.state == "random-state-token"


@pytest.mark.asyncio
async def test_initiate_oauth_provider_not_found(mock_db, mock_user):
    """Test OAuth initiation with unknown provider."""
    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.initiate_oauth.side_effect = ValueError("Provider not found")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await initiate_oauth(
                provider="unknown_provider",
                redirect_uri="http://localhost:5173/callback",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


# =============================================================================
# Test complete_oauth endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_complete_oauth_success(mock_db, mock_user):
    """Test successful OAuth completion."""
    now = datetime.now(timezone.utc)
    mock_response = IntegrationResponse(
        id=1,
        provider="google_sheets",
        provider_account_id="user123",
        provider_email="user@gmail.com",
        is_active=True,
        created_at=now,
    )

    request = IntegrationCreate(
        provider="google_sheets",
        code="auth-code-123",
        redirect_uri="http://localhost:5173/callback",
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.complete_oauth.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await complete_oauth(
            provider="google_sheets",
            request=request,
            state="valid-state",
            db=mock_db,
            current_user=mock_user,
        )

        assert result.id == 1
        assert result.provider == "google_sheets"
        assert result.is_active is True


@pytest.mark.asyncio
async def test_complete_oauth_invalid_state(mock_db, mock_user):
    """Test OAuth completion with invalid state."""
    request = IntegrationCreate(
        provider="google_sheets",
        code="auth-code-123",
        redirect_uri="http://localhost:5173/callback",
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.complete_oauth.side_effect = ValueError("Invalid state")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await complete_oauth(
                provider="google_sheets",
                request=request,
                state="bad-state",
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


# =============================================================================
# Test disconnect_integration endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_disconnect_integration_success(mock_db, mock_user):
    """Test successful integration disconnect."""
    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.disconnect_integration.return_value = True
        mock_service_class.return_value = mock_service

        result = await disconnect_integration(
            integration_id=1,
            db=mock_db,
            current_user=mock_user,
        )

        assert result is None
        mock_service.disconnect_integration.assert_called_once_with(
            user_id=mock_user.id,
            integration_id=1,
        )


@pytest.mark.asyncio
async def test_disconnect_integration_not_found(mock_db, mock_user):
    """Test disconnecting non-existent integration."""
    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.disconnect_integration.return_value = False
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await disconnect_integration(
                integration_id=999,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


# =============================================================================
# Test browse_files endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_browse_files_success(mock_db, mock_user):
    """Test browsing integration provider files."""
    mock_response = ProviderBrowseResponse(
        integration_id=1,
        provider="google_sheets",
        files=[],
        folders=[],
        breadcrumbs=[ProviderFolder(id="root", name="My Files", path="/")],
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.browse_files.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await browse_files(
            integration_id=1,
            db=mock_db,
            current_user=mock_user,
        )

        assert result.integration_id == 1
        assert result.provider == "google_sheets"


@pytest.mark.asyncio
async def test_browse_files_not_active(mock_db, mock_user):
    """Test browsing files for inactive integration."""
    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.browse_files.side_effect = ValueError("Integration not found or not active")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await browse_files(
                integration_id=999,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


# =============================================================================
# Test import_file endpoint
# =============================================================================


@pytest.mark.asyncio
async def test_import_file_success(mock_db, mock_user):
    """Test successful file import from provider."""
    mock_response = ImportFromProviderResponse(
        file_id=10,
        filename="imported_sales.csv",
        project_id=1,
        row_count=100,
        import_source="google_sheets",
        provider_file_id="file_1",
    )

    request = ImportFromProviderRequest(
        integration_id=1,
        file_id="file_1",
        target_project_id=1,
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.import_file.return_value = mock_response
        mock_service_class.return_value = mock_service

        result = await import_file(
            request=request,
            db=mock_db,
            current_user=mock_user,
        )

        assert result.file_id == 10
        assert result.import_source == "google_sheets"


@pytest.mark.asyncio
async def test_import_file_integration_not_found(mock_db, mock_user):
    """Test import with non-existent integration."""
    request = ImportFromProviderRequest(
        integration_id=999,
        file_id="file_1",
        target_project_id=1,
    )

    with patch("app.api.routes.integrations.IntegrationService") as mock_service_class:
        mock_service = Mock()
        mock_service.import_file.side_effect = ValueError("Integration not found or not active")
        mock_service_class.return_value = mock_service

        with pytest.raises(HTTPException) as exc_info:
            await import_file(
                request=request,
                db=mock_db,
                current_user=mock_user,
            )

        assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
