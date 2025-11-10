# Hikaru Backend

AI-powered data insight dashboard backend built with FastAPI.

## Prerequisites

- Python 3.11+
- Poetry (install with: `curl -sSL https://install.python-poetry.org | python3 -`)

## Setup with Poetry (Recommended)

```bash
# Install dependencies
poetry install

# Create .env file
cp .env.example .env

# Activate virtual environment
poetry shell

# Run development server
poetry run uvicorn app.main:app --reload --port 8000
```

## Alternative Setup with pip

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run development server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/upload` - Upload CSV/Excel file for analysis

## Development

```bash
# Run tests (Poetry)
poetry run pytest

# Run tests with coverage (Poetry)
poetry run pytest --cov=app --cov-report=html

# Format code (Poetry)
poetry run black app/

# Lint code (Poetry)
poetry run ruff check app/

# Type checking (Poetry)
poetry run mypy app/

# Run with auto-reload (Poetry)
poetry run uvicorn app.main:app --reload
```

## Poetry Commands

```bash
# Add a new dependency
poetry add package-name

# Add a dev dependency
poetry add --group dev package-name

# Update dependencies
poetry update

# Show installed packages
poetry show

# Export requirements.txt (for compatibility)
poetry export -f requirements.txt --output requirements.txt --without-hashes
```
