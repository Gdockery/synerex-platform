from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

ROOT = Path(__file__).resolve().parents[1]
KEYS = ROOT / "keys"
KEYS.mkdir(parents=True, exist_ok=True)

priv = Ed25519PrivateKey.generate()
pub = priv.public_key()

(KEYS / "issuer_private.key").write_bytes(
    priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
)
(KEYS / "issuer_public.key").write_bytes(
    pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
)
print("Generated keys in services/license-service/keys/")
