# License Agreement Implementation

## Overview
This document describes the implementation of the Software License Agreement acceptance requirement for license registration.

## Changes Made

### 1. Database Model (`app/models/billing.py`)
Added four new fields to the `BillingOrder` model:
- `agreement_accepted`: Boolean flag indicating if the agreement was accepted
- `agreement_version`: String storing the agreement version (e.g., "2026.01")
- `agreement_accepted_at`: Timestamp of when the agreement was accepted
- `agreement_accepted_by`: Identifier (email or org_id) of who accepted the agreement

### 2. Configuration (`app/config.py`)
Added:
- `software_license_agreement_version`: Current version of the agreement (default: "2026.01")

### 3. Registration Form (`app/admin/templates/signup.html`)
Added:
- Scrollable license agreement section displaying the full agreement text
- Required checkbox for agreement acceptance
- Styled to match the existing form design

### 4. Backend Validation (`app/routes/registration.py`)
Updated `register_submit` function to:
- Validate that the agreement checkbox was checked
- Store agreement acceptance details in the `BillingOrder` record
- Return an error if agreement is not accepted

## Database Migration

Since the database schema has changed, you need to update your database:

### Option 1: Recreate Database (Development)
If you're in development and can recreate the database:

```bash
# Backup existing database (if needed)
cp licensing.db licensing.db.backup

# Delete existing database
rm licensing.db

# Recreate with new schema
cd services/license-service
python scripts/setup_database.py
```

### Option 2: Manual Migration (Production)
If you need to preserve existing data, add the columns manually:

```sql
ALTER TABLE billing_orders 
ADD COLUMN agreement_accepted BOOLEAN DEFAULT FALSE;

ALTER TABLE billing_orders 
ADD COLUMN agreement_version VARCHAR(50);

ALTER TABLE billing_orders 
ADD COLUMN agreement_accepted_at TIMESTAMP;

ALTER TABLE billing_orders 
ADD COLUMN agreement_accepted_by VARCHAR(255);
```

## Agreement Text

The current agreement text is embedded in `signup.html`. To update the agreement:

1. Update the agreement text in `app/admin/templates/signup.html`
2. Update `software_license_agreement_version` in `app/config.py`
3. The new version will be stored for all new registrations

## Testing

1. Navigate to `/register`
2. Fill out the registration form
3. Scroll through the license agreement
4. Try submitting without checking the agreement box - should show error
5. Check the agreement box and submit - should proceed to payment
6. Verify in database that `agreement_accepted=True` and other fields are populated

## Legal Considerations

- The agreement text should be reviewed by legal counsel
- Consider storing a full copy of the agreement text in a separate file for audit purposes
- You may want to add a link to download the agreement as a PDF
- Consider adding IP address logging for legal compliance

## Future Enhancements

- Store full agreement text in database or separate file for versioning
- Add agreement history tracking
- Add ability to download agreement as PDF
- Add IP address and user agent logging for acceptance
- Add email notification with agreement copy upon acceptance
