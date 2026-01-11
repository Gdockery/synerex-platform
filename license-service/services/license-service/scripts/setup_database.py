"""Setup database with all new tables."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import Base, engine
# Import all models so they're registered with Base
from app.models import (
    org, license as license_model, authorization, api_key,
    seats, billing, audit, notification, webhook, usage, payment
)

def setup_database():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    print("\nCreated tables:")
    for table_name in Base.metadata.tables.keys():
        print(f"  - {table_name}")

if __name__ == "__main__":
    setup_database()


