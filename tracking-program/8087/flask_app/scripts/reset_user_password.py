#!/usr/bin/env python3
"""
Reset a user's password. Use for dev/test when seed passwords are unknown.
Run: cd tracking-program/8087/flask_app && python scripts/reset_user_password.py <email> <new_password>
Or in Docker: docker exec synerex-platform_tracking-program_1 python scripts/reset_user_password.py greg.dockery@xecoenergy.com password
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from app import create_app
from app.models.user import User
from app.extensions import db


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/reset_user_password.py <email> <new_password>")
        sys.exit(1)
    email = sys.argv[1]
    password = sys.argv[2]
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email, isDeleted=False).first()
        if not user:
            print(f"User not found: {email}")
            sys.exit(1)
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=8))
        user.hashedPassword = hashed.decode("utf-8")
        db.session.commit()
        print(f"Password reset for {email}")
