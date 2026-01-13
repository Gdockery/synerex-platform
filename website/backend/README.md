# Synerex Backend Server

Backend server for the Synerex website with DocuSign API integration for NDA processing.

## Features

- **DocuSign Integration**: Automated NDA creation and sending
- **RESTful API**: Clean API endpoints for frontend integration
- **Security**: Helmet.js for security headers, CORS configuration
- **Logging**: Morgan for HTTP request logging
- **Environment Configuration**: Secure environment variable management

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your DocuSign credentials:

```bash
cp env.example .env
```

Edit `.env` with your DocuSign API credentials:

```env
# DocuSign API Configuration
DOCUSIGN_INTEGRATION_KEY=your_integration_key_here
DOCUSIGN_USER_ID=your_user_id_here
DOCUSIGN_ACCOUNT_ID=your_account_id_here
DOCUSIGN_RSA_PRIVATE_KEY=path/to/your/private.key
DOCUSIGN_BASE_PATH=https://demo.docusign.net/restapi
DOCUSIGN_OAUTH_BASE_PATH=https://account-d.docusign.com

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5180

# NDA Template Configuration
NDA_TEMPLATE_ID=your_nda_template_id_here
```

### 3. DocuSign Setup

1. **Create DocuSign Developer Account**: Go to [DocuSign Developer Center](https://developers.docusign.com/)
2. **Create Integration**: Create a new integration and get your Integration Key
3. **Generate RSA Key Pair**: Generate RSA key pair for JWT authentication
4. **Get User ID**: Get your DocuSign User ID from your account settings
5. **Get Account ID**: Get your Account ID from your DocuSign account

### 4. NDA Template Setup

1. **Upload Template**: Upload your NDA template to DocuSign
2. **Get Template ID**: Copy the template ID and add it to your `.env` file
3. **Configure Signing Fields**: Set up signing tabs in your template

### 5. Run the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### DocuSign Integration
- **POST** `/api/docusign/createNDA` - Create and send NDA

#### Create NDA Request Body:
```json
{
  "counterpartyName": "John Doe",
  "counterpartyEmail": "john@example.com",
  "company": "Example Corp",
  "message": "Optional message"
}
```

#### Create NDA Response:
```json
{
  "success": true,
  "envelopeId": "envelope-id-here",
  "message": "NDA request sent successfully"
}
```

## Frontend Integration

The frontend is already configured to call the backend API. Update the frontend's API endpoint in `NDAModal.jsx` if needed:

```javascript
const targets = ["http://localhost:3001/api/docusign/createNDA"];
```

## Security Considerations

- Store sensitive credentials in environment variables
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Consider implementing API authentication for production use

## Troubleshooting

### Common Issues:

1. **Authentication Errors**: Verify your DocuSign credentials and RSA key
2. **CORS Issues**: Check FRONTEND_URL in your environment variables
3. **Template Errors**: Ensure your NDA template is properly configured in DocuSign

### Logs:
Check the console output for detailed error messages and API responses.

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use production DocuSign base path: `https://www.docusign.net/restapi`
3. Implement proper logging and monitoring
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx/Apache)
6. Set up process management (PM2)
