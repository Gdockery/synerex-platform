# PE Registration Integration - Complete

## ✅ Integration Status

The EM&V program has been successfully integrated with the License Service for Professional Engineer (PE) registration and management.

## Implemented Endpoints

### 1. `/api/pe/verify` (POST)
**Purpose:** Verify PE license during registration from License Service

**Request Format:**
```json
{
  "license_number": "12345",
  "state": "TX",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response Format:**
```json
{
  "verified": true/false,
  "message": "PE license verified" or "PE license not found in system. Registration allowed for admin review.",
  "pe_id": "user_abc123",
  "verification_status": "verified" or "pending"
}
```

**Location:** Line ~25557 in `main_hardened_ready_fixed.py`

---

### 2. `/api/pe/register` (POST) - Updated
**Purpose:** Register PE from License Service (supports both original and License Service formats)

**License Service Request Format:**
```json
{
  "user_id": "user_abc123",
  "username": "jdoe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "license_number": "12345",
  "state": "TX",
  "company": "ABC Engineering",
  "org_id": "org_xyz789",
  "verified": true
}
```

**Response Format:**
```json
{
  "status": "success",
  "success": true,
  "pe_id": "user_abc123",
  "message": "PE John Doe registered successfully"
}
```

**Location:** Line ~25423 in `main_hardened_ready_fixed.py`

**Note:** This endpoint now supports both:
- Original EM&V format (pe_id, name, license_number, state, discipline, expiration_date)
- License Service format (user_id, username, email, first_name, last_name, etc.)

---

### 3. `/api/pe/<user_id>/link-org` (POST)
**Purpose:** Link a PE to an organization

**Request Format:**
```json
{
  "org_id": "org_xyz789"
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "PE linked to organization org_xyz789"
}
```

**Location:** Line ~25700 in `main_hardened_ready_fixed.py`

---

## Integration Flow

1. **User Registers as Licensed PE in License Service**
   - License Service calls `/api/pe/verify` to check if PE exists
   - User account created with `pe_approval_status = "pending"`

2. **Admin Approves PE in License Service**
   - License Service calls `/api/pe/register` to register PE in EM&V
   - PE becomes available in EM&V program

3. **Admin Links PE to Organization (Optional)**
   - License Service calls `/api/pe/{user_id}/link-org`
   - PE is associated with organization in EM&V

## Data Storage

PEs are stored in the `ProfessionalOversight` class's `pe_certifications` dictionary with the following structure:

```python
{
    "pe_id": "user_abc123",
    "user_id": "user_abc123",
    "username": "jdoe",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "license_number": "12345",
    "state": "TX",
    "discipline": "Electrical",
    "company": "ABC Engineering",
    "org_id": "org_xyz789",
    "verified": true,
    "verification_status": "verified",
    "expiration_date": "2027-01-10T...",
    "registration_date": "2026-01-10T...",
    "status": "active"
}
```

## Testing

To test the integration:

1. **Test PE Verification:**
   ```bash
   curl -X POST http://localhost:8082/api/pe/verify \
     -H "Content-Type: application/json" \
     -d '{"license_number":"12345","state":"TX","first_name":"John","last_name":"Doe"}'
   ```

2. **Test PE Registration:**
   ```bash
   curl -X POST http://localhost:8082/api/pe/register \
     -H "Content-Type: application/json" \
     -d '{"user_id":"user_test123","username":"testpe","email":"test@example.com","first_name":"Test","last_name":"PE","license_number":"12345","state":"TX","company":"Test Co","org_id":"org_test","verified":true}'
   ```

3. **Test Organization Linking:**
   ```bash
   curl -X POST http://localhost:8082/api/pe/user_test123/link-org \
     -H "Content-Type: application/json" \
     -d '{"org_id":"org_test"}'
   ```

## Next Steps

1. ✅ EM&V API endpoints implemented
2. ✅ Hash fragment handling added to PE dashboard (`#register` now works)
3. ⏳ Test end-to-end registration flow
4. ⏳ Ensure registered PEs appear in EM&V selection dropdowns
5. ⏳ Update EM&V frontend to show PEs from License Service

## Files Modified

- `main_hardened_ready_fixed.py`:
  - Added `/api/pe/verify` endpoint (line ~25557)
  - Updated `/api/pe/register` endpoint to support License Service format (line ~25423)
  - Added `/api/pe/<user_id>/link-org` endpoint (line ~25700)
  - Added hash fragment handling for `#register` in PE dashboard (line ~27442)

## Notes

- The `ProfessionalOversight` class stores PEs in memory. For production, consider persisting to database.
- Default discipline is set to "Electrical" for License Service registrations. This can be updated later.
- Default expiration date is set to 2 years from registration date.
- The integration maintains backward compatibility with existing EM&V PE registration format.
