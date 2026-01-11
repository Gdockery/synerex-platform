import base64
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

ROOT = Path(__file__).resolve().parents[2]

def load_private_key(path: Path) -> Ed25519PrivateKey:
    return serialization.load_pem_private_key(path.read_bytes(), password=None)

def load_public_key(path: Path) -> Ed25519PublicKey:
    return serialization.load_pem_public_key(path.read_bytes())

def sign_bytes(priv: Ed25519PrivateKey, payload: bytes) -> str:
    return base64.b64encode(priv.sign(payload)).decode("ascii")

def verify_bytes(pub: Ed25519PublicKey, payload: bytes, signature_b64: str) -> bool:
    try:
        sig = base64.b64decode(signature_b64.encode("ascii"))
        pub.verify(sig, payload)
        return True
    except Exception:
        return False
