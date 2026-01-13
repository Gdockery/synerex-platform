import nodemailer from 'nodemailer';
import fs from 'fs';

// Create transporter (configure with your email service)
const createTransporter = () => {
  // For Gmail (you'll need to set up App Password)
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
      }
    });
  }
  
  // For other SMTP services
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

export async function sendSOWEmail(sowData, pdfPath, pdfBuffer) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.SOW_NOTIFICATION_EMAIL || process.env.EMAIL_USER, // Where to send SOW notifications
      cc: sowData.licenseeEmail || '', // CC the licensee if email provided
      subject: `New SOW Submission: ${sowData.projectName} - ${sowData.licensee}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">New SOW Submission Received</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Project Details</h3>
            <p><strong>Project Name:</strong> ${sowData.projectName || 'N/A'}</p>
            <p><strong>Licensee:</strong> ${sowData.licensee || 'N/A'}</p>
            <p><strong>Date:</strong> ${sowData.date || 'N/A'}</p>
            <p><strong>License Type:</strong> ${sowData.licenseType || 'N/A'}</p>
            <p><strong>Reference ID:</strong> SOW-${Date.now()}</p>
          </div>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #0066cc; margin-top: 0;">Next Steps</h4>
            <ul>
              <li>Review the attached SOW document</li>
              <li>Contact the licensee to discuss terms</li>
              <li>Schedule a follow-up meeting if needed</li>
              <li>Update CRM system with submission details</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            This SOW was automatically generated from the Synerex website submission form.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `SOW-${sowData.projectName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Unknown'}-${Date.now()}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('SOW email sent successfully:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId,
      message: 'SOW email sent successfully'
    };

  } catch (error) {
    console.error('Error sending SOW email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendConfirmationEmail(sowData, referenceId) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: sowData.licenseeEmail || sowData.email || '', // Send to licensee if email provided
      subject: `SOW Submission Confirmation - ${sowData.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">SOW Submission Confirmed</h2>
          
          <p>Dear ${sowData.licensee || 'Valued Partner'},</p>
          
          <p>Thank you for submitting your Statement of Work (SOW) to Synerex Laboratories, LLC. We have received your submission and will review it promptly.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Submission Details</h3>
            <p><strong>Reference ID:</strong> ${referenceId}</p>
            <p><strong>Project Name:</strong> ${sowData.projectName || 'N/A'}</p>
            <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #0066cc; margin-top: 0;">What Happens Next?</h4>
            <ul>
              <li>Our team will review your SOW within 2-3 business days</li>
              <li>We will contact you to discuss the proposed terms</li>
              <li>Any questions or clarifications will be addressed promptly</li>
              <li>Final SOW will be prepared for signature</li>
            </ul>
          </div>
          
          <p>If you have any questions or need to make changes to your submission, please contact us using reference ID: <strong>${referenceId}</strong></p>
          
          <p>Best regards,<br>
          Synerex Laboratories, LLC<br>
          <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a></p>
        </div>
      `
    };

    if (mailOptions.to) {
      const info = await transporter.sendMail(mailOptions);
      console.log('Confirmation email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      console.log('No email address provided for confirmation email');
      return { success: false, message: 'No email address provided' };
    }

  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return { success: false, message: error.message };
  }
}

// Send contact form email
export async function sendContactEmail(contactData) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@synerex.com',
      to: process.env.CONTACT_EMAIL || 'contact@synerexlabs.com',
      subject: `New Contact Form Submission: ${contactData.topic}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${contactData.name}</p>
        <p><strong>Email:</strong> ${contactData.email}</p>
        <p><strong>Company:</strong> ${contactData.company || 'Not provided'}</p>
        <p><strong>Topic:</strong> ${contactData.topic}</p>
        <p><strong>Message:</strong></p>
        <p>${contactData.message}</p>
        <hr>
        <p><strong>Source:</strong> ${contactData.source || 'Direct'}</p>
        <p><strong>UTM Source:</strong> ${contactData.utm_source || 'N/A'}</p>
        <p><strong>UTM Medium:</strong> ${contactData.utm_medium || 'N/A'}</p>
        <p><strong>UTM Campaign:</strong> ${contactData.utm_campaign || 'N/A'}</p>
        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, message: error.message };
  }
}

// Send confirmation email to contact form sender
export async function sendContactConfirmation(contactData) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@synerex.com',
      to: contactData.email,
      subject: 'Thank you for contacting Synerex Laboratories',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Thank You for Contacting Synerex Laboratories</h2>
          
          <p>Dear ${contactData.name},</p>
          
          <p>Thank you for reaching out to us regarding <strong>${contactData.topic}</strong>. We have received your message and will respond within 24 hours during business days.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Your Inquiry Details:</h3>
            <p><strong>Topic:</strong> ${contactData.topic}</p>
            <p><strong>Company:</strong> ${contactData.company || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p style="background-color: white; padding: 10px; border-radius: 4px; border-left: 4px solid #4F46E5;">${contactData.message}</p>
          </div>
          
          <p>Our team is reviewing your inquiry and will provide a detailed response soon. In the meantime, feel free to explore our resources:</p>
          
          <ul>
            <li><a href="https://synerex.com/downloads" style="color: #4F46E5;">Download Center</a> - Access our latest documentation</li>
            <li><a href="https://synerex.com/about" style="color: #4F46E5;">About Us</a> - Learn more about our technology</li>
            <li><a href="https://synerex.com/patented-technology" style="color: #4F46E5;">Our Technology</a> - Explore our ECBS solutions</li>
          </ul>
          
          <p>If you have any urgent questions, please don't hesitate to contact us directly.</p>
          
          <p>Best regards,<br>
          <strong>Synerex Laboratories Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">
            This is an automated confirmation. Please do not reply to this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending contact confirmation email:', error);
    return { success: false, message: error.message };
  }
}

// Send NDA completion notification email
export async function sendNDACompletionEmail(ndaData) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@synerex.com',
      to: process.env.CONTACT_EMAIL || 'synerexlabs@gmail.com',
      subject: `NDA Completed: ${ndaData.signerName} - ${ndaData.company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #22c55e;">NDA Successfully Completed</h2>
          
          <p>A new NDA has been completed and signed through DocuSign.</p>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0369a1; margin-top: 0;">NDA Details</h3>
            <p><strong>Signer Name:</strong> ${ndaData.signerName}</p>
            <p><strong>Company:</strong> ${ndaData.company}</p>
            <p><strong>Email:</strong> ${ndaData.signerEmail}</p>
            <p><strong>Completed Date:</strong> ${new Date(ndaData.completedDate).toLocaleString()}</p>
            <p><strong>Envelope ID:</strong> ${ndaData.envelopeId}</p>
            <p><strong>File:</strong> ${ndaData.filename}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">File Location</h4>
            <p>The completed NDA has been saved to:</p>
            <code style="background-color: white; padding: 8px; border-radius: 4px; display: block; margin: 10px 0;">
              ${ndaData.filePath}
            </code>
          </div>
          
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #065f46; margin-top: 0;">Next Steps</h4>
            <ul>
              <li>Review the completed NDA document</li>
              <li>File the NDA in your records system</li>
              <li>Follow up with the signer if needed</li>
              <li>Update your CRM with the completed NDA</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            This notification was automatically generated when the NDA was completed in DocuSign.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('NDA completion email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Error sending NDA completion email:', error);
    return { success: false, message: error.message };
  }
}
