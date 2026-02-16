# Phase 9: Remaining Integrations - Complete

## Implemented

### Payment
- `POST /api/payment/info` – Project resources, plan names/prices
- `POST /api/payment/delete-subscription` – Delete subscription
- `POST /api/payment/create-subscription` – Create subscription

### DataSync
- `GET /api/datasync/<table>` – Sync table data
- `GET /api/datasync/<table>/<since>` – Sync with since timestamp
- `GET /api/datasync/<table>/<since>/<limit>` – Sync with limit
- `GET /api/datasync/<table>/<since>/<limit>/<ref_id>` – Sync with ref ID

### XECO
- `PUT /api/xeco` – Update XECO config

### Maintenance (full implementation)
- `POST /api/maintenance/status` – Get local status
- `POST /api/maintenance/files` – List app files, return encrypted pack as attachment
- `POST /api/maintenance/update` – Receive update pack (multipart), apply via request-apply
- `POST /api/maintenance/rollback` – Trigger rollback via request-rollback
- `POST /api/maintenance/remote-status` – Fetch status from remote (host, secret in body)
- `POST /api/maintenance/remote-update` – Trigger update on remote host
- `POST /api/maintenance/remote-rollback` – Trigger rollback on remote host

### Dev
- `GET /api/dev/reload` – Dev helper (no-op for Flask)

## Maintenance requirements

- **UPDATE_SCRIPT**: Path to `update.sh` (default: `../8087/update.sh`). The script provides `list-files`, `pack`, `pack-list`, `unpack`, `request-apply`, `request-rollback`.
- **MAINTENANCE_SECRET**: Required for maintenance endpoints. Pass via `X-Maintenance-Secret` header or `secret` in body.
- **Update service**: For `request-apply` and `request-rollback` to work, the update service must be running (`update.sh service`), reading from the named pipe.

## Next: Phase 10

Rollup PUT endpoints (phase10_routes).
