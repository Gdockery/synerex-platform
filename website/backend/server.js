import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { generateSOWPDF } from './services/pdfService.js';
import { sendSOWEmail, sendConfirmationEmail, sendContactEmail, sendContactConfirmation } from './services/emailService.js';
import pdfRoutes from './routes/pdf.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((entry) => entry.trim()).filter(Boolean)
  : [];

app.use(cors({
  origin: frontendOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PDF routes
app.use('/api/pdf', pdfRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Synerex Backend API'
  });
});

// Contact form submission endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const contactData = req.body;
    
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

    const emailResult = await sendContactEmail(contactData);
    console.log('Contact email sent:', emailResult.messageId);

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
    
    console.log('SOW Submission received:', {
      projectName: sowData.projectName,
      licensee: sowData.licensee,
      date: sowData.date,
      licenseType: sowData.licenseType,
      referenceId,
      timestamp: new Date().toISOString()
    });

    console.log('Generating PDF...');
    const pdfResult = await generateSOWPDF(sowData);
    console.log('PDF generated:', pdfResult.fileName);

    console.log('Sending email...');
    const emailResult = await sendSOWEmail(sowData, pdfResult.filePath, pdfResult.buffer);
    console.log('Email sent:', emailResult.messageId);

    const confirmationResult = await sendConfirmationEmail(sowData, referenceId);
    if (confirmationResult.success) {
      console.log('Confirmation email sent:', confirmationResult.messageId);
    }

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
  console.log("Health check: /health");
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
