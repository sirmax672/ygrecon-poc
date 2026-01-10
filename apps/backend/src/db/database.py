"""Database connection and session management."""

import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

# Database URL from environment variable (default: SQLite for POC)
# For PostgreSQL: set DATABASE_URL=postgresql://user:pass@host/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{Path(__file__).parent.parent.parent.parent / 'ygrecon.db'}"
)

# Create engine (database-agnostic via SQLAlchemy)
# SQLite-specific: check_same_thread=False for async compatibility
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,  # Set to True for SQL query logging (debug)
)

# Session factory for FastAPI dependency injection
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    """Initialize database: create tables if they don't exist."""
    from .models import Base  # Import here to avoid circular imports
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print(f"INFO: Database initialized at {DATABASE_URL}")


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
