"""Rate limiting middleware."""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
from datetime import datetime, timedelta
from ..config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests_per_minute = defaultdict(list)
        self.requests_per_hour = defaultdict(list)
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier (API key, IP, or org)."""
        # Try API key first
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"key:{api_key[:8]}"
        
        # Try license
        x_license = request.headers.get("X-License")
        if x_license:
            try:
                import json
                license_payload = json.loads(x_license)
                org_id = license_payload.get("organization", {}).get("org_id")
                if org_id:
                    return f"org:{org_id}"
            except:
                pass
        
        # Fall back to IP
        return f"ip:{request.client.host if request.client else 'unknown'}"
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        skip_paths = ["/health", "/static", "/admin/login"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        client_id = self._get_client_id(request)
        now = datetime.utcnow()
        
        # Clean old entries
        minute_ago = now - timedelta(minutes=1)
        hour_ago = now - timedelta(hours=1)
        
        self.requests_per_minute[client_id] = [
            ts for ts in self.requests_per_minute[client_id] if ts > minute_ago
        ]
        self.requests_per_hour[client_id] = [
            ts for ts in self.requests_per_hour[client_id] if ts > hour_ago
        ]
        
        # Check limits
        if len(self.requests_per_minute[client_id]) >= settings.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded", "retry_after": 60}
            )
        
        if len(self.requests_per_hour[client_id]) >= settings.rate_limit_per_hour:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded", "retry_after": 3600}
            )
        
        # Record request
        self.requests_per_minute[client_id].append(now)
        self.requests_per_hour[client_id].append(now)
        
        response = await call_next(request)
        response.headers["X-RateLimit-Limit-Minute"] = str(settings.rate_limit_per_minute)
        response.headers["X-RateLimit-Limit-Hour"] = str(settings.rate_limit_per_hour)
        response.headers["X-RateLimit-Remaining-Minute"] = str(
            settings.rate_limit_per_minute - len(self.requests_per_minute[client_id])
        )
        response.headers["X-RateLimit-Remaining-Hour"] = str(
            settings.rate_limit_per_hour - len(self.requests_per_hour[client_id])
        )
        
        return response


