#!/usr/bin/env python3
"""
Add userLogo column to user table if missing.
Run: cd tracking-program/8087/flask_app && python scripts/add_user_logo_column.py
Or: cd tracking-program/8087/flask_app && flask user-logo-migrate
"""
import os
import sys

# Add app root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.db_migrations import add_user_logo_column


def main():
    app = create_app()
    with app.app_context():
        result = add_user_logo_column()
        if result == "error":
            sys.exit(1)


if __name__ == "__main__":
    main()
