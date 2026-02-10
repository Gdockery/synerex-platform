# Setup Guide for New Enterprise Features

## ✅ Step 1: Dependencies Installed
All new dependencies have been installed:
- ✅ stripe==10.0.0
- ✅ paypalrestsdk==1.13.3
- ✅ alembic==1.13.0
- ✅ openpyxl==3.1.2

## 📋 Step 2: Database Setup

The database tables will be automatically created when the server starts. However, if you want to verify or manually create them:

```bash
cd services/license-service
python -c "from app.db import Base, engine; from app.models import *; Base.metadata.create_all(bind=engine); print('Done!')"
```

**New tables created:**
- `notifications` - Email notification tracking
- `webhooks` - Webhook configuration
- `webhook_deliveries` - Webhook delivery attempts
- `usage_events` - Usage tracking data
- `payments` - Payment records
- `invoices` - Invoice records

**Enhanced tables:**
- `organizations` - Added email, contact_name, phone, address, billing_email
- `licenses` - Added is_trial, auto_renew, grace_period_ends_at, renewal_license_id, previous_license_id

## ⚙️ Step 3: Configuration

### Option A: Environment Variables (Recommended)
Create a `.env` file in `services/license-service/`:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@synerex.com

# Payment Gateways (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...

# Lifecycle Settings
RENEWAL_REMINDER_DAYS=[90,60,30,7,1]
GRACE_PERIOD_DAYS=30
AUTO_RENEWAL_ENABLED=false

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000

# Analytics
ENABLE_USAGE_TRACKING=true
```

### Option B: Direct Configuration
Edit `app/config.py` directly (not recommended for production).

## 🔄 Step 4: Restart Server

**IMPORTANT:** The server must be restarted to load new routes and middleware.

### Windows (PowerShell):
```powershell
cd services\license-service
.\restart_server.ps1
```

### Windows (Batch):
```cmd
cd services\license-service
restart_server.bat
```

### Manual:
```bash
# Stop existing server (Ctrl+C)
cd services/license-service
uvicorn app.main:app --reload --port 8000
```

## 🧪 Step 5: Test New Endpoints

### Test Stats Endpoint (No auth required):
```bash
curl ${LICENSE_SERVICE_URL}/api/stats
```

### Test Lifecycle Endpoints (Admin auth required):
```bash
# Login first
curl -X POST ${LICENSE_SERVICE_URL}/admin/login \
  -d "username=admin&password=admin123" \
  -c cookies.txt

# Run lifecycle tasks
curl -X POST ${LICENSE_SERVICE_URL}/api/lifecycle/run-tasks \
  -b cookies.txt

# Check expiring licenses
curl -X POST ${LICENSE_SERVICE_URL}/api/lifecycle/check-expiring \
  -b cookies.txt

# Handle expired licenses
curl -X POST ${LICENSE_SERVICE_URL}/api/lifecycle/handle-expired \
  -b cookies.txt
```

### Test Webhook Endpoints:
```bash
# List webhooks
curl ${LICENSE_SERVICE_URL}/api/webhooks -b cookies.txt

# Create webhook
curl -X POST ${LICENSE_SERVICE_URL}/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/webhook","events":["license.issued"],"secret":"test123"}' \
  -b cookies.txt
```

### Test Analytics Endpoints:
```bash
# Revenue report
curl ${LICENSE_SERVICE_URL}/api/analytics/revenue -b cookies.txt

# Usage report
curl ${LICENSE_SERVICE_URL}/api/analytics/usage -b cookies.txt

# License utilization
curl ${LICENSE_SERVICE_URL}/api/analytics/license-utilization -b cookies.txt
```

### Test Export Endpoints:
```bash
# Export licenses
curl ${LICENSE_SERVICE_URL}/api/exports/licenses -b cookies.txt -o licenses.csv

# Export organizations
curl ${LICENSE_SERVICE_URL}/api/exports/organizations -b cookies.txt -o orgs.csv

# Export billing
curl ${LICENSE_SERVICE_URL}/api/exports/billing -b cookies.txt -o billing.csv
```

## 📊 New API Endpoints Summary

### Lifecycle Management (`/api/lifecycle`)
- `POST /api/lifecycle/run-tasks` - Run all lifecycle tasks
- `POST /api/lifecycle/check-expiring` - Send expiration reminders
- `POST /api/lifecycle/handle-expired` - Handle expired licenses
- `POST /api/lifecycle/renew/{license_id}` - Manually renew license

### Webhooks (`/api/webhooks`)
- `GET /api/webhooks` - List all webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks/{webhook_id}` - Get webhook
- `PATCH /api/webhooks/{webhook_id}` - Update webhook
- `DELETE /api/webhooks/{webhook_id}` - Delete webhook
- `GET /api/webhooks/{webhook_id}/deliveries` - List deliveries
- `POST /api/webhooks/{webhook_id}/test` - Test webhook

### Analytics (`/api/analytics`)
- `GET /api/analytics/revenue` - Revenue report
- `GET /api/analytics/usage` - Usage analytics
- `GET /api/analytics/license-utilization` - License utilization metrics

### Exports (`/api/exports`)
- `GET /api/exports/licenses` - Export licenses as CSV
- `GET /api/exports/organizations` - Export organizations as CSV
- `GET /api/exports/billing` - Export billing orders as CSV

## 🔍 Verification Checklist

- [ ] Server restarted successfully
- [ ] `/api/stats` endpoint returns data
- [ ] Can login to admin panel
- [ ] Lifecycle endpoints respond (may return 0 results if no data)
- [ ] Webhook endpoints work
- [ ] Analytics endpoints return data
- [ ] Export endpoints generate CSV files
- [ ] Database tables created (check `licensing.db`)

## 🐛 Troubleshooting

### Endpoints return 404
- **Solution:** Restart the server to load new routes

### Database errors
- **Solution:** Run database setup script or restart server (auto-creates tables)

### Import errors
- **Solution:** Ensure all dependencies are installed: `pip install -r requirements.txt`

### Rate limiting too strict
- **Solution:** Adjust `RATE_LIMIT_PER_MINUTE` and `RATE_LIMIT_PER_HOUR` in config

### Email not sending
- **Solution:** Configure SMTP settings in `.env` or `config.py`

## 📝 Next Steps

1. **Configure Email:** Set up SMTP for expiration reminders
2. **Set up Webhooks:** Create webhooks for external integrations
3. **Enable Auto-Renewal:** Set `AUTO_RENEWAL_ENABLED=true` if desired
4. **Schedule Lifecycle Tasks:** Set up cron/scheduled task to run `/api/lifecycle/run-tasks` daily
5. **Configure Payment Gateways:** Add Stripe/PayPal credentials for payment processing

## 📚 Documentation

See `IMPLEMENTATION_STATUS.md` for detailed feature status and remaining work.


