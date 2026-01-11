# Synerex Platform (Scaffold + Next Build)

This monorepo contains:
- **license-service** (FastAPI): authorizations, tier templates, signed license issuance, online verification, API keys, baseline seal registry.
- **emv-program** and **tracking-program**: program engines (scaffolds) that will create authorizations.
- **clients**: EM&V offline client scaffold and Tracking portal middleware scaffold.
- **templates**: tier templates for EM&V (Baseline/Pro/Enterprise) and Tracking (Basic/Pro/Enterprise).

## Quick start: license-service
```bash
cd services/license-service
pip install -r requirements.txt
python scripts/gen_keys.py
uvicorn app.main:app --reload --port 8000
```

## Minimal demo (curl)
1) Create org:
```bash
curl -X POST "http://localhost:8000/api/orgs?org_id=OEM-ACME-001&org_name=ACME%20Power&org_type=oem"
```

2) Issue OEM API key (baseline sealing scope):
```bash
curl -X POST "http://localhost:8000/api/api-keys/issue?org_id=OEM-ACME-001&scopes_csv=baseline:seal"
```
Save the returned `api_key`.

3) Create EM&V authorization:
```bash
curl -X POST "http://localhost:8000/api/programs/emv/authorizations" \
  -H "Content-Type: application/json" \
  -d '{
    "authorization_id":"AUTH-EMV-0001",
    "org_id":"OEM-ACME-001",
    "template_id":"emv_pro",
    "status":"active",
    "starts_at":"2026-01-10",
    "ends_at":"2026-06-30",
    "scope":{"project_ids":["PRJ-001"],"site_ids":["SITE-001"],"meter_ids":[]},
    "bindings_override":{"tenant_id":"syx-tenant-acme","allowed_domains":["acmepower.com"]},
    "issued_by":"synerex_emv_engine"
  }'
```

4) Issue license from authorization:
```bash
curl -X POST "http://localhost:8000/api/programs/emv/authorizations/AUTH-EMV-0001/issue-license"
```
Save returned `license_id`.

5) Seal a baseline (idempotent). Requires multipart upload and X-API-Key header:
```bash
curl -X POST "http://localhost:8000/api/baselines/seal" \
  -H "X-API-Key: <YOUR_API_KEY>" \
  -F "org_id=OEM-ACME-001" \
  -F "project_id=PRJ-001" \
  -F "baseline_id=BL-123" \
  -F "created_by=eng1" \
  -F "meter_ids_csv=MTR-1,MTR-2" \
  -F "start_date=2026-02-01" \
  -F "end_date=2026-02-28" \
  -F "calc_params_json={\"method\":\"avg\",\"interval_min\":15}" \
  -F "license_id=<LICENSE_ID>" \
  -F "raw_files=@./some_raw.csv"
```

6) Tracking portal online verification:
```bash
curl -X POST "http://localhost:8000/api/licenses/verify" -H "Content-Type: application/json" -d '<SIGNED_LICENSE_JSON>'
```


## Admin UI
- Visit http://localhost:8000/admin/login
- Default credentials are in services/license-service/app/config.py (admin/admin_password). Change before production.


## EM&V Offline Client (Python)
The EM&V client supports:
- offline signature verification of the signed license JSON
- creating baseline draft bundles (includes copied raw files + draft.json)
- syncing bundles later to the license-service baseline sealing endpoint

### Setup
```bash
cd clients/emv-client
pip install -r requirements.txt
```

### IMPORTANT: Install public key
Replace `clients/emv-client/licensing/public_key.pem` with the issuer public key from the license-service:
- `services/license-service/keys/issuer_public.key`

### Verify a license offline
```bash
python cli.py verify-license --license-path /path/to/license.json
```

### Create a baseline draft (offline)
```bash
python cli.py create-draft \
  --org-id OEM-ACME-001 \
  --project-id PRJ-001 \
  --created-by eng1 \
  --meters MTR-1,MTR-2 \
  --start-date 2026-02-01 \
  --end-date 2026-02-28 \
  --raw-files /path/raw1.csv,/path/raw2.csv \
  --calc-params-json '{"method":"avg","interval_min":15}' \
  --license-id <LICENSE_ID>
```

### Sync drafts (when online)
```bash
python cli.py sync --base-url http://localhost:8000 --api-key <X_API_KEY>
```


## Tracking Portal Middleware (Python)
Use the `LicenseChecker` to enforce Tracking licenses online.

```python
from clients.tracking-portal.middleware.license_check import LicenseChecker

checker = LicenseChecker(
    license_service_base_url="http://localhost:8000",
    service_api_key="<SERVICE_API_KEY>",
)

checker.enforce(
    license_payload=signed_license_json,
    require_program="tracking",
    require_roles=["customer_admin"],
    require_features=["continuous_tracking"],
)
```

A FastAPI dependency helper is included in:
`clients/tracking-portal/middleware/fastapi_dep.py`


## New capabilities added (v6)
### Revocation propagation (client guidance)
`POST /api/licenses/verify` now returns:
- `cache_ttl_sec` (how long a portal may cache a positive decision)
- `grace_seconds` (how long to allow temporary outage before forcing recheck)

### Seat enforcement (optional)
- `GET /api/licenses/{license_id}/seats`
- `POST /api/licenses/{license_id}/seats/assign?user_id=...`
- `POST /api/licenses/{license_id}/seats/release?user_id=...`

### Utility read-only access
Issue an API key with scope: `utility:read`
- `GET /api/audit/events`
- `GET /api/baselines/{baseline_id}/evidence` (ZIP includes seal.json, calc_params.json, raw files if stored, summary.pdf)

### Hardware binding (optional)
Set `bindings_override_json` to include:
```json
{"device_fingerprints":["<sha256>","<sha256>"]}
```

EM&V client can print fingerprint:
```bash
python cli.py print-fingerprint
```

And enforce device binding:
```bash
python cli.py verify-license --license-path /path/to/license.json --enforce-device-binding
```


## Baseline Lineage Enforcement (EM&V → Tracking)
- Tracking authorizations **must reference**:
  - `baseline_id`
  - `snapshot_id`
- License issuance fails if the snapshot does not exist.
- Tracking license verification fails if lineage is missing or invalid.

This guarantees **no Tracking without a valid Synerex One baseline**.

## Immutable Evidence Snapshots
- Every baseline seal creates an immutable snapshot:
```
storage/baselines/{baseline_id}/snapshots/{snapshot_id}/
  ├── seal.json
  ├── manifest.json
```
- Snapshots are write-once and never overwritten.

## License Intent + Patent Attribution
All licenses now embed:
- Explicit **intent**
- Explicit **permitted / prohibited uses**
- Patent attribution (e.g. `US-12,375,324-B2`)

This strengthens audit clarity and legal defensibility.


## Downloads (License-Governed Document Distribution)
The License Service exposes:
- `GET /downloads` — list documents you are authorized to access
- `GET /downloads/{doc_id}` — stream a PDF with automatic watermarking

### Authentication
Provide the signed license JSON in the `X-License` header.
The service uses the license to determine:
- who the caller is (org_id / optional user_id)
- program scope (emv vs tracking)
- roles and entitlements

### Role-based access + lifecycle
Each document in `services/license-service/downloads/registry.json` may define:
- `allowed_roles`: list of roles allowed to download
- `programs`: ["emv"] or ["tracking"] or both
- `lifecycle`: draft|approved|retired (only approved is downloadable)
- `version`
- `watermark`: true/false

### Download audit
Every download emits `audit_events` entry:
- action: `document.download`
- detail: doc_id, version, org_id, roles, recipient identifiers, etc.


### Per-document required entitlements
Registry supports `required_entitlements` (features). If set, the caller's license must include all features listed in:
`license.entitlements.features`.

### Retired documents
Documents with lifecycle `retired` are downloadable via `/downloads/{doc_id}` only for licenses with role:
- `admin` or `synerex_admin`


## Auth Samples (Cloud EM&V / Tracking)
Reference implementations are included in:
- `clients/auth-samples/backend_fastapi.py`
- `clients/auth-samples/frontend_example.js`

Architecture notes:
- `docs/architecture/cloud_login_flow.md`
PDF (download-governed):
- `governance/pdfs/Synerex_Cloud_Login_Flow.pdf`
- `governance/pdfs/Synerex_License_As_Access_Authorization.pdf`


## Billing → License Activation (Admin API)
The License Service supports payment-gated issuance via billing orders:

- `POST /admin/billing/orders` create an order (status=pending)
- `POST /admin/billing/orders/{order_id}/mark-paid` mark paid and **issue license**
- `POST /admin/billing/orders/{order_id}/mark-overdue` mark overdue and **suspend license**
- `POST /admin/billing/run-suspension-scan` automation scan for past-due pending orders

### Tracking meter-based pricing
For Tracking, include `meter_count` in the billing order and license entitlements `limits.meter_limit`.
Commercial pricing can be modeled as $/meter/month or $/meter/year; the billing system records
the paid-for meter count and gates issuance/activation accordingly.
