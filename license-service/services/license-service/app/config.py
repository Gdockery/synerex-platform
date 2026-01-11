from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    db_url: str = "sqlite:///./licensing.db"
    issuer_name: str = "Synerex Laboratories, LLC"
    key_id: str = "SYX-MASTER-KEY-01"
    api_key_secret: str = "CHANGE_ME"
    admin_username: str = "admin"
    admin_password: str = "admin123"
    session_secret: str = "CHANGE_ME_SESSION_SECRET"
    jwt_secret: str = "CHANGE_ME_JWT_SECRET"  # Secret key for JWT session tokens
    
    @property
    def private_key_pem(self) -> Path:
        """Path to the issuer private key."""
        # Calculate path relative to this file: config.py is in app/
        # Keys are in services/license-service/keys/
        config_file = Path(__file__).resolve()
        return config_file.parents[1] / "keys" / "issuer_private.key"
    
    @property
    def public_key_pem(self) -> Path:
        """Path to the issuer public key."""
        config_file = Path(__file__).resolve()
        return config_file.parents[1] / "keys" / "issuer_public.key"
    
    # Email settings
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: str = "noreply@synerex.com"
    smtp_use_tls: bool = True
    
    # Payment gateway settings
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    paypal_client_id: Optional[str] = None
    paypal_client_secret: Optional[str] = None
    paypal_mode: str = "sandbox"  # sandbox or live
    
    # EFT/Bank transfer settings
    # TODO: Replace placeholder values with your actual bank information
    eft_bank_name: str = "Wells Fargo Bank"  # e.g., "Chase Bank", "Bank of America", "Wells Fargo"
    eft_account_name: str = "Synerex Laboratories, LLC"  # Account holder name
    eft_routing_number: Optional[str] = "121000248"  # Your 9-digit ACH routing number (e.g., "123456789")
    eft_account_number: Optional[str] = "1714650080"  # Your full bank account number (required for EFT transfers)
    eft_swift_code: Optional[str] = "WFBIUS6S"  # SWIFT/BIC code (only needed for international transfers)
    eft_instructions: str = "Please include your Order ID in the payment reference/memo field."
    
    # License lifecycle settings
    renewal_reminder_days: list[int] = [90, 60, 30, 7, 1]  # Days before expiration
    grace_period_days: int = 30
    auto_renewal_enabled: bool = False
    
    # Webhook settings
    webhook_timeout_seconds: int = 10
    webhook_max_retries: int = 3
    webhook_retry_delay_seconds: int = 60
    
    # Rate limiting
    rate_limit_per_minute: int = 60
    rate_limit_per_hour: int = 1000
    
    # Analytics
    enable_usage_tracking: bool = True
    usage_retention_days: int = 365
    
    # API versioning
    api_version: str = "v1"
    api_version_header: str = "X-API-Version"
    
    # Program URLs for access gateway
    # For local development, use localhost URLs
    # For production, update these to the actual production URLs
    emv_program_url: str = "http://localhost:8082"
    tracking_program_url: str = "http://localhost:8083"  # Note: Tracking program not implemented yet - this is for usage/analytics tracking, not a separate program
    
    # Website URL for navigation links
    website_url: str = "http://localhost:5173"  # Main website URL
    
    # Software License Agreement settings
    software_license_agreement_version: str = "2026.01"

settings = Settings()
