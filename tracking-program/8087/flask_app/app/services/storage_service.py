"""
Storage service - ported from api/services/StorageService.js
Helpers for file operations under STORAGE_LOCAL_PATH/files/
"""
import os
from pathlib import Path


def local_path(app, path):
    """Resolve path relative to storage files dir."""
    storage = app.config.get("STORAGE_LOCAL_PATH", "")
    return Path(storage) / "files" / path.lstrip("/")


def web_path(path):
    """Web-accessible path for file."""
    return "/files/" + path.lstrip("/")


def exists_sync(app, path):
    """Check if file exists."""
    return local_path(app, path).exists()


def remove(app, path):
    """Remove file if it exists."""
    fp = local_path(app, path)
    if fp.exists():
        fp.unlink()


def ensure_parent(file_path):
    """Ensure parent directory exists."""
    parent = file_path.parent
    if parent and parent != Path("/"):
        ensure_parent(parent)
        parent.mkdir(parents=True, exist_ok=True)


def write_sync(app, path, content):
    """Write content to file."""
    fp = local_path(app, path)
    ensure_parent(fp)
    fp.write_bytes(content if isinstance(content, bytes) else content.encode("utf-8"))
