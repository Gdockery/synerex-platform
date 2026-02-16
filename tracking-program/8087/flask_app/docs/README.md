# Tracking Program Flask Migration – Documentation Index

## Current Status

- **VERIFICATION.md** – Remaining gaps, PDF/Errands/Rollup parity
- **api_parity.md** – API response comparison; run `scripts/verify_api_parity.py`
- **PHASE12.md** – Cutover runbook, smoke tests, rollback

## Migration Phases

| Phase | Doc | Status |
|-------|-----|--------|
| 0 | PHASE0.md | Preparation |
| 1 | PHASE1.md | Flask scaffold |
| 2 | PHASE2.md | SQLAlchemy models |
| 3 | PHASE3.md | Auth, JWT, SSO |
| 9 | PHASE9.md | Payment, DataSync, Maintenance |
| 10 | (phase10_routes.py) | Rollup PUT endpoints |
| 11 | PHASE11.md | Switch scheduling, test reporting |
| 12 | PHASE12.md | Cutover planning |

## API Contracts

See `api_contracts/README.md` for capturing request/response samples.
