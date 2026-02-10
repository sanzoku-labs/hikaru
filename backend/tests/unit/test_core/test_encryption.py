"""Tests for token encryption module."""
from unittest.mock import patch

import pytest

from app.core.encryption import PREFIX, decrypt_token, encrypt_token


class TestEncryption:
    """Tests for encrypt_token and decrypt_token."""

    @patch("app.core.encryption.settings")
    def test_roundtrip_encrypt_decrypt(self, mock_settings: object) -> None:
        """Encrypting then decrypting returns the original value."""
        mock_settings.encryption_key = "test-secret-key"
        mock_settings.encryption_salt = "test-salt"

        plaintext = "my-secret-oauth-token-12345"
        encrypted = encrypt_token(plaintext)
        assert encrypted != plaintext
        assert encrypted.startswith(PREFIX)

        decrypted = decrypt_token(encrypted)
        assert decrypted == plaintext

    @patch("app.core.encryption.settings")
    def test_prefix_detection(self, mock_settings: object) -> None:
        """Encrypted tokens start with enc:v1: prefix."""
        mock_settings.encryption_key = "test-secret-key"
        mock_settings.encryption_salt = "test-salt"

        encrypted = encrypt_token("test-token")
        assert encrypted.startswith(PREFIX)

    @patch("app.core.encryption.settings")
    def test_plaintext_passthrough(self, mock_settings: object) -> None:
        """Decrypting a plaintext value returns it unchanged."""
        mock_settings.encryption_key = "test-secret-key"
        mock_settings.encryption_salt = "test-salt"

        plaintext = "not-encrypted-token"
        result = decrypt_token(plaintext)
        assert result == plaintext

    @patch("app.core.encryption.settings")
    def test_no_key_returns_plaintext(self, mock_settings: object) -> None:
        """When ENCRYPTION_KEY is empty, encrypt returns plaintext."""
        mock_settings.encryption_key = ""
        mock_settings.encryption_salt = ""

        result = encrypt_token("my-token")
        assert result == "my-token"
        assert not result.startswith(PREFIX)

    @patch("app.core.encryption.settings")
    def test_tampered_token_raises(self, mock_settings: object) -> None:
        """A tampered encrypted token raises ValueError."""
        mock_settings.encryption_key = "test-secret-key"
        mock_settings.encryption_salt = "test-salt"

        encrypted = encrypt_token("valid-token")
        # Tamper with the ciphertext
        tampered = encrypted[:-5] + "XXXXX"

        with pytest.raises(ValueError, match="Token decryption failed"):
            decrypt_token(tampered)

    @patch("app.core.encryption.settings")
    def test_empty_string_handling(self, mock_settings: object) -> None:
        """Encrypting and decrypting empty string works."""
        mock_settings.encryption_key = "test-secret-key"
        mock_settings.encryption_salt = "test-salt"

        encrypted = encrypt_token("")
        assert encrypted.startswith(PREFIX)
        decrypted = decrypt_token(encrypted)
        assert decrypted == ""

    @patch("app.core.encryption.settings")
    def test_no_key_decrypt_passes_through(self, mock_settings: object) -> None:
        """When ENCRYPTION_KEY is empty, encrypted tokens pass through."""
        mock_settings.encryption_key = "test-secret-key"
        mock_settings.encryption_salt = "test-salt"

        # Encrypt with key
        encrypted = encrypt_token("my-token")
        assert encrypted.startswith(PREFIX)

        # Now simulate no key
        mock_settings.encryption_key = ""
        result = decrypt_token(encrypted)
        # Should return the encrypted value as-is since no key to decrypt
        assert result == encrypted
