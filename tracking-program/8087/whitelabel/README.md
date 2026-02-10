# Whitelabel Branding Directory

## Overview

This directory contains domain-specific branding assets (logos, graphics, images) for URL-based whitelabeling. Each subdomain can have its own branding while sharing the same codebase.

## Directory Structure

```
whitelabel/
├── harmoniq/
│   ├── images/
│   │   ├── logo-small.png
│   │   ├── logo-big.png
│   │   ├── logo-big1.png
│   │   └── (other frontend images)
│   └── pdf-resources/
│       ├── logo.png
│       ├── bill-cover.png
│       └── (other PDF resources)
├── ucep/
│   ├── images/
│   └── pdf-resources/
└── README.md (this file)
```

## How It Works

1. **URL Detection**: The system extracts the subdomain from the request hostname
   - `harmoniq.synerexlabs.com` → uses `harmoniq/` directory
   - `ucep.synerexlabs.com` → uses `ucep/` directory
   - `portal.synerexlabs.com` → uses default assets (no whitelabel)

2. **Asset Resolution**: When an image is requested:
   - First, check the domain-specific whitelabel directory
   - If not found, fall back to default assets in the repository

3. **Transparent to Users**: URLs remain the same (`/images/logo-small.png`), but the backend serves the appropriate file

## Setting Up Branding for a New Domain

1. Create a directory named after your subdomain:
   ```bash
   mkdir -p whitelabel/{your-domain}/images
   mkdir -p whitelabel/{your-domain}/pdf-resources
   ```

2. Add your branding assets following the naming conventions in `VENDOR_BRANDING_REQUIREMENTS.md`

3. Ensure proper file permissions:
   ```bash
   chown -R vagrant:vagrant whitelabel/{your-domain}
   chmod -R 755 whitelabel/{your-domain}
   ```

4. Test by accessing your domain - branding should appear automatically

## Required Files

See `VENDOR_BRANDING_REQUIREMENTS.md` for a complete list of required and optional assets.

### Minimum Required (Frontend)
- `images/logo-small.png` - Navigation bar logo
- `images/logo-big.png` or `images/logo-big1.png` - Login page logo

### Minimum Required (PDF)
- `pdf-resources/logo.png` - Main logo for PDF documents

## File Naming

- Use exact filenames as specified (case-sensitive)
- Use lowercase with hyphens (e.g., `logo-small.png`, not `Logo-Small.PNG`)
- PNG format for logos (with transparency)
- JPG or PNG for photos/graphics

## Git Ignore

This directory is typically excluded from git to keep branding assets private to each deployment. If you need to track some files, you can add specific exceptions to `.gitignore`.

## Troubleshooting

### Images Not Appearing
1. Check file permissions: `ls -la whitelabel/{domain}/images/`
2. Verify filename matches exactly (case-sensitive)
3. Check server logs for file access errors
4. Ensure directory structure is correct

### Wrong Branding Showing
1. Verify hostname extraction: Check `config/whitelabel.js`
2. Check domain mapping in `config/whitelabel.js` if using custom domains
3. Clear browser cache

### PDF Branding Not Working
1. Ensure PDF resources are in `pdf-resources/` subdirectory
2. Verify filenames match exactly
3. Check that PDF generation has access to request object

## Support

For questions about:
- **Asset requirements**: See `VENDOR_BRANDING_REQUIREMENTS.md`
- **Technical issues**: Contact development team
- **Branding guidelines**: Refer to your organization's brand standards
