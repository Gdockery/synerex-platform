# API Response Parity Checklist

Endpoint-by-endpoint verification guide. Run Sails and Flask in parallel, compare responses.

## How to Verify

1. Run Sails: `cd 8087 && node app.js` (port 8087)
2. Run Flask: `cd 8087/flask_app && PORT=8088 python run.py`
3. For each endpoint, capture:
   - Request (URL, query params, headers, body)
   - Response status, headers, body
4. Compare structure: `{ meta: {}, response: ... }` shape, field names, types

## Critical Endpoints

| Endpoint | Sails Controller | Flask Module | Notes |
|----------|------------------|--------------|-------|
| GET /api/account | web/user/get-logged-in-user-details | web_routes.get_account | userLogo added |
| GET /api/project | web/project/list | web_routes.list_projects | Pagination, filters |
| GET /api/project/:id | web/project/find-one | web_routes.get_project | Includes meters for admin |
| GET /api/client | web/client/list | web_routes.list_clients | logoImgSrc |
| GET /api/meter/data | web/meter/get-recent-data | device_routes | Export differs |
| GET /api/project/ticker | web/project/ticker | phase8_routes | |
| POST /api/auth/verify-jwt | auth/verify-jwt | auth_routes | Via license service |
| GET /api/whitelabel/brand-name | web/whitelabel/get-brand-name | web_routes | |

## Response Shape Conventions

- **Lists**: `{ "meta": { "total": N }, "response": [ ... ] }`
- **Single**: `{ "meta": {}, "response": { ... } }`
- **Error**: `{ "error": "message" }` with 4xx/5xx status

## Fields to Cross-Check

- Project: slug, documentShareToken, multiplier, timeZoneId
- User: userLogo, defaultProject
- Client: logoImgSrc
- Meter: aggregate data keys (avgKva, peakKva, etc.)

## Automated Verification Script

Run when both Sails and Flask are up:

```bash
cd tracking-program/8087/flask_app && python scripts/verify_api_parity.py
# Optional: SAILS_URL=http://localhost:8087 FLASK_URL=http://localhost:8088 python scripts/verify_api_parity.py
```

Writes `docs/api_parity_report.json` with per-endpoint comparison. Auth endpoints may return 401/403; the script still records status for manual review.

## Captured Samples

Place request/response samples in `docs/api_contracts/` (see README there).
