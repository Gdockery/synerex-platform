"""
Configuration for Tracking Program Flask app.
Ported from tracking-program/8087/config/local.js, datastores.js, constants.js.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from flask_app/ or parent 8087/ for local dev
_config_dir = Path(__file__).resolve().parent.parent  # flask_app/
for _env_path in (_config_dir / ".env", _config_dir.parent / ".env"):
    if _env_path.exists():
        load_dotenv(dotenv_path=_env_path)
        break
else:
    load_dotenv()

# Paths - resolved relative to this file
_BASE_DIR = Path(__file__).resolve().parent.parent
# 8087 root: in Docker /app/8087, locally tracking-program/8087 (parent of flask_app)
_8087_ROOT = _BASE_DIR.parent / "8087" if (_BASE_DIR.parent / "8087").exists() else _BASE_DIR.parent


class Config:
    """Base configuration from environment."""

    # Database (PyMySQL: use mysql+pymysql:// in URL)
    TRACKING_DB_URL = os.environ.get("TRACKING_DB_URL", "")
    if TRACKING_DB_URL and TRACKING_DB_URL.startswith("mysql://"):
        SQLALCHEMY_DATABASE_URI = TRACKING_DB_URL.replace("mysql://", "mysql+pymysql://", 1)
    elif TRACKING_DB_URL:
        SQLALCHEMY_DATABASE_URI = TRACKING_DB_URL
    else:
        # Fallback when no DB URL - app can start, DB calls will fail
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True, "pool_recycle": 300}
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Per-org database (consistent with EMV) - each org gets own DB file
    # When True + SQLite: use tracking_data/org_{org_id}/tracking.db
    # When MySQL (TRACKING_DB_URL): shared DB for now (MySQL per-org can be added later)
    TRACKING_USE_PER_ORG_DB = os.environ.get("TRACKING_USE_PER_ORG_DB", "false").lower() in ("1", "true", "yes")
    # Path for per-org SQLite databases (default: flask_app/tracking_data)
    TRACKING_RESULTS_DIR = os.environ.get("TRACKING_RESULTS_DIR", "")

    # -------------------------------------------------------------------------
    # EMV Integration (Bill Analytic import, Push Analysis to Tracking)
    # -------------------------------------------------------------------------
    # API key for service-to-service calls from EMV. Set in .env as EMV_API_KEY.
    # Same value must be set in EMV .env. See flask_app/docs/EMV_INTEGRATION.md.
    EMV_API_KEY = os.environ.get("EMV_API_KEY", "")

    # Tariff Rate Lookup — optional free API keys for higher-quality lookups
    # Register at https://openei.org/services/API/signup/ (NREL URDB, US tariff detail)
    # Register at https://www.eia.gov/opendata/register.php (EIA, US state averages)
    NREL_API_KEY = os.environ.get("NREL_API_KEY", "")
    EIA_API_KEY  = os.environ.get("EIA_API_KEY", "")

    # License Service
    LICENSE_SERVICE_URL = os.environ.get("LICENSE_SERVICE_URL", "http://localhost:8000")
    # Browser-accessible URL for links/redirects (e.g. http://localhost:8080/license). Uses internal URL if unset.
    LICENSE_SERVICE_PUBLIC_URL = os.environ.get("LICENSE_SERVICE_PUBLIC_URL", "")
    LICENSE_PROGRAM_ID = "tracking"

    # Synerex Platform URLs
    EMV_URL = os.environ.get("EMV_URL") or "http://localhost:8082"
    MY_ACCOUNT_URL = os.environ.get("MY_ACCOUNT_URL") or "http://localhost:5173"
    # Website home (Synerex homepage) - for logout redirect. Default: derive from MY_ACCOUNT_URL
    WEBSITE_URL = os.environ.get("WEBSITE_URL") or ""
    # Public URL for My Account / website when Docker uses internal hostnames. E.g. http://localhost:5173
    TRACKING_PUBLIC_WEBSITE_URL = os.environ.get("TRACKING_PUBLIC_WEBSITE_URL") or ""

    # Application
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
    # Use a distinct cookie name to avoid collision with license-service's "session" cookie
    SESSION_COOKIE_NAME = "tracking_session"
    # Redis session store (optional). When REDIS_URL is set, sessions use Redis.
    REDIS_URL = os.environ.get("REDIS_URL", "")
    SESSION_TYPE = "redis" if REDIS_URL else "filesystem"
    SESSION_REDIS = None
    if REDIS_URL:
        try:
            import redis
            SESSION_REDIS = redis.from_url(REDIS_URL)
        except Exception:
            SESSION_TYPE = "filesystem"
            SESSION_REDIS = None
    PORT = int(os.environ.get("PORT", 8087))
    ENV = os.environ.get("FLASK_ENV", os.environ.get("NODE_ENV", "development"))
    # Use "test_prod" to skip S3 redirect in prod-like runs
    ENVIRONMENT = os.environ.get("ENVIRONMENT", os.environ.get("FLASK_ENV", "development"))

    # Sockets
    TRACKING_BASE_URL = os.environ.get("TRACKING_BASE_URL", "http://localhost:8087")
    # Base path when behind proxy (e.g. /tracking). Empty when served at root.
    _base = (__import__("urllib.parse", fromlist=["urlparse"]).urlparse(TRACKING_BASE_URL).path or "").rstrip("/")
    APPLICATION_ROOT = _base if _base and _base != "/" else ""
    LOGIN_VIEW = (APPLICATION_ROOT + "/login") if APPLICATION_ROOT else "/login"
    LOGIN_VIEW = (APPLICATION_ROOT + "/login") if APPLICATION_ROOT else "/login"

    # Email (for password reset and invites)
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    # Base URL for invite links (e.g. https://portal.xecoenergy.com)
    EMAIL_HOST = os.environ.get("EMAIL_HOST", "")  # e.g. https://portal.xecoenergy.com
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() in ("1", "true", "yes")
    MAIL_FROM = os.environ.get("MAIL_FROM", "noreply@tracking.local")

    # Static / S3 - in production (FLASK_ENV=production), /js, /css, /images redirect to S3
    S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME", "")
    S3_REGION = os.environ.get("S3_REGION", "")

    # Storage - local path for /files/* and uploads
    _storage_default = str(_8087_ROOT / "assets")
    STORAGE_LOCAL_PATH = os.environ.get("STORAGE_LOCAL_PATH", _storage_default)

    # Whitelabel
    WHITELABEL_BASE_PATH = os.environ.get(
        "WHITELABEL_BASE_PATH", str(_8087_ROOT / "whitelabel")
    )
    LOCAL_HOSTNAMES = [x.strip() for x in (os.environ.get("LOCAL_HOSTNAMES", "") or "").split(",") if x and x.strip()]
    # Domain mappings: JSON like {"portal.xecoenergy.com": "xeco"} or empty dict
    _dm = os.environ.get("WHITELABEL_DOMAIN_MAPPINGS", "{}")
    try:
        WHITELABEL_DOMAIN_MAPPINGS = __import__("json").loads(_dm) if _dm else {}
    except Exception:
        WHITELABEL_DOMAIN_MAPPINGS = {}
    DEFAULT_BRANDING = os.environ.get("WHITELABEL_DEFAULT_BRANDING", "tracking")
    # App version for S3 static paths
    APP_VERSION = os.environ.get("APP_VERSION", "1.2.6")

    # PDF: Path to Node pdf-bridge.js for full PDF layouts. When set, Flask uses it for
    # billAnalytic, costSavings, lsPotential, co2Savings, partsProcurement, shippingDocuments, financeAgreement.
    # Run from 8087 dir: node scripts/pdf-bridge.js <kind> < data.json
    _bridge = os.environ.get("PDF_BRIDGE_PATH", "").strip()
    if not _bridge and (_8087_ROOT / "scripts" / "pdf-bridge.js").exists():
        _bridge = str(_8087_ROOT / "scripts" / "pdf-bridge.js")
    PDF_BRIDGE_PATH = _bridge

    # Constants (from config/constants.js)
    DEFAULT_PAGE_SIZE = 10

    USER_ROLES = {
        "CLIENT_USER": 1,
        "CLIENT_ADMIN": 2,
        "CLIENT_MANAGER": 3,
        "ACCOUNT_MANAGER": 7,
        "XECO_USER": 4,
        "XECO_ADMIN": 8,
    }

    METER_ALERT_TYPES = {"HIGH_DEMAND": 1, "GATEWAY_ERROR": 2}
    REPEATER_ALERT_TYPES = {"GATEWAY_ERROR": 1}
    SWITCH_ALERT_TYPES = {"GATEWAY_ERROR": 1}
    SWITCH_COMMAND_TYPES = {"POWER_ON": 1, "POWER_OFF": 2}
    GATEWAY_COMMAND_TYPES = {"POWER_ON": 1, "POWER_OFF": 2, "POWER_TEST": 3}
    METER_CSV_TYPES = {"UNOCCUPIED_ENERGY": 1, "15_MINUTE": 2, "DETAILED_METER": 3}
    DEVICE_TYPES = {"XECO_UNIT": 1}

    # Service plans (from config/constants.js)
    SERVICE_PLAN_NAMES = {
        "lan": "Xeco Server (LAN/VPN) + Cloud",
        "cloud": "Xeco Cloud Only",
        "oem": "Xeco Server / OEM Software",
    }
    SERVICE_PLAN_PRICES = {
        "lan": {
            "server": 1,
            "gateways": 17,
            "meters": 40,
            "switches": 5,
            "repeaters": 2,
            "upgrades": "Free",
            "maintenance": "Free",
            "users": "Free (Max. 5)",
            "addlUsers": 10,
            "support": 85,
        },
        "cloud": {
            "server": "Not Included",
            "gateways": 17,
            "meters": 62,
            "switches": 27,
            "repeaters": 5,
            "upgrades": "Free",
            "maintenance": "Free",
            "users": "Free (Max. 5)",
            "addlUsers": 10,
            "support": 85,
        },
        "oem": {
            "server": 99,
            "gateways": 17,
            "meters": 62,
            "switches": "Not Included",
            "repeaters": "Not Included",
            "upgrades": "Not Included",
            "maintenance": "Limited Support",
            "users": "Not Included",
            "addlUsers": "Not Included",
            "support": 85,
        },
    }

    # Maintenance - secret for remote maintainer (optional)
    MAINTENANCE_SECRET = os.environ.get("MAINTENANCE_SECRET", "")
    # Path to update.sh (default: tracking-program/8087/update.sh)
    UPDATE_SCRIPT = os.environ.get("UPDATE_SCRIPT", "")
    # Source folder for list-files (default: 8087 dir or /vagrant)
    MAINTENANCE_SOURCE_FOLDER = os.environ.get("MAINTENANCE_SOURCE_FOLDER", "")
    # GPG passphrase for encrypt/decrypt (for maintenance key auth)
    MAINTENANCE_GPG_PASSPHRASE = os.environ.get("MAINTENANCE_GPG_PASSPHRASE", "")

    # Cron / internal - secret for EB app endpoints (rollup, errands, alerts, etc.)
    CRON_SECRET = os.environ.get("CRON_SECRET", "")

    # DataSync (optional - master/slave sync)
    DATASYNC_MASTER = os.environ.get("DATASYNC_MASTER", "")
    DATASYNC_SLAVES = (os.environ.get("DATASYNC_SLAVES", "") or "").split(",")

    # Authorize.net (optional - payment)
    AUTHORIZENET_ENV = os.environ.get("AUTHORIZENET_ENV", "sandbox")
    AUTHORIZENET_API_LOGIN = os.environ.get("AUTHORIZENET_API_LOGIN", "")
    AUTHORIZENET_TRANSACTION_KEY = os.environ.get("AUTHORIZENET_TRANSACTION_KEY", "")
