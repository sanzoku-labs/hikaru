"""Tests for Pydantic schema validation."""
import pytest
from pydantic import ValidationError

from app.models.schemas import UserRegister


class TestUserRegisterPasswordValidation:
    """Tests for UserRegister password strength validation."""

    def test_valid_password(self):
        """Test that a valid password passes validation."""
        user = UserRegister(username="test", email="t@t.com", password="StrongPass1")
        assert user.password == "StrongPass1"

    def test_password_missing_uppercase(self):
        """Test that password without uppercase is rejected."""
        with pytest.raises(ValidationError, match="uppercase"):
            UserRegister(username="test", email="t@t.com", password="nouppercase1")

    def test_password_missing_lowercase(self):
        """Test that password without lowercase is rejected."""
        with pytest.raises(ValidationError, match="lowercase"):
            UserRegister(username="test", email="t@t.com", password="NOLOWERCASE1")

    def test_password_missing_digit(self):
        """Test that password without digit is rejected."""
        with pytest.raises(ValidationError, match="digit"):
            UserRegister(username="test", email="t@t.com", password="NoDigitHere")
