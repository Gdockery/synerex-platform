"""Usage tracking middleware."""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from ..db import SessionLocal
from ..models.usage import UsageEvent
from ..models.license import License
from datetime import datetime
import json

class UsageTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip tracking for certain paths
        skip_paths = ["/health", "/static", "/admin/login", "/docs", "/openapi.json"]
        if any(request.url.path.startswith(path) for path in skip_paths):
            return await call_next(request)
        
        # Extract license from header if present
        license_id = None
        org_id = None
        program_id = None
        
        x_license = request.headers.get("X-License")
        if x_license:
            try:
                license_payload = json.loads(x_license)
                license_id = license_payload.get("license_id")
                org_id = license_payload.get("organization", {}).get("org_id")
                program_id = license_payload.get("program", {}).get("program_id")
            except:
                pass
        
        # Track API call
        if license_id and request.url.path.startswith("/api/"):
            db = SessionLocal()
            try:
                event = UsageEvent(
                    license_id=license_id,
                    org_id=org_id or "unknown",
                    program_id=program_id or "unknown",
                    event_type="api_call",
                    feature_name=request.url.path,
                    event_metadata=json.dumps({
                        "method": request.method,
                        "path": request.url.path,
                        "query": str(request.url.query)
                    }),
                    ip_address=request.client.host if request.client else None
                )
                db.add(event)
                db.commit()
            except Exception as e:
                print(f"[USAGE TRACKING ERROR] {e}")
            finally:
                db.close()
        
        response = await call_next(request)
        return response

