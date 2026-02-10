"""
One-time migration script to encrypt existing plaintext OAuth tokens.

Usage:
    cd backend
    poetry run python scripts/encrypt_existing_tokens.py

This reads all Integration records with plaintext access/refresh tokens
and encrypts them using the configured ENCRYPTION_KEY.
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings  # noqa: E402
from app.core.encryption import PREFIX, encrypt_token  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.database import Integration  # noqa: E402


def main() -> None:
    if not settings.encryption_key:
        print("ERROR: ENCRYPTION_KEY not set. Cannot encrypt tokens.")
        sys.exit(1)

    db = SessionLocal()
    try:
        integrations = db.query(Integration).all()
        updated = 0

        for integration in integrations:
            changed = False

            if integration.access_token and not integration.access_token.startswith(PREFIX):
                integration.access_token = encrypt_token(integration.access_token)
                changed = True

            if integration.refresh_token and not integration.refresh_token.startswith(PREFIX):
                integration.refresh_token = encrypt_token(integration.refresh_token)
                changed = True

            if changed:
                updated += 1

        db.commit()
        print(f"Encrypted tokens for {updated} integration(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
