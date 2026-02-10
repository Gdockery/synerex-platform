# Whitelabel Implementation Summary

## What Was Implemented

A complete URL-based whitelabel system that allows different domains to display different branding while sharing the same codebase.

## Key Features

1. **URL-Based Detection**: Automatically detects branding from hostname
   - `harmoniq.synerexlabs.com` → uses `harmoniq/` branding
   - `ucep.synerexlabs.com` → uses `ucep/` branding  
   - `portal.synerexlabs.com` → uses default branding (no whitelabel)

2. **Automatic Fallback**: If a whitelabel asset doesn't exist, falls back to default assets

3. **Transparent URLs**: Frontend always uses standard paths (`/images/logo-small.png`), backend resolves to correct file

4. **PDF Support**: All PDF documents (invoices, proposals, reports) support whitelabel branding

## Files Created

### Configuration
- `config/whitelabel.js` - Whitelabel configuration and hostname extraction logic

### Backend Helpers
- `api/helpers/web/whitelabel/get-asset-path.js` - Resolves asset paths based on hostname
- `api/helpers/web/whitelabel/get-image-url.js` - Helper for EJS templates (returns URL paths)

### Frontend Service
- `src/app/shared/services/whitelabel.service.ts` - Angular service for resolving image URLs

### Documentation
- `whitelabel/README.md` - Setup and usage instructions
- `whitelabel/VENDOR_BRANDING_REQUIREMENTS.md` - Complete vendor documentation with asset specifications

## Files Modified

### Backend
- `api/services/pdf/index.js` - Updated all PDF functions to use whitelabel helper
- `api/helpers/pdf/generate-pdf.js` - Passes request object to PDF service functions
- `config/routes.js` - Updated `/images/*` route to check whitelabel directory first

### Frontend
- `src/app/shared/navbar/navbar.component.ts` - Uses whitelabel service for logo
- `src/app/shared/navbar/navbar.component.html` - Uses dynamic logo URL
- `src/app/shared/toolbar/toolbar.component.ts` - Uses whitelabel service for client logo
- `src/app/welcome/welcome.component.ts` - Uses whitelabel service for welcome image
- `src/app/welcome/welcome.component.html` - Uses dynamic image URL

## How to Add Branding for a New Domain

1. Create directory structure:
   ```bash
   mkdir -p whitelabel/{domain}/images
   mkdir -p whitelabel/{domain}/pdf-resources
   ```

2. Add branding assets following naming in `VENDOR_BRANDING_REQUIREMENTS.md`

3. Set permissions:
   ```bash
   chown -R vagrant:vagrant whitelabel/{domain}
   chmod -R 755 whitelabel/{domain}
   ```

4. Access your domain - branding will appear automatically

## Testing

1. **Test with default (portal)**: `portal.synerexlabs.com` should show default branding
2. **Test with whitelabel**: `harmoniq.synerexlabs.com` should show harmoniq branding (if directory exists)
3. **Test fallback**: If a file is missing in whitelabel, it should use default
4. **Test PDFs**: Generate a PDF and verify branding appears correctly

## Notes

- EJS templates (login page, etc.) continue to use standard paths - the route handler automatically resolves to whitelabel versions
- Client logos and user logos are managed separately and are not part of whitelabel
- Whitelabel directories are typically excluded from git to keep branding private
- The system is backward compatible - works with no whitelabel directory (uses defaults)

## Next Steps for Vendors

Provide vendors with `whitelabel/VENDOR_BRANDING_REQUIREMENTS.md` which contains:
- Complete list of required assets
- File naming conventions
- Image specifications
- Delivery instructions
- Testing guidelines
