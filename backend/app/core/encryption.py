"""
Token encryption module using Fernet symmetric encryption.

Provides encrypt/decrypt for sensitive tokens (OAuth tokens, API keys).
Uses a versioned prefix (enc:v1:) to distinguish encrypted from plaintext values.
"""
import base64
import hashlib
import logging

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings

logger = logging.getLogger(__name__)

PREFIX = "enc:v1:"


def _get_fernet() -> Fernet | None:
    """Derive a Fernet key from the encryption_key setting."""
    key = settings.encryption_key
    if not key:
        return None
    raw = hashlib.sha256(key.encode() + (settings.encryption_salt or "").encode()).digest()
    fernet_key = base64.urlsafe_b64encode(raw)
    return Fernet(fernet_key)


def encrypt_token(plaintext: str) -> str:
    """Encrypt a token. Returns prefixed ciphertext or plaintext if no key."""
    fernet = _get_fernet()
    if fernet is None:
        return plaintext
    encrypted = fernet.encrypt(plaintext.encode()).decode()
    return f"{PREFIX}{encrypted}"


def decrypt_token(value: str) -> str:
    """Decrypt a token. Passes through plaintext values gracefully."""
    if not value.startswith(PREFIX):
        return value  # plaintext fallback
    fernet = _get_fernet()
    if fernet is None:
        logger.warning("Encrypted token found but ENCRYPTION_KEY not set")
        return value
    try:
        return fernet.decrypt(value[len(PREFIX) :].encode()).decode()
    except InvalidToken:
        logger.error("Failed to decrypt token — possible key mismatch")
        raise ValueError("Token decryption failed")
