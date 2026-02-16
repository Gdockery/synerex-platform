# Phase 3: Auth and Policies - Complete

## Implemented

### Routes (api/hooks/auth, api/controllers/auth)
- `GET /login` - Show login page
- `POST /login` - Login with email/password (bcrypt)
- `GET /logout` - Clear session
- `POST /api/auth/verify-jwt` - JWT verification via License Service (Angular)
- `GET /sso?token=...` - SSO login via JWT
- `GET /forgot-password` - Forgot password page
- `POST /reset-password-email` - Send reset link (sends email when MAIL_SERVER/MAIL_USERNAME configured; logs link in dev otherwise)
- `GET /reset-password` - Reset password page
- `POST /reset-password` - Reset password with token

### Policy decorators (app/helpers/decorators.py)
- `@login_required` - Flask-Login built-in
- `@license_required` - License Service check, admin bypass, fail open
- `@remote_maintainer` - MAINTENANCE_SECRET (header or body) or Sails-compatible encrypted key auth

### Services
- `app/services/license_service.py` - verify_jwt(token, url)

### Templates
- `app/templates/auth/login.html`
- `app/templates/auth/forgot-password.html`
- `app/templates/auth/reset-password.html`

## Verify

```bash
curl -s http://localhost:8088/login | head -5
curl -s -X POST http://localhost:8088/api/auth/verify-jwt -H "Content-Type: application/json" -d '{"token":"x"}' 
# -> 401 {"error":"Invalid or expired token"}
```

## Note
- Password reset email: sends via SMTP when MAIL_* env vars configured; otherwise logs link in dev.
- Flask-Login `@login_required` used for protected routes in Phase 4+.

## Next: Phase 4

Core API: homepage, account, project, client, whitelabel, static assets.
