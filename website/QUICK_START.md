# 🚀 Synerex Backend Quick Start Guide

## Complete Setup in 3 Steps

### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 2: Run Setup Script
```bash
npm run setup
```
This creates your `.env` file with template configuration.

### Step 3: Configure DocuSign (Required for NDA functionality)

#### Get DocuSign Credentials:
1. **Create Account**: Go to [DocuSign Developer Center](https://developers.docusign.com/)
2. **Create Integration**: 
   - Click "Create Integration"
   - Choose "API" → "JWT"
   - Get your **Integration Key**
3. **Generate RSA Key**:
   - Download the RSA key pair
   - Save private key as `private.key` in backend folder
4. **Get Account Info**:
   - **User ID**: Your DocuSign User ID (found in account settings)
   - **Account ID**: Your DocuSign Account ID (found in account settings)

#### Edit backend/.env file:
```env
DOCUSIGN_INTEGRATION_KEY=your_actual_integration_key
DOCUSIGN_USER_ID=your_actual_user_id
DOCUSIGN_ACCOUNT_ID=your_actual_account_id
DOCUSIGN_RSA_PRIVATE_KEY=./private.key
```

### Step 4: Start Backend Server
```bash
npm run dev
```

## Test the Setup

1. **Frontend**: http://localhost:5180 (already running)
2. **Backend**: http://localhost:3001 (start with `npm run dev`)
3. **Test NDA**: Click "Request NDA" button in your frontend

## What Works Without DocuSign

- ✅ Frontend website
- ✅ All pages and navigation
- ✅ Document downloads
- ❌ NDA requests (requires DocuSign setup)

## Troubleshooting

### Backend won't start:
- Check if port 3001 is available
- Verify all dependencies installed: `npm install`

### NDA requests fail:
- Verify DocuSign credentials in `.env`
- Check DocuSign integration is active
- Ensure RSA key file exists and is readable

### Frontend can't connect:
- Ensure backend is running on port 3001
- Check CORS settings in backend/server.js

## Production Deployment

For production:
1. Set `NODE_ENV=production` in `.env`
2. Use production DocuSign base path: `https://www.docusign.net/restapi`
3. Set up SSL certificates
4. Configure reverse proxy

---

**Need Help?** Check `backend/README.md` for detailed documentation.
