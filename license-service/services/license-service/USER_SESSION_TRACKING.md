# User Session Tracking for EM&V and Tracking Software

This document describes the endpoints and flow for tracking user sessions when licensees log into EM&V or Tracking software using their Software License Serial Number.

## Overview

When a licensee enters their Serial Number into the EM&V or Tracking software login page, the software needs to:
1. Fetch the full license JSON from the License Service
2. Verify the license is valid
3. Track the user login session
4. Track feature usage as users interact with the software

## Complete Login Flow

```
1. User enters Serial Number in EM&V/Tracking login page
   ↓
2. Software calls: GET /api/licenses/by-serial/{license_id}
   → Returns full license JSON
   ↓
3. Software calls: POST /api/licenses/verify
   → Validates license signature and status
   ↓
4. Software calls: POST /api/licenses/{license_id}/session
   → Tracks user login (username, email, etc.)
   ↓
5. User accesses features
   ↓
6. Software calls: POST /api/analytics/usage/track
   → Tracks feature usage
```

## API Endpoints

### 1. Get License by Serial Number

**Endpoint:** `GET /api/licenses/by-serial/{license_id}`

**Description:** Fetches the full signed license JSON using the serial number (license_id).

**Works for:** Both `emv` and `tracking` programs

**Example Request:**
```bash
GET /api/licenses/by-serial/SYX-LIC-2025-1234567890
```

**Example Response:**
```json
{
  "license_version": "1.0",
  "license_id": "SYX-LIC-2025-1234567890",
  "issued_at": "2025-01-15T10:30:00Z",
  "issuer": "Synerex Laboratories, LLC",
  "organization": {
    "org_id": "CUSTOMER-ACME-POWER",
    "org_name": "ACME Power Solutions",
    "org_type": "customer"
  },
  "program": {
    "program_id": "tracking",
    "authorization_id": "AUTH-TRACKING-CUSTOMER-ACME-POWER-1234567890",
    "status": "active",
    "policy_version": "2026.01"
  },
  "products": {...},
  "roles": [...],
  "entitlements": {...},
  "bindings": {...},
  "term": {
    "start": "2025-01-15",
    "end": "2026-01-15",
    "auto_expire": true
  },
  "signature": {
    "alg": "Ed25519",
    "key_id": "SYX-MASTER-KEY-01",
    "value": "..."
  }
}
```

### 2. Track User Session

**Endpoint:** `POST /api/licenses/{license_id}/session`

**Description:** Records user login information when a user logs into EM&V or Tracking software.

**Works for:** Both `emv` and `tracking` programs

**Request Body:**
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "user_id": "user_12345",  // Optional: software's internal user ID
  "program": "tracking"      // Optional: will auto-detect from license
}
```

**Example Request:**
```bash
POST /api/licenses/SYX-LIC-2025-1234567890/session
Content-Type: application/json

{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "user_id": "user_12345"
}
```

**Example Response:**
```json
{
  "ok": true,
  "license_id": "SYX-LIC-2025-1234567890",
  "program_id": "tracking",
  "org_id": "CUSTOMER-ACME-POWER",
  "username": "john.doe",
  "message": "User session tracked successfully"
}
```

**What Gets Stored:**
- Audit event: `user.login` with username, email, license_id, org_id, program_id, login_time
- Usage event: `user_login` event type for analytics

### 3. Track Feature Usage

**Endpoint:** `POST /api/analytics/usage/track`

**Description:** Tracks when users use specific features in the software.

**Works for:** Both `emv` and `tracking` programs

**Request Body:**
```json
{
  "license_id": "SYX-LIC-2025-1234567890",
  "user_id": "user_12345",           // Optional
  "username": "john.doe",            // Optional
  "feature_name": "baseline_creation", // Required
  "event_type": "feature_usage",     // Optional, default: "feature_usage"
  "metadata": {                      // Optional
    "baseline_id": "BL-123",
    "meter_count": 50
  },
  "ip_address": "192.168.1.100"      // Optional
}
```

**Example Request:**
```bash
POST /api/analytics/usage/track
Content-Type: application/json

{
  "license_id": "SYX-LIC-2025-1234567890",
  "username": "john.doe",
  "feature_name": "baseline_creation",
  "metadata": {
    "baseline_id": "BL-123"
  }
}
```

**Example Response:**
```json
{
  "ok": true,
  "event_id": 42,
  "license_id": "SYX-LIC-2025-1234567890",
  "program_id": "tracking",
  "org_id": "CUSTOMER-ACME-POWER",
  "feature_name": "baseline_creation",
  "tracked_at": "2025-01-15T14:30:00Z"
}
```

### 4. Get License Users (Admin Only)

**Endpoint:** `GET /api/analytics/users/{license_id}`

**Description:** Returns list of all users who have logged in with a specific license.

**Works for:** Both `emv` and `tracking` programs

**Requires:** Admin authentication

**Example Request:**
```bash
GET /api/analytics/users/SYX-LIC-2025-1234567890
```

**Example Response:**
```json
{
  "license_id": "SYX-LIC-2025-1234567890",
  "program_id": "tracking",
  "org_id": "CUSTOMER-ACME-POWER",
  "total_users": 3,
  "users": [
    {
      "user_id": "user_12345",
      "username": "john.doe",
      "email": "john.doe@example.com",
      "login_count": 15,
      "first_login": "2025-01-15T10:00:00Z",
      "last_login": "2025-01-20T14:30:00Z"
    },
    {
      "user_id": "user_67890",
      "username": "jane.smith",
      "email": "jane.smith@example.com",
      "login_count": 8,
      "first_login": "2025-01-16T09:00:00Z",
      "last_login": "2025-01-19T16:20:00Z"
    }
  ]
}
```

## What Information License Service Receives

After implementing this flow, the License Management Software will have:

1. **User Login Information:**
   - Username
   - Email address
   - User ID (if provided by software)
   - Login timestamps
   - License ID used
   - Organization ID
   - Program (EM&V or Tracking)

2. **Feature Usage:**
   - Which features users access
   - When features are used
   - User who used the feature
   - Additional metadata about usage

3. **Analytics:**
   - Total logins per user
   - Most used features
   - Usage patterns by organization
   - Usage by program (EM&V vs Tracking)

## Integration Example for EM&V Software

```python
# 1. User enters serial number: "SYX-LIC-2025-1234567890"
serial_number = user_input

# 2. Fetch license JSON
response = requests.get(f"{LICENSE_SERVICE_URL}/api/licenses/by-serial/{serial_number}")
license_json = response.json()

# 3. Verify license
verify_response = requests.post(
    f"{LICENSE_SERVICE_URL}/api/licenses/verify",
    json=license_json
)
if not verify_response.json().get("valid"):
    raise Exception("License invalid")

# 4. Track user login
session_response = requests.post(
    f"{LICENSE_SERVICE_URL}/api/licenses/{serial_number}/session",
    json={
        "username": current_user.username,
        "email": current_user.email,
        "user_id": current_user.id
    }
)

# 5. Track feature usage (when user creates baseline)
requests.post(
    f"{LICENSE_SERVICE_URL}/api/analytics/usage/track",
    json={
        "license_id": serial_number,
        "username": current_user.username,
        "feature_name": "baseline_creation",
        "metadata": {"baseline_id": new_baseline.id}
    }
)
```

## Integration Example for Tracking Software

```python
# Same flow as EM&V, but with tracking-specific features
# Example: Track when user views dashboard
requests.post(
    f"{LICENSE_SERVICE_URL}/api/analytics/usage/track",
    json={
        "license_id": serial_number,
        "username": current_user.username,
        "feature_name": "dashboard_view",
        "metadata": {"view_type": "overview"}
    }
)
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad request (missing required fields, invalid data)
- `403` - Forbidden (license revoked, suspended, or authorization inactive)
- `404` - Not found (license doesn't exist)

## Notes

- The License Service acts as the **single source of truth** for license validation
- User session tracking is optional but recommended for better analytics
- Feature usage tracking helps understand how licenses are being utilized
- All events are logged in the audit trail for compliance and debugging


