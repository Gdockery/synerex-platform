# Access Gateway System

This document describes the access gateway system that allows synerexlabs.com to provide secure access links to EM&V and Tracking programs.

## Overview

The access gateway provides a secure way for users to access EM&V and Tracking programs through links on synerexlabs.com. Users can click a link, enter their license serial number, and be automatically authenticated with a short-lived session token.

## Architecture

```
User clicks link on synerexlabs.com
    ↓
Access Gateway (/access/{program_id})
    ↓
User enters License Serial Number
    ↓
License Service validates license
    ↓
Generates JWT session token (15 min)
    ↓
Redirects to EM&V/Tracking with token
    ↓
Program validates token
    ↓
User granted access
```

## API Endpoints

### 1. Access Gateway Page

**Endpoint:** `GET /access/{program_id}`

**Description:** Displays a form for users to enter their license serial number.

**Parameters:**
- `program_id`: Either "emv" or "tracking"
- `license_id` (optional): Pre-fills the serial number field
- `token` (optional): If provided, validates and redirects immediately

**Example:**
```
GET /access/emv?license_id=SYX-LIC-2025-1234567890
```

### 2. Verify and Redirect

**Endpoint:** `POST /access/{program_id}/verify`

**Description:** Verifies the license serial number and redirects to the program with a session token.

**Form Data:**
- `license_id`: The license serial number

**Response:** Redirects to program URL with token parameter

### 3. Validate Session Token

**Endpoint:** `POST /access/api/validate-session-token`

**Description:** Validates a JWT session token. Called by EM&V or Tracking programs.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "valid": true,
  "license_id": "SYX-LIC-2025-1234567890",
  "program_id": "emv",
  "org_id": "CUSTOMER-ACME-POWER",
  "roles": ["oem_engineer"],
  "features": ["baseline_creation"],
  "verified_at": 1234567890
}
```

## Configuration

### Program URLs

Configure the program URLs in `app/config.py`:

```python
emv_program_url: str = "https://emv.synerexlabs.com"
tracking_program_url: str = "https://tracking.synerexlabs.com"
```

### JWT Secret

Set a secure JWT secret in `app/config.py`:

```python
jwt_secret: str = "YOUR_SECURE_RANDOM_STRING_HERE"
```

## Usage Examples

### On synerexlabs.com

**HTML Link:**
```html
<a href="https://license-service.synerex.com/access/emv?license_id=SYX-LIC-2025-1234567890">
  Access EM&V Program
</a>
```

**JavaScript Redirect:**
```javascript
window.location.href = `https://license-service.synerex.com/access/${programId}?license_id=${licenseId}`;
```

### In EM&V/Tracking Programs

**Validate Token:**
```python
import requests

def validate_token(token: str) -> dict:
    response = requests.post(
        "https://license-service.synerex.com/access/api/validate-session-token",
        json={"token": token}
    )
    return response.json()

# On login page, check for token in URL
token = request.query_params.get("token")
if token:
    result = validate_token(token)
    if result.get("valid"):
        # Create session with license info
        create_user_session(result)
        redirect("/dashboard")
```

## Email Integration

License receipt emails now include quick access links:

```
Access your EM&V program:
https://license-service.synerex.com/access/emv?license_id=SYX-LIC-2025-1234567890
```

## Security Features

1. **Short-lived tokens**: JWT tokens expire after 15 minutes
2. **License validation**: Tokens are validated against the license database
3. **Program matching**: Tokens are program-specific (emv vs tracking)
4. **Revocation checking**: Tokens are invalidated if license is revoked/suspended
5. **Audit logging**: All access attempts are logged

## Token Structure

JWT tokens contain:
- `license_id`: The license serial number
- `program_id`: "emv" or "tracking"
- `org_id`: Organization ID
- `roles`: User roles from license
- `features`: Features from license
- `verified_at`: Timestamp when token was issued
- `exp`: Expiration timestamp (15 minutes from issue)

## Error Handling

The access gateway handles various error scenarios:

- **License not found**: Shows error message
- **Wrong program**: Shows error if license is for different program
- **License revoked**: Shows error and denies access
- **License suspended**: Shows error and denies access
- **Authorization inactive**: Shows error and denies access
- **Token expired**: Redirects back to verification page

## Testing

Test the access gateway:

1. **Get a license ID** from the database or registration
2. **Visit access page**: `http://localhost:8000/access/emv?license_id=YOUR_LICENSE_ID`
3. **Enter serial number** and submit
4. **Should redirect** to program URL with token parameter

## Future Enhancements

Potential improvements:
- One-time access tokens in email (pre-authenticated)
- Remember device option
- QR code for mobile access
- Integration with SSO providers


