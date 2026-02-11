"""Tests for config validators."""
from app.config import Settings


class TestSettingsValidators:
    """Tests for Settings field validators."""

    def test_parse_cors_origins_from_string(self):
        """Test comma-separated CORS origins string is parsed to list."""
        s = Settings(cors_origins="http://a.com, http://b.com")
        assert s.cors_origins == ["http://a.com", "http://b.com"]

    def test_parse_cors_origins_from_list(self):
        """Test list input is passed through unchanged."""
        s = Settings(cors_origins=["http://a.com"])
        assert s.cors_origins == ["http://a.com"]

    def test_parse_allowed_extensions_from_string(self):
        """Test comma-separated extensions string is parsed to list."""
        s = Settings(allowed_extensions="csv,xlsx")
        assert s.allowed_extensions == ["csv", "xlsx"]

    def test_parse_allowed_extensions_from_list(self):
        """Test list input is passed through unchanged."""
        s = Settings(allowed_extensions=["csv", "xlsx"])
        assert s.allowed_extensions == ["csv", "xlsx"]
