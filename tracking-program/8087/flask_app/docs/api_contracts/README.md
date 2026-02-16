# API Contract Capture

Before porting controllers, capture sample request/response shapes from the Sails app to validate Flask parity.

## Critical Endpoints to Capture

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/account` | GET | Logged-in user details (login flow) |
| `GET /api/project` | GET | Project list |
| `GET /api/project/:id` | GET | Project find-one |
| `GET /api/client` | GET | Client list |
| `GET /api/meter/data` | GET | Meter recent data (project, meter params) |
| `POST /api/auth/verify-jwt` | POST | JWT verification for Angular API auth |
| `GET /api/project/ticker` | GET | Ticker data (project param) |
| `GET /api/whitelabel/brand-name` | GET | Whitelabel brand name |

## How to Capture

1. Run Sails app: `cd tracking-program/8087 && node app.js`
2. Use browser DevTools Network tab or curl with session cookie
3. For each endpoint, save:
   - Request URL (with query params)
   - Request headers (Auth, Cookie if needed)
   - Response status
   - Response body (JSON)

## Example Format

Create files like `api_account_GET.json`:

```json
{
  "endpoint": "GET /api/account",
  "request": {
    "url": "/api/account",
    "headers": {}
  },
  "response": {
    "status": 200,
    "body": { "response": { "id": 1, "firstName": "...", ... } }
  },
  "notes": "Requires session or Bearer token"
}
```

## Validation During Port

When implementing Flask routes, compare response shape with captured samples. Angular expects specific structure (e.g. `{ meta: {}, response: [] }` for lists).

## Automated Verification

Run `scripts/verify_api_parity.py` when both Sails (8087) and Flask (8088) are up to compare responses. Writes `docs/api_parity_report.json`.
