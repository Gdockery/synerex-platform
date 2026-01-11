# Synerex Auth Samples

This folder provides reference implementations for how cloud-hosted EM&V and Tracking
apps should authenticate users using the Synerex License Service as the authority.

## Pattern
1. Client presents a signed license JSON at login
2. Backend verifies online with License Service
3. Backend mints a short-lived session token (JWT)
4. Frontend uses the JWT for subsequent API calls

> The License Service remains the single source of truth; the JWT is a short-lived cache.

See:
- `backend_fastapi.py` (sample backend)
- `frontend_example.js` (sample frontend flow)
