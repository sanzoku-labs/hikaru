"""Tests for file upload content validation."""
from app.core.file_validation import validate_file_content


class TestFileValidation:
    """Tests for validate_file_content."""

    def test_valid_csv_passes(self) -> None:
        """Valid UTF-8 CSV content passes validation."""
        content = b"name,age,city\nAlice,30,NYC\nBob,25,LA\n"
        assert validate_file_content(content, "data.csv") is True

    def test_valid_xlsx_magic_passes(self) -> None:
        """Content with XLSX magic bytes (PK header) passes."""
        content = b"PK\x03\x04" + b"\x00" * 100
        assert validate_file_content(content, "data.xlsx") is True

    def test_valid_xls_magic_passes(self) -> None:
        """Content with XLS magic bytes (OLE2) passes."""
        content = b"\xd0\xcf\x11\xe0" + b"\x00" * 100
        assert validate_file_content(content, "data.xls") is True

    def test_wrong_magic_bytes_xlsx_fails(self) -> None:
        """XLSX file with wrong magic bytes fails."""
        content = b"\x00\x00\x00\x00" + b"not a zip file"
        assert validate_file_content(content, "fake.xlsx") is False

    def test_wrong_magic_bytes_xls_fails(self) -> None:
        """XLS file with wrong magic bytes fails."""
        content = b"PK\x03\x04" + b"this is actually a zip"
        assert validate_file_content(content, "fake.xls") is False

    def test_unknown_extension_fails(self) -> None:
        """Unknown file extension is rejected."""
        content = b"some content"
        assert validate_file_content(content, "data.txt") is False

    def test_latin1_csv_passes(self) -> None:
        """Latin-1 encoded CSV passes validation."""
        content = "name,city\nJos\xe9,S\xe3o Paulo\n".encode("latin-1")
        assert validate_file_content(content, "data.csv") is True

    def test_no_extension_fails(self) -> None:
        """File without extension is rejected."""
        content = b"some content"
        assert validate_file_content(content, "noext") is False
