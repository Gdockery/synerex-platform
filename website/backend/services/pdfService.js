import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export async function generateSOWPDF(sowData) {
  let browser;
  
  try {
    // Create HTML template for PDF
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Synerex SOW - ${sowData.projectName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #0066cc;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #0066cc;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #0066cc;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .field {
          margin-bottom: 10px;
        }
        .field-label {
          font-weight: bold;
          color: #444;
        }
        .field-value {
          margin-left: 10px;
          padding: 5px;
          background-color: #f9f9f9;
          border-left: 3px solid #0066cc;
        }
        .signature-section {
          margin-top: 40px;
          border-top: 2px solid #ddd;
          padding-top: 20px;
        }
        .signature-box {
          display: inline-block;
          width: 45%;
          margin: 10px;
          vertical-align: top;
        }
        .signature-line {
          border-bottom: 1px solid #333;
          height: 30px;
          margin-bottom: 5px;
        }
        @media print {
          body { margin: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Synerex Laboratories, LLC</h1>
        <p>Statement of Work (SOW)</p>
        <p>Project: ${sowData.projectName || 'N/A'}</p>
        <p>Date: ${sowData.date || 'N/A'}</p>
      </div>

      <div class="section">
        <h2>1. Project Overview</h2>
        <div class="field">
          <span class="field-label">Project Name:</span>
          <div class="field-value">${sowData.projectName || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Prepared For (Licensee):</span>
          <div class="field-value">${sowData.licensee || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Date:</span>
          <div class="field-value">${sowData.date || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>2. Scope of Work</h2>
        <div class="field">
          <span class="field-label">In-Scope:</span>
          <div class="field-value">${sowData.inScope || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Out-of-Scope:</span>
          <div class="field-value">${sowData.outScope || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>3. Deliverables</h2>
        <div class="field">
          <span class="field-label">Technology Deliverables:</span>
          <div class="field-value">${sowData.techDeliverables || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Support Deliverables:</span>
          <div class="field-value">${sowData.supportDeliverables || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>4. License Framework & Commercial Terms</h2>
        <div class="field">
          <span class="field-label">License Type:</span>
          <div class="field-value">${sowData.licenseType || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Royalty Model:</span>
          <div class="field-value">${sowData.royaltyModel || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Upfront Fees / Minimum Guarantees:</span>
          <div class="field-value">${sowData.upfrontFees || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">License Term:</span>
          <div class="field-value">${sowData.term || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>5. Roles & Responsibilities</h2>
        <div class="field">
          <span class="field-label">Synerex Responsibilities:</span>
          <div class="field-value">${sowData.synerexResp || 'N/A'}</div>
        </div>
        <div class="field">
          <span class="field-label">Licensee Responsibilities:</span>
          <div class="field-value">${sowData.licenseeResp || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>6. Timeline & Milestones</h2>
        <div class="field">
          <span class="field-label">Milestones:</span>
          <div class="field-value">${sowData.milestones || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>7. Acceptance Criteria</h2>
        <div class="field">
          <span class="field-label">Acceptance Criteria:</span>
          <div class="field-value">${sowData.acceptanceCriteria || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <h2>8. Change Management</h2>
        <div class="field">
          <span class="field-label">Change Management:</span>
          <div class="field-value">${sowData.changeManagement || 'N/A'}</div>
        </div>
      </div>

      <div class="signature-section">
        <h2>9. Signatures</h2>
        <div class="signature-box">
          <div class="field-label">Synerex Representative:</div>
          <div class="signature-line"></div>
          <div style="font-size: 12px; color: #666;">${sowData.synerexRep || 'Name'}</div>
        </div>
        <div class="signature-box">
          <div class="field-label">Licensee Representative:</div>
          <div class="signature-line"></div>
          <div style="font-size: 12px; color: #666;">${sowData.licenseeRep || 'Name'}</div>
        </div>
      </div>
    </body>
    </html>
    `;

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set content and generate PDF
    await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    // Save PDF to file
    const fileName = `SOW-${sowData.projectName?.replace(/[^a-zA-Z0-9]/g, '-') || 'Unknown'}-${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'generated-pdfs', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, pdfBuffer);
    
    return {
      fileName,
      filePath,
      buffer: pdfBuffer
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
