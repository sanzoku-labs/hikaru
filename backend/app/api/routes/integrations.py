"""
Integrations routes - Third-party data source connections.

Provides endpoints for:
- Listing available integration providers
- OAuth flow management
- File browsing and import from connected sources
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.middleware.auth import get_current_active_user
from app.models.database import User
from app.models.schemas import (
    ImportFromProviderRequest,
    ImportFromProviderResponse,
    IntegrationCreate,
    IntegrationListResponse,
    IntegrationProviderListResponse,
    IntegrationResponse,
    OAuthInitiateResponse,
    ProviderBrowseResponse,
)
from app.services.integration_service import IntegrationService

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("/providers", response_model=IntegrationProviderListResponse)
async def list_providers(
    current_user: User = Depends(get_current_active_user),
) -> IntegrationProviderListResponse:
    """
    List all available integration providers.

    Returns providers like Google Sheets, Airtable, Notion, etc.
    Each provider includes availability status based on OAuth configuration.
    """
    # Providers don't need DB, but require auth
    from app.services.integration_service import IntegrationService
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        service = IntegrationService(db)
        return service.list_providers()
    finally:
        db.close()


@router.get("", response_model=IntegrationListResponse)
async def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> IntegrationListResponse:
    """
    List all connected integrations for the current user.

    Returns active integrations with provider info and last used timestamp.
    """
    service = IntegrationService(db)
    return service.list_integrations(user_id=current_user.id)


@router.post("/{provider}/oauth/initiate", response_model=OAuthInitiateResponse)
async def initiate_oauth(
    provider: str,
    redirect_uri: str = Query(..., description="OAuth redirect URI"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> OAuthInitiateResponse:
    """
    Initiate OAuth flow for a provider.

    Returns the authorization URL to redirect the user to, plus a state token
    for CSRF protection that should be verified in the callback.
    """
    service = IntegrationService(db)

    try:
        return service.initiate_oauth(
            user_id=current_user.id,
            provider_id=provider,
            redirect_uri=redirect_uri,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{provider}/oauth/callback", response_model=IntegrationResponse)
async def complete_oauth(
    provider: str,
    request: IntegrationCreate,
    state: str = Query(..., description="OAuth state token for CSRF validation"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> IntegrationResponse:
    """
    Complete OAuth flow after user authorization.

    Exchanges the authorization code for tokens and creates/updates the integration.
    The state parameter must match the one returned from initiate.
    """
    service = IntegrationService(db)

    try:
        return service.complete_oauth(
            user_id=current_user.id,
            provider_id=provider,
            code=request.code,
            state=state,
            redirect_uri=request.redirect_uri,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_integration(
    integration_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Disconnect an integration.

    This deactivates the integration but doesn't delete the record.
    The user can reconnect later via OAuth.
    """
    service = IntegrationService(db)

    if not service.disconnect_integration(user_id=current_user.id, integration_id=integration_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Integration not found",
        )


@router.get("/{integration_id}/browse", response_model=ProviderBrowseResponse)
async def browse_files(
    integration_id: int,
    folder_id: Optional[str] = Query(None, description="Folder ID to browse (root if None)"),
    page_token: Optional[str] = Query(None, description="Pagination token"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ProviderBrowseResponse:
    """
    Browse files in an integration provider.

    Returns files and folders at the specified location with pagination support.
    Use folder_id to navigate into subfolders.
    """
    service = IntegrationService(db)

    try:
        return service.browse_files(
            user_id=current_user.id,
            integration_id=integration_id,
            folder_id=folder_id,
            page_token=page_token,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/import", response_model=ImportFromProviderResponse)
async def import_file(
    request: ImportFromProviderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ImportFromProviderResponse:
    """
    Import a file from an integration provider.

    Downloads the file from the provider and adds it to the specified project.
    """
    service = IntegrationService(db)

    try:
        return service.import_file(
            user_id=current_user.id,
            integration_id=request.integration_id,
            file_id=request.file_id,
            target_project_id=request.target_project_id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
