import hmac, hashlib, os, secrets
from typing import Optional, Set
from fastapi import Header, HTTPException, Depends
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.api_key import ApiKey
from ..config import settings

def _hash_key(raw_key: str) -> str:
    secret = settings.api_key_secret
    return hmac.new(secret.encode("utf-8"), raw_key.encode("utf-8"), hashlib.sha256).hexdigest()

def create_api_key(prefix: str = "syx") -> tuple[str, str]:
    raw = f"{prefix}_" + secrets.token_urlsafe(32)
    return raw, _hash_key(raw)

def _db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def require_api_key(required_scopes: Set[str]):
    def _dep(x_api_key: Optional[str] = Header(default=None), db: Session = Depends(_db)):
        if not x_api_key:
            raise HTTPException(401, "Missing X-API-Key")
        key_hash = _hash_key(x_api_key)
        rec = db.query(ApiKey).filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True).first()
        if not rec:
            raise HTTPException(401, "Invalid API key")
        scopes = set((rec.scopes or "").split(","))
        if not required_scopes.issubset(scopes):
            raise HTTPException(403, "Insufficient scope")
        return rec
    return _dep
