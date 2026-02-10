# Synerex Platform

Monorepo containing all Synerex platform components.

## Structure

```
synerex-platform/
├── website/              # Main website (React/Vite)
├── license-service/      # License Management Service (FastAPI)
└── emv-program/         # EM&V Program (Flask)
```

## Components

### Website (`website/`)
- React application with Vite
- Main entry point for users
- License registration and account management
- Navigation to all platform services

### License Service (`license-service/`)
- FastAPI-based license management system
- Handles user registration, payment processing, and license issuance
- Provides access gateway for EM&V and other programs
- JWT-based authentication for secure program access

### EM&V Program (`emv-program/`)
- Flask-based Energy Measurement & Verification program
- Audit and utility-grade power analysis
- Integrates with License Service for authentication

## Development

Each component can be run independently:

### Website
```bash
cd website
npm install
npm run dev
```

### License Service
```bash
cd license-service
python -m uvicorn app.main:app --reload --port 8000
```

### EM&V Program
```bash
cd emv-program/8082
python main_hardened_ready_refactored.py
```

## Integration

- Website links to License Service for registration
- License Service authenticates users for EM&V Program
- All components share consistent styling and navigation

## Docker (Phase 4 baseline)

```bash
docker compose up --build
```

Proxy entrypoint:
- `http://localhost:8080/` (website)
- `http://localhost:8080/license/`
- `http://localhost:8080/emv/`
- `http://localhost:8080/tracking/`

TLS (optional):
- Place certs in `certs/fullchain.pem` and `certs/privkey.pem`
- Or run `./scripts/gen_self_signed_certs.sh`
- HTTPS entrypoint: `https://localhost:8443/`

## License

Copyright © Synerex Laboratories, LLC
