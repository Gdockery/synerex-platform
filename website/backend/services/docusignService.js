import pkg from 'docusign-esign';
const { ApiClient, EnvelopesApi, EnvelopeDefinition, Signer, SignHere, Tabs, Document, Recipients, TemplatesApi } = pkg;
import fs from 'fs';
import path from 'path';
import { sendNDACompletionEmail } from './emailService.js';

// DocuSign API Client Setup
const apiClient = new ApiClient();
apiClient.setBasePath(process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi');

// JWT Authentication
async function authenticate() {
  try {
    const jwtLifeSec = 3600; // 1 hour
    const results = await apiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATION_KEY,
      process.env.DOCUSIGN_USER_ID,
      ['signature', 'impersonation'],
      fs.readFileSync(process.env.DOCUSIGN_RSA_PRIVATE_KEY),
      jwtLifeSec
    );
    
    const accessToken = results.body.access_token;
    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);
    
    return accessToken;
  } catch (error) {
    console.error('DocuSign authentication failed:', error);
    throw new Error('Failed to authenticate with DocuSign');
  }
}

// Create NDA Document
export async function createNDA({ counterpartyName, counterpartyEmail, company, message }) {
  try {
    // Authenticate with DocuSign
    await authenticate();
    
    const envelopesApi = new EnvelopesApi(apiClient);
    
    // Create envelope definition
    const envelope = new EnvelopeDefinition();
    envelope.emailSubject = `NDA Request from Synerex - ${counterpartyName}`;
    envelope.status = 'sent';
    
    // Add document (you'll need to upload your NDA template to DocuSign)
    const document = new Document();
    document.documentBase64 = await getNDATemplate();
    document.name = 'Mutual Non-Disclosure Agreement';
    document.fileExtension = 'pdf';
    document.documentId = '1';
    envelope.documents = [document];
    
    // Add signer
    const signer = new Signer();
    signer.email = counterpartyEmail;
    signer.name = counterpartyName;
    signer.recipientId = '1';
    signer.routingOrder = '1';
    
    // Add signing tab
    const signHere = new SignHere();
    signHere.documentId = '1';
    signHere.pageNumber = '1';
    signHere.recipientId = '1';
    signHere.tabLabel = 'SignHere';
    signHere.xPosition = '100';
    signHere.yPosition = '100';
    
    const tabs = new Tabs();
    tabs.signHereTabs = [signHere];
    signer.tabs = tabs;
    
    // Add recipients
    const recipients = new Recipients();
    recipients.signers = [signer];
    envelope.recipients = recipients;
    
    // Send envelope
    const results = await envelopesApi.createEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID,
      { envelopeDefinition: envelope }
    );
    
    return {
      envelopeId: results.envelopeId,
      status: results.status,
      statusDateTime: results.statusDateTime
    };
    
  } catch (error) {
    console.error('Error creating NDA:', error);
    throw new Error(`Failed to create NDA: ${error.message}`);
  }
}

// Get NDA Template from DocuSign or file system
async function getNDATemplate() {
  // Try to use DocuSign template first
  if (process.env.NDA_TEMPLATE_ID) {
    try {
      await authenticate();
      const templatesApi = new TemplatesApi(apiClient);
      const template = await templatesApi.get(process.env.DOCUSIGN_ACCOUNT_ID, process.env.NDA_TEMPLATE_ID);
      return template;
    } catch (error) {
      console.warn('DocuSign template not found, using file system template');
    }
  }
  
  // Fallback to file system template
  const templatePath = path.join(process.cwd(), '..', 'public', 'docs', 'Synerex NDA.pdf');
  
  try {
    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, { encoding: 'base64' });
    }
  } catch (error) {
    console.warn('NDA template file not found');
  }
  
  // Return a minimal base64 PDF as last resort
  return 'JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQo+PgpzdHJlYW0KJVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQo+PgpzdHJlYW0K';
}

// Get envelope status
export async function getEnvelopeStatus(envelopeId) {
  try {
    await authenticate();
    
    const envelopesApi = new EnvelopesApi(apiClient);
    const results = await envelopesApi.getEnvelope(
      process.env.DOCUSIGN_ACCOUNT_ID,
      envelopeId
    );
    
    return {
      envelopeId: results.envelopeId,
      status: results.status,
      statusDateTime: results.statusDateTime,
      completedDateTime: results.completedDateTime
    };
    
  } catch (error) {
    console.error('Error getting envelope status:', error);
    throw new Error(`Failed to get envelope status: ${error.message}`);
  }
}

// Handle DocuSign webhook when NDA is completed
export async function handleNDACompletion(envelopeId) {
  try {
    console.log(`Processing completed NDA: ${envelopeId}`);
    
    // Get envelope details
    await authenticate();
    const envelopesApi = new EnvelopesApi(apiClient);
    const envelope = await envelopesApi.getEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, envelopeId);
    
    // Get completed document
    const document = await envelopesApi.getDocument(
      process.env.DOCUSIGN_ACCOUNT_ID,
      envelopeId,
      '1' // Document ID
    );
    
    // Create storage directory
    const today = new Date().toISOString().split('T')[0];
    const storageDir = path.join(process.cwd(), '..', 'completed-ndas', today);
    
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    // Generate filename
    const signerName = envelope.recipients?.signers?.[0]?.name || 'Unknown';
    const company = envelope.recipients?.signers?.[0]?.email || 'Unknown';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NDA_${signerName.replace(/\s+/g, '_')}_${company.split('@')[0]}_${timestamp}.pdf`;
    
    // Save completed NDA
    const filePath = path.join(storageDir, filename);
    fs.writeFileSync(filePath, document);
    
    console.log(`Completed NDA saved: ${filePath}`);
    
    // Send email notification
    await sendNDACompletionEmail({
      envelopeId,
      signerName,
      signerEmail: envelope.recipients?.signers?.[0]?.email,
      company: company.split('@')[0],
      completedDate: envelope.completedDateTime,
      filePath,
      filename
    });
    
    return {
      success: true,
      filePath,
      filename,
      envelopeId
    };
    
  } catch (error) {
    console.error('Error handling NDA completion:', error);
    throw new Error(`Failed to handle NDA completion: ${error.message}`);
  }
}

// Webhook endpoint handler
export async function processWebhook(webhookData) {
  try {
    const { event, data } = webhookData;
    
    if (event === 'envelope-completed') {
      const envelopeId = data.envelopeId;
      return await handleNDACompletion(envelopeId);
    }
    
    return { success: true, message: 'Webhook processed' };
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
}
