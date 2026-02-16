"""
Entry point for development server.
Uses Flask-SocketIO for WebSocket support.
Eventlet monkey patch must run before any other imports.
"""
import eventlet
eventlet.monkey_patch()

import os

from app import create_app
from app.extensions import socketio

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", app.config["PORT"]))
    socketio.run(
        app,
        host="0.0.0.0",
        port=port,
        debug=app.config["ENV"] == "development",
    )
