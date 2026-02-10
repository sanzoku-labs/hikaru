"""
File upload content validation using magic bytes.

Validates that uploaded file content matches its declared extension.
Prevents disguised file uploads (e.g., binary files renamed to .csv).
"""
import logging

logger = logging.getLogger(__name__)

# Magic bytes for common file formats
XLSX_MAGIC = b"PK\x03\x04"  # ZIP-based (OOXML)
XLS_MAGIC = b"\xd0\xcf\x11\xe0"  # OLE2 compound document


def validate_file_content(content: bytes, filename: str) -> bool:
    """Validate that file content matches its extension."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "csv":
        # CSV should be valid text
        try:
            sample = content[:8192]
            sample.decode("utf-8")
            return True
        except (UnicodeDecodeError, ValueError):
            try:
                sample.decode("latin-1")
                return True
            except (UnicodeDecodeError, ValueError):
                logger.warning(f"File {filename} failed text validation")
                return False

    if ext == "xlsx":
        if not content[:4] == XLSX_MAGIC:
            logger.warning(f"File {filename} has invalid XLSX magic bytes")
            return False
        return True

    if ext == "xls":
        if not content[:4] == XLS_MAGIC:
            logger.warning(f"File {filename} has invalid XLS magic bytes")
            return False
        return True

    return False
