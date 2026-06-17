from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import settings

connect_args = {}
if settings.db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.db_url,
    connect_args=connect_args,
    pool_pre_ping=True,       # test connection before use
    pool_recycle=300,          # recycle connections every 5 min (MySQL wait_timeout is 8h but firewalls drop idle sooner)
    pool_timeout=30,
    pool_size=5,
    max_overflow=10,
)

# Verify DB is reachable at startup (retry up to 10 times with back-off)
import time as _time
import logging as _logging
_log = _logging.getLogger(__name__)
for _attempt in range(10):
    try:
        with engine.connect() as _c:
            _c.execute(text("SELECT 1"))
        break
    except Exception as _e:
        _log.warning("DB not ready (attempt %d/10): %s", _attempt + 1, _e)
        _time.sleep(3 * (_attempt + 1))

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass
