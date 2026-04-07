import atexit
import logging
import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from pathlib import Path
from .config import settings
from .db import Base, engine

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Background lifecycle scheduler — runs daily at 08:00 UTC
# Sends expiration reminders and suspends licenses past their grace period.
# ---------------------------------------------------------------------------
def _run_lifecycle_tasks() -> None:
    """Nightly job: send expiration reminders and handle expired licenses."""
    from .db import SessionLocal
    from .services.lifecycle import send_expiration_reminders, handle_expired_licenses
    db = SessionLocal()
    try:
        reminded = send_expiration_reminders(db)
        handled = handle_expired_licenses(db)
        logger.info("[LIFECYCLE] Scheduled run complete — reminders sent: %d, expired handled: %d", reminded, handled)
    except Exception as exc:
        logger.error("[LIFECYCLE] Scheduled task error: %s", exc, exc_info=True)
    finally:
        db.close()


try:
    from apscheduler.schedulers.background import BackgroundScheduler

    _scheduler = BackgroundScheduler(timezone="UTC", daemon=True)
    _scheduler.add_job(
        _run_lifecycle_tasks,
        trigger="cron",
        hour=8,
        minute=0,
        id="daily_lifecycle",
        replace_existing=True,
        misfire_grace_time=3600,  # allow up to 1-hour delay before skipping
    )
    _scheduler.start()
    atexit.register(lambda: _scheduler.shutdown(wait=False))
    logger.info("[LIFECYCLE] Scheduler started — daily lifecycle job at 08:00 UTC")
except ImportError:
    logger.warning("[LIFECYCLE] APScheduler not installed — lifecycle tasks will not run automatically")
# Import all models to ensure they're registered
from .models import (
    org, license as license_model, authorization, api_key,
    seats, billing, audit, notification, webhook, usage, payment, oem_invoice
)
from .models.user import User
from .models.admin_user import AdminUser
from .routes.authorizations import router as authz_router
from .routes.licenses import router as lic_router
from .routes.api_keys import router as api_keys_router
from .routes.orgs import router as orgs_router
from .routes.seats import router as seats_router
from .routes.audit_api import router as audit_api_router
from .routes.downloads import router as downloads_router
from .routes.billing import router as billing_router
from .routes.registration import router as registration_router
from .routes.stripe_payments import router as stripe_payments_router
from .routes.oem_admin import router as oem_admin_router
from .routes.auth import router as auth_router
from .routes.templates import router as templates_router
from .routes.lifecycle import router as lifecycle_router
from .routes.webhooks import router as webhooks_router
from .routes.analytics import router as analytics_router
from .routes.exports import router as exports_router
from .routes.access import router as access_router
from .admin.ui import router as admin_router

app = FastAPI(title="License Service", docs_url=None)  # Custom /docs with root_path support

# Add CORS middleware BEFORE other middleware
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.session_secret)

# Add usage tracking and rate limiting middleware
if settings.enable_usage_tracking:
    from .middleware.usage_tracking import UsageTrackingMiddleware
    app.add_middleware(UsageTrackingMiddleware)

from .middleware.rate_limit import RateLimitMiddleware
from .middleware.redirect_rewrite import RedirectRewriteMiddleware
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RedirectRewriteMiddleware)

# Add exception handler for 401 errors to prevent redirect loops
@app.exception_handler(HTTPException)
def unauthorized_handler(request: Request, exc: HTTPException):
    """Handle 401 errors by redirecting to login page (for HTML requests only)."""
    if exc.status_code != 401:
        # Return proper HTTP error response instead of re-raising (re-raising causes 500)
        if request.url.path.startswith("/api/"):
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        return HTMLResponse(
            content=f"<h1>{exc.status_code} Error</h1><p>{exc.detail}</p>",
            status_code=exc.status_code
        )
    
    # For API requests, return JSON
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})
    
    # For admin pages (except login), redirect to login
    if request.url.path.startswith("/admin") and request.url.path != "/admin/login":
        return RedirectResponse(url=f"{settings.root_path}/admin/login", status_code=303)
    
    # For other HTML requests, return a simple HTML error
    return HTMLResponse(content=f"<h1>401 Unauthorized</h1><p>{exc.detail}</p>", status_code=401)

app.include_router(registration_router)
app.include_router(stripe_payments_router)
app.include_router(oem_admin_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(orgs_router)
app.include_router(api_keys_router)
app.include_router(authz_router)
app.include_router(lic_router)
app.include_router(seats_router)
app.include_router(audit_api_router)
app.include_router(downloads_router)
app.include_router(billing_router)
app.include_router(templates_router)
app.include_router(lifecycle_router)
app.include_router(webhooks_router)
app.include_router(analytics_router)
app.include_router(exports_router)
app.include_router(access_router)

# Auth endpoint for website MyAccount page
@app.get("/auth/api/check-session")
def check_session(request: Request):
    """
    Check session and return user info.
    Used by website MyAccount page.
    Supports both user login sessions and admin sessions.
    """
    from .db import SessionLocal
    from .models.org import Organization
    from .models.user import User
    from .models.license import License

    def _get_latest_license_id(db, org_id: str) -> str | None:
        """Return the most recent non-revoked license_id for this org."""
        lic = (
            db.query(License)
            .filter(License.org_id == org_id, License.revoked == False, License.suspended == False)
            .order_by(License.issued_at.desc())
            .first()
        )
        return lic.license_id if lic else None

    db = SessionLocal()
    try:
        # Check for user login session first
        username = request.session.get("username")
        user_logged_in = request.session.get("user_logged_in", False)
        
        if user_logged_in and username:
            # User is logged in via client login
            user = db.get(User, username)
            if not user or not user.is_active:
                return JSONResponse(
                    status_code=401,
                    content={"authenticated": False, "message": "User session invalid"}
                )
            
            org = db.get(Organization, user.org_id)
            if not org:
                return JSONResponse(
                    status_code=404,
                    content={"authenticated": False, "message": "Organization not found"}
                )
            
            # Build response for logged-in user
            response = {
                "authenticated": True,
                "user_type": "client",
                "username": username,
                "org_id": org.org_id,
                "org_name": org.org_name,
                "org_type": org.org_type,
                "email": user.email or org.email,
                "license_id": _get_latest_license_id(db, org.org_id),
                "role": user.role,
            }
            
            # Add PE-specific fields if org_type is 'pe'
            if org.org_type == "pe":
                response["user_type"] = "licensed_pe"
                response["pe_approval_status"] = org.pe_approval_status or "pending"
                response["pe_license_number"] = org.pe_license_number
                response["pe_license_state"] = org.pe_license_state
                response["pe_linked_org_id"] = org.pe_linked_org_id
            
            return JSONResponse(content=response, headers={"Cache-Control": "no-store, no-cache, must-revalidate"})
        
        # Check for platform admin session (for Header dropdown: OEM vs Admin)
        admin_logged_in = request.session.get("admin_logged_in", False)
        if admin_logged_in:
            admin_username = request.session.get("admin_username", "Admin")
            return JSONResponse(
                content={"authenticated": True, "user_type": "admin", "username": admin_username, "org_type": None},
                headers={"Cache-Control": "no-store, no-cache, must-revalidate"}
            )
        
        # Fallback: Check for org_id in session (legacy or admin sessions)
        org_id = request.session.get("org_id") or request.query_params.get("org_id")
        
        if not org_id:
            return JSONResponse(
                status_code=401,
                content={"authenticated": False, "message": "No session found"}
            )
        
        # Get organization
        org = db.get(Organization, org_id)
        if not org:
            return JSONResponse(
                status_code=404,
                content={"authenticated": False, "message": "Organization not found"}
            )
        
        # Build response based on org_type
        response = {
            "authenticated": True,
            "username": org.org_name or org.email or "User",
            "org_id": org.org_id,
            "org_name": org.org_name,
            "org_type": org.org_type,
            "email": org.email,
            "license_id": _get_latest_license_id(db, org_id),
        }
        
        # Add PE-specific fields if org_type is 'pe'
        if org.org_type == "pe":
            response["user_type"] = "licensed_pe"
            response["pe_approval_status"] = org.pe_approval_status or "pending"
            response["pe_license_number"] = org.pe_license_number
            response["pe_license_state"] = org.pe_license_state
            response["pe_linked_org_id"] = org.pe_linked_org_id
        
        return JSONResponse(content=response, headers={"Cache-Control": "no-store, no-cache, must-revalidate"})
    finally:
        db.close()

@app.get("/")
def root():
    """Root endpoint - redirects to admin login."""
    return RedirectResponse(url=f"{settings.root_path}/admin/login", status_code=302)

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/api/server/restart")
def api_server_restart(request: Request):
    """
    API endpoint to restart the License Service. Returns JSON for cross-origin calls.
    Uses session-based authentication only (same as other admin endpoints).
    Does NOT modify tokens or payloads - only reads session and returns simple JSON response.
    """
    # Check admin authentication via session (read-only, no modifications)
    try:
        is_admin = bool(request.session.get("admin_logged_in", False))
    except (AttributeError, KeyError, RuntimeError):
        is_admin = False
    
    if not is_admin:
        return JSONResponse(
            status_code=401,
            content={"success": False, "message": f"Not authenticated. Please log in as admin at {settings.root_path or ''}/admin/login first."}
        )
    
    from .db import SessionLocal
    from .admin.ui import log_event
    import platform
    import subprocess
    from pathlib import Path
    
    db = SessionLocal()
    try:
        log_event(db, actor="admin", action="server.restart", ref_id="server", detail={"method": "api_call", "source": "website_dashboard"})

        def _running_in_container() -> bool:
            if os.environ.get("RESTART_VIA_EXIT") == "1":
                return True
            if os.path.exists("/.dockerenv"):
                return True
            if os.environ.get("KUBERNETES_SERVICE_HOST"):
                return True
            try:
                with open("/proc/1/cgroup", "r") as f:
                    return any(x in f.read() for x in ("docker", "containerd", "kubepods"))
            except Exception:
                return False

        if _running_in_container():
            import threading
            import time
            def _exit_for_restart():
                time.sleep(2)
                os._exit(0)
            threading.Thread(target=_exit_for_restart, daemon=True).start()
            message = "Server restart initiated. The service will be back in a few seconds."
        elif platform.system() == "Windows":
            script_path = Path(__file__).resolve().parents[1] / "restart_server.ps1"
            if script_path.exists():
                subprocess.Popen(
                    ["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script_path)],
                    cwd=str(script_path.parent)
                )
                message = "Server restart initiated! The service will restart in a few seconds."
            else:
                main_py = Path(__file__).resolve()
                if main_py.exists():
                    main_py.touch()
                message = "Server reload triggered. If --reload is enabled, the server will restart."
        else:
            main_py = Path(__file__).resolve()
            if main_py.exists():
                main_py.touch()
            message = "Server reload triggered. If --reload is enabled, the server will restart."

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": message}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Restart failed: {str(e)}"}
        )
    finally:
        db.close()

# Stats cache: Redis when REDIS_URL set, else in-memory (15s TTL)
STATS_CACHE_TTL = 15.0
STATS_CACHE_KEY = "license_service:api:stats"

def _get_stats_cache():
    """Return cached stats if valid, else None."""
    if settings.redis_url:
        try:
            import redis
            r = redis.from_url(settings.redis_url)
            raw = r.get(STATS_CACHE_KEY)
            if raw:
                import json
                return json.loads(raw)
        except Exception:
            pass
        return None
    import time as _time
    global _stats_cache, _stats_cache_time
    now = _time.time()
    if _stats_cache is not None and (now - _stats_cache_time) < STATS_CACHE_TTL:
        return _stats_cache
    return None

def _set_stats_cache(result: dict):
    """Store stats in cache."""
    if settings.redis_url:
        try:
            import redis
            import json
            r = redis.from_url(settings.redis_url)
            r.setex(STATS_CACHE_KEY, int(STATS_CACHE_TTL) + 1, json.dumps(result))
        except Exception:
            pass
        return
    global _stats_cache, _stats_cache_time
    _stats_cache = result
    import time as _time
    _stats_cache_time = _time.time()

_stats_cache: dict | None = None
_stats_cache_time: float = 0

@app.get("/api/stats")
def get_stats():
    """Get system statistics and counts. Cached 15s to reduce DB load."""
    cached = _get_stats_cache()
    if cached is not None:
        return cached
    from .db import SessionLocal
    from .models.org import Organization
    from .models.api_key import ApiKey
    from .models.authorization import ProgramAuthorization
    from .models.license import License
    from .models.seats import SeatAssignment
    from .models.billing import BillingOrder
    
    db = SessionLocal()
    try:
        # Wrap queries in try/except to handle potential database errors gracefully
        try:
            organizations = db.query(Organization).count()
        except Exception as e:
            print(f"Error querying organizations: {e}")
            organizations = 0
        
        try:
            api_keys = db.query(ApiKey).count()
            api_keys_active = db.query(ApiKey).filter(ApiKey.is_active == True).count()
        except Exception as e:
            print(f"Error querying api_keys: {e}")
            api_keys = 0
            api_keys_active = 0
        
        try:
            authorizations = db.query(ProgramAuthorization).count()
            authorizations_active = db.query(ProgramAuthorization).filter(ProgramAuthorization.status == "active").count()
        except Exception as e:
            print(f"Error querying authorizations: {e}")
            authorizations = 0
            authorizations_active = 0
        
        try:
            licenses = db.query(License).count()
            licenses_revoked = db.query(License).filter(License.revoked == True).count()
            licenses_suspended = db.query(License).filter(License.suspended == True).count()
        except Exception as e:
            print(f"Error querying licenses: {e}")
            licenses = 0
            licenses_revoked = 0
            licenses_suspended = 0
        
        try:
            seat_assignments = db.query(SeatAssignment).filter(SeatAssignment.is_active == True).count()
        except Exception as e:
            print(f"Error querying seat_assignments: {e}")
            seat_assignments = 0
        
        try:
            billing_orders = db.query(BillingOrder).count()
            billing_orders_pending = db.query(BillingOrder).filter(BillingOrder.status == "pending").count()
            billing_orders_paid = db.query(BillingOrder).filter(BillingOrder.status == "paid").count()
        except Exception as e:
            print(f"Error querying billing_orders: {e}")
            billing_orders = 0
            billing_orders_pending = 0
            billing_orders_paid = 0
        
        result = {
            "organizations": organizations,
            "api_keys": api_keys,
            "api_keys_active": api_keys_active,
            "authorizations": authorizations,
            "authorizations_active": authorizations_active,
            "licenses": licenses,
            "licenses_revoked": licenses_revoked,
            "licenses_suspended": licenses_suspended,
            "seat_assignments": seat_assignments,
            "billing_orders": billing_orders,
            "billing_orders_pending": billing_orders_pending,
            "billing_orders_paid": billing_orders_paid,
        }
        _set_stats_cache(result)
        return result
    except Exception as e:
        # Catch any other unexpected errors
        print(f"Unexpected error in /api/stats: {e}")
        import traceback
        traceback.print_exc()
        # Return a response with error info (this will have CORS headers)
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to load statistics",
                "message": str(e),
                "organizations": 0,
                "api_keys": 0,
                "api_keys_active": 0,
                "authorizations": 0,
                "authorizations_active": 0,
                "licenses": 0,
                "licenses_revoked": 0,
                "licenses_suspended": 0,
                "seat_assignments": 0,
                "billing_orders": 0,
                "billing_orders_pending": 0,
                "billing_orders_paid": 0,
            }
        )
    finally:
        db.close()

# Mount static files - must be after all routes
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Custom Swagger UI with logo and back button
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI with logo and back button."""
    # Use root_path so Swagger fetches openapi.json from correct path when behind /license proxy
    openapi_url = f"{settings.root_path.rstrip('/')}/openapi.json"
    html_response = get_swagger_ui_html(
        openapi_url=openapi_url,
        title=app.title + " - API Documentation",
    )
    
    # Get HTML content from the response
    html_content = html_response.body.decode('utf-8')
    # Fix openapi.json URL when behind proxy (get_swagger_ui_html ignores openapi_url in some versions)
    html_content = html_content.replace(
        "url: '/openapi.json'",
        f"url: '{openapi_url}'",
    )
    # Inject custom CSS and JavaScript (root_path for when behind /license proxy)
    root_path = settings.root_path.rstrip("/") or ""
    custom_css_js = (
        """
    <style>
        .swagger-ui .topbar {
            display: flex;
            align-items: center;
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .swagger-ui .topbar .topbar-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }
        .swagger-ui .topbar .topbar-wrapper .link {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .swagger-ui .topbar .topbar-wrapper .link img {
            height: 40px;
            max-width: 180px;
            filter: brightness(0) invert(1);
        }
        .swagger-ui .topbar .topbar-wrapper .link span {
            display: none;
        }
        .back-button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            margin-left: auto;
        }
        .back-button:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-1px);
        }
    </style>
    <script>
        window.addEventListener('DOMContentLoaded', function() {
            // Replace title text with logo
            setTimeout(function() {
                const topbar = document.querySelector('.swagger-ui .topbar .topbar-wrapper .link');
                if (topbar) {
                    // Hide text
                    const textSpan = topbar.querySelector('span');
                    if (textSpan) {
                        textSpan.style.display = 'none';
                    }

                    // Add logo if not already present
                    if (!topbar.querySelector('img')) {
                        const logoImg = document.createElement('img');
                        logoImg.src = '"""
        + root_path
        + """/static/synerex_logo_color.png';
                        logoImg.alt = 'Synerex';
                        logoImg.style.cssText = 'height: 40px; max-width: 180px; filter: brightness(0) invert(1);';
                        topbar.insertBefore(logoImg, topbar.firstChild);
                    }
                }

                // Add back button
                const topbarWrapper = document.querySelector('.swagger-ui .topbar .topbar-wrapper');
                if (topbarWrapper && !document.querySelector('.back-button')) {
                    const backButton = document.createElement('a');
                    backButton.href = '"""
        + root_path
        + """/admin';
                    backButton.className = 'back-button';
                    backButton.textContent = '← Back to Admin';
                    topbarWrapper.appendChild(backButton);
                }
            }, 100);
        });
    </script>
    """
    )
    
    # Insert custom CSS/JS before closing head tag
    html_content = html_content.replace('</head>', custom_css_js + '</head>')
    
    return HTMLResponse(content=html_content)

