import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createNDA, processWebhook } from './services/docusignService.js';
import { generateSOWPDF } from './services/pdfService.js';
import { sendSOWEmail, sendConfirmationEmail, sendContactEmail, sendContactConfirmation } from './services/emailService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5180',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Synerex Backend API'
  });
});

// DocuSign NDA endpoint
app.post('/api/docusign/createNDA', async (req, res) => {
  try {
    const { counterpartyName, counterpartyEmail, company, message } = req.body;
    
    // Validate required fields
    if (!counterpartyName || !counterpartyEmail) {
      return res.status(400).json({
        error: 'Missing required fields: counterpartyName and counterpartyEmail are required'
      });
    }

    // Create NDA via DocuSign
    const result = await createNDA({
      counterpartyName,
      counterpartyEmail,
      company: company || '',
      message: message || ''
    });

    res.json({
      success: true,
      envelopeId: result.envelopeId,
      message: 'NDA request sent successfully'
    });

  } catch (error) {
    console.error('Error creating NDA:', error);
    res.status(500).json({
      error: 'Failed to create NDA',
      message: error.message
    });
  }
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const contactData = req.body;
    
    // Log the contact form submission
    console.log('Contact form submission received:', {
      name: contactData.name,
      email: contactData.email,
      company: contactData.company,
      topic: contactData.topic,
      message: contactData.message,
      source: contactData.source,
      utm_source: contactData.utm_source,
      utm_medium: contactData.utm_medium,
      utm_campaign: contactData.utm_campaign,
      timestamp: new Date().toISOString()
    });

    // Send email notification to Synerex
    const emailResult = await sendContactEmail(contactData);
    console.log('Contact email sent:', emailResult.messageId);

    // Send confirmation email to the sender
    const confirmationResult = await sendContactConfirmation(contactData);
    if (confirmationResult.success) {
      console.log('Confirmation email sent to sender:', confirmationResult.messageId);
    }

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing contact form submission:', error);
    res.status(500).json({
      error: 'Failed to submit contact form',
      message: error.message
    });
  }
});

// SOW submission endpoint
app.post('/submit-sow', async (req, res) => {
  try {
    const sowData = req.body;
    const referenceId = `SOW-${Date.now()}`;
    
    // Log the SOW submission
    console.log('SOW Submission received:', {
      projectName: sowData.projectName,
      licensee: sowData.licensee,
      date: sowData.date,
      licenseType: sowData.licenseType,
      referenceId,
      timestamp: new Date().toISOString()
    });

    // Generate PDF
    console.log('Generating PDF...');
    const pdfResult = await generateSOWPDF(sowData);
    console.log('PDF generated:', pdfResult.fileName);

    // Send email with PDF attachment
    console.log('Sending email...');
    const emailResult = await sendSOWEmail(sowData, pdfResult.filePath, pdfResult.buffer);
    console.log('Email sent:', emailResult.messageId);

    // Send confirmation email to licensee (if email provided)
    const confirmationResult = await sendConfirmationEmail(sowData, referenceId);
    if (confirmationResult.success) {
      console.log('Confirmation email sent:', confirmationResult.messageId);
    }

    // TODO: Save to database
    // TODO: Integrate with CRM system
    
    res.json({
      success: true,
      message: 'SOW submitted successfully and PDF generated',
      referenceId,
      pdfGenerated: true,
      emailSent: true,
      confirmationSent: confirmationResult.success,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing SOW submission:', error);
    res.status(500).json({
      error: 'Failed to submit SOW',
      message: error.message
    });
  }
});

// DocuSign webhook endpoint
app.post('/api/docusign/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('DocuSign webhook received:', webhookData);
    
    // Process the webhook
    const result = await processWebhook(webhookData);
    
    res.json({
      success: true,
      message: 'Webhook processed successfully',
      result
    });

  } catch (error) {
    console.error('Error processing DocuSign webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Synerex Backend Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`NDA endpoint: http://localhost:${PORT}/api/docusign/createNDA`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
