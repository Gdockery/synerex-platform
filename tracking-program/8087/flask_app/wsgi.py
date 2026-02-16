"""
WSGI entry point for production (gunicorn, etc.).
"""
from app import create_app

app = create_app()
