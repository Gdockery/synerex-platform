# Audit Model

All issuance, status changes, verification failures, and baseline seals should generate audit events.
Store:
- actor (admin/system/service)
- action
- ref_id (license_id, authorization_id, baseline_id)
- detail JSON
