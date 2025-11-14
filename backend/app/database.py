"""
Database connection and session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models.database import Base

# Create database engine
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=False,  # Set to True for SQL logging
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dependency function to get database session.
    Use with FastAPI's Depends() for automatic session management.

    Example:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """
    Create all tables defined in models.
    Should be called during application startup (for development only).
    In production, use Alembic migrations instead.
    """
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """
    Drop all tables (use with caution!).
    Only for development/testing purposes.
    """
    Base.metadata.drop_all(bind=engine)
