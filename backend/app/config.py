from typing import List

from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env")
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # CORS
    cors_origins: str | List[str] = "http://localhost:5173"

    # File Upload
    max_file_size_mb: int = 30
    allowed_extensions: str | List[str] = "csv,xlsx"

    # AI
    anthropic_api_key: str = ""

    # Database
    database_url: str = "sqlite:///./hikaru.db"  # Default to SQLite for backwards compatibility

    # JWT Authentication
    secret_key: str = "your-secret-key-change-in-production"  # MUST be changed in production
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("allowed_extensions", mode="before")
    @classmethod
    def parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip() for ext in v.split(",")]
        return v


settings = Settings()
