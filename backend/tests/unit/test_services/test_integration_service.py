"""
Unit tests for IntegrationService.

Tests cover:
- List providers
- List integrations
- OAuth initiation (success, provider not found)
- OAuth completion (success, invalid state, expired state)
- Disconnect integration (success, not found)
- Browse files (success, not found)
- Import file (success, project not found)
"""
from datetime import datetime, timedelta, timezone
from unittest.mock import Mock

import pytest

from app.services.integration_service import (
    INTEGRATION_PROVIDERS,
    IntegrationService,
    _oauth_states,
)


@pytest.fixture
def mock_db():
    return Mock()


@pytest.fixture
def service(mock_db):
    return IntegrationService(mock_db)


@pytest.fixture(autouse=True)
def clear_oauth_states():
    """Clear OAuth states before each test."""
    _oauth_states.clear()
    yield
    _oauth_states.clear()


# =============================================================================
# Test list_providers
# =============================================================================


def test_list_providers(service):
    """Test listing all available providers."""
    result = service.list_providers()

    assert result.total == len(INTEGRATION_PROVIDERS)
    provider_ids = [p.id for p in result.providers]
    assert "google_sheets" in provider_ids
    assert "airtable" in provider_ids
    assert "notion" in provider_ids
    assert "dropbox" in provider_ids


# =============================================================================
# Test list_integrations
# =============================================================================


def test_list_integrations_empty(service, mock_db):
    """Test listing integrations when user has none."""
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = []

    result = service.list_integrations(user_id=1)

    assert result.total == 0
    assert result.integrations == []


# =============================================================================
# Test initiate_oauth
# =============================================================================


def test_initiate_oauth_success(service):
    """Test successful OAuth initiation."""
    result = service.initiate_oauth(
        user_id=1,
        provider_id="google_sheets",
        redirect_uri="http://localhost:5173/callback",
    )

    assert result.auth_url.startswith("https://accounts.google.com")
    assert result.state is not None
    assert result.state in _oauth_states


def test_initiate_oauth_provider_not_found(service):
    """Test OAuth initiation with unknown provider."""
    with pytest.raises(ValueError, match="not found"):
        service.initiate_oauth(
            user_id=1,
            provider_id="nonexistent",
            redirect_uri="http://localhost/callback",
        )


# =============================================================================
# Test complete_oauth
# =============================================================================


def test_complete_oauth_invalid_state(service):
    """Test OAuth completion with invalid state token."""
    with pytest.raises(ValueError, match="Invalid or expired"):
        service.complete_oauth(
            user_id=1,
            provider_id="google_sheets",
            code="auth-code",
            state="invalid-state",
            redirect_uri="http://localhost/callback",
        )


def test_complete_oauth_expired_state(service):
    """Test OAuth completion with expired state."""
    state = "expired-state-token"
    _oauth_states[state] = {
        "user_id": 1,
        "provider_id": "google_sheets",
        "redirect_uri": "http://localhost/callback",
        "expires_at": datetime.now(timezone.utc) - timedelta(minutes=15),
    }

    with pytest.raises(ValueError, match="expired"):
        service.complete_oauth(
            user_id=1,
            provider_id="google_sheets",
            code="auth-code",
            state=state,
            redirect_uri="http://localhost/callback",
        )


def test_complete_oauth_user_mismatch(service):
    """Test OAuth completion with wrong user."""
    state = "valid-state"
    _oauth_states[state] = {
        "user_id": 999,  # Different user
        "provider_id": "google_sheets",
        "redirect_uri": "http://localhost/callback",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
    }

    with pytest.raises(ValueError, match="user mismatch"):
        service.complete_oauth(
            user_id=1,
            provider_id="google_sheets",
            code="auth-code",
            state=state,
            redirect_uri="http://localhost/callback",
        )


def test_complete_oauth_success(service, mock_db):
    """Test successful OAuth completion (new integration)."""
    state = "good-state"
    _oauth_states[state] = {
        "user_id": 1,
        "provider_id": "google_sheets",
        "redirect_uri": "http://localhost/callback",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
    }

    # No existing integration
    mock_db.query.return_value.filter.return_value.first.return_value = None

    # Mock the new integration object after commit
    mock_integration = Mock()
    mock_integration.id = 1
    mock_integration.provider = "google_sheets"
    mock_integration.provider_account_id = "demo_user_abc"
    mock_integration.provider_email = "demo@example.com"
    mock_integration.is_active = True
    mock_integration.created_at = datetime.now(timezone.utc)
    mock_integration.last_used_at = None

    def mock_refresh(obj):
        obj.id = mock_integration.id
        obj.provider = mock_integration.provider
        obj.provider_account_id = mock_integration.provider_account_id
        obj.provider_email = mock_integration.provider_email
        obj.is_active = mock_integration.is_active
        obj.created_at = mock_integration.created_at
        obj.last_used_at = mock_integration.last_used_at

    mock_db.refresh.side_effect = mock_refresh

    service.complete_oauth(
        user_id=1,
        provider_id="google_sheets",
        code="auth-code",
        state=state,
        redirect_uri="http://localhost/callback",
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    # State should be cleaned up
    assert state not in _oauth_states


# =============================================================================
# Test disconnect_integration
# =============================================================================


def test_disconnect_integration_success(service, mock_db):
    """Test successful disconnection."""
    mock_integration = Mock()
    mock_integration.is_active = True
    mock_db.query.return_value.filter.return_value.first.return_value = mock_integration

    result = service.disconnect_integration(user_id=1, integration_id=1)

    assert result is True
    assert mock_integration.is_active is False
    mock_db.commit.assert_called_once()


def test_disconnect_integration_not_found(service, mock_db):
    """Test disconnecting non-existent integration."""
    mock_db.query.return_value.filter.return_value.first.return_value = None

    result = service.disconnect_integration(user_id=1, integration_id=999)

    assert result is False


# =============================================================================
# Test browse_files
# =============================================================================


def test_browse_files_not_found(service, mock_db):
    """Test browsing files for non-existent integration."""
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError, match="not found"):
        service.browse_files(user_id=1, integration_id=999)


def test_browse_files_success(service, mock_db):
    """Test successful file browsing."""
    mock_integration = Mock()
    mock_integration.provider = "google_sheets"
    mock_integration.access_token = "demo_token"
    mock_db.query.return_value.filter.return_value.first.return_value = mock_integration

    result = service.browse_files(user_id=1, integration_id=1)

    assert result.integration_id == 1
    assert result.provider == "google_sheets"
    assert len(result.files) > 0
    assert len(result.breadcrumbs) > 0


# =============================================================================
# Test import_file
# =============================================================================


def test_import_file_integration_not_found(service, mock_db):
    """Test importing file with non-existent integration."""
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(ValueError, match="Integration not found"):
        service.import_file(
            user_id=1,
            integration_id=999,
            file_id="file_1",
            target_project_id=1,
        )


def test_import_file_project_not_found(service, mock_db):
    """Test importing file to non-existent project."""
    mock_integration = Mock()
    mock_integration.provider = "google_sheets"
    mock_integration.access_token = "demo_token"

    call_count = [0]

    def side_effect(*args, **kwargs):
        # First call: integration query. Second call: project query.
        result = Mock()
        if call_count[0] == 0:
            result.filter.return_value.first.return_value = mock_integration
        else:
            result.filter.return_value.first.return_value = None
        call_count[0] += 1
        return result

    mock_db.query.side_effect = side_effect

    with pytest.raises(ValueError, match="Target project not found"):
        service.import_file(
            user_id=1,
            integration_id=1,
            file_id="file_1",
            target_project_id=999,
        )
