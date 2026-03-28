"""Rewrite redirect Location headers to relative paths when behind a proxy.

When the license service is behind /license/ and returns redirects, Starlette may
build absolute URLs with the wrong port (e.g. http://localhost/ instead of
http://localhost:8080/). Rewriting to a relative path (e.g. /license/register/)
lets the browser keep the current origin including the correct port.
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from urllib.parse import urlparse
from ..config import settings


class RedirectRewriteMiddleware(BaseHTTPMiddleware):
    """Rewrite redirect Location headers to relative paths for proxy compatibility."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if response.status_code not in (301, 302, 303, 307, 308):
            return response

        location = response.headers.get("location")
        if not location:
            return response

        parsed = urlparse(location)
        if not parsed.netloc:
            return response  # Already relative

        path = parsed.path or "/"
        # Rewrite when path is under /license (our proxy prefix)
        if path.startswith("/license") or (settings.root_path and path.startswith(settings.root_path.rstrip("/"))):
            # Rewrite to relative path so browser keeps current origin (and port)
            new_location = path
            if parsed.query:
                new_location += "?" + parsed.query
            response.headers["location"] = new_location

        return response
