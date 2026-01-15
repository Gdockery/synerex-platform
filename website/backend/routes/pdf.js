import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

router.get('/generate-emv-program-pdf', async (req, res) => {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
    
    const url = req.query.url || 'http://localhost:5173/emv-program';
    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait a bit for any animations or dynamic content
    await page.waitForTimeout(1000);

    // Inject print-specific CSS for better formatting
    await page.addStyleTag({
      content: `
        @media print {
          @page { 
            size: A4; 
            margin: 0.75in; 
          }
          * { 
            background: white !important; 
            color: #000 !important; 
            box-shadow: none !important;
            text-shadow: none !important;
          }
          body { 
            background: white !important;
            font-size: 11pt; 
            line-height: 1.5; 
            color: #000 !important;
            padding: 0 !important;
          }
          button, a[href], .no-print { 
            display: none !important; 
          }
          .max-w-7xl { 
            max-width: 100% !important; 
            padding: 0 !important; 
          }
          section:first-child { 
            page-break-after: avoid; 
            margin-bottom: 20pt !important; 
            padding: 15pt 0 !important; 
          }
          h1 { 
            font-size: 24pt !important; 
            margin-bottom: 10pt !important; 
            page-break-after: avoid; 
          }
          h2 { 
            font-size: 18pt !important; 
            margin-top: 20pt !important; 
            margin-bottom: 12pt !important; 
            page-break-after: avoid; 
            border-bottom: 2pt solid #000 !important; 
            padding-bottom: 6pt !important; 
          }
          h3 { 
            font-size: 14pt !important; 
            margin-top: 15pt !important; 
            margin-bottom: 8pt !important; 
            page-break-after: avoid; 
            font-weight: bold !important; 
          }
          p, li, span { 
            font-size: 10pt !important; 
            line-height: 1.4 !important; 
            color: #000 !important; 
          }
          section { 
            page-break-inside: avoid; 
            margin-bottom: 20pt !important; 
            padding: 0 !important; 
          }
          .bg-gray-900\\/50, .bg-gray-800\\/50, 
          .bg-gradient-to-br, .bg-gradient-to-r,
          .backdrop-blur-sm { 
            background: white !important; 
            border: 1pt solid #ccc !important; 
            border-radius: 0 !important; 
            padding: 12pt !important; 
            margin-bottom: 12pt !important; 
            page-break-inside: avoid; 
          }
          .grid { 
            display: block !important; 
          }
          .grid > * { 
            width: 100% !important; 
            margin-bottom: 15pt !important; 
            page-break-inside: avoid; 
          }
          ul { 
            margin: 8pt 0 !important; 
            padding-left: 20pt !important; 
          }
          li { 
            margin-bottom: 6pt !important; 
            line-height: 1.4 !important; 
          }
          img { 
            max-width: 200pt !important; 
            height: auto !important; 
            filter: none !important; 
            -webkit-filter: none !important; 
          }
          section:first-child img { 
            max-width: 150pt !important; 
          }
          .mb-16, .mb-8, .mb-6, .mb-4 { 
            margin-bottom: 12pt !important; 
          }
          .mt-8 { 
            margin-top: 12pt !important; 
          }
          .text-purple-400, .text-blue-400 { 
            color: #000 !important; 
            font-weight: bold !important; 
          }
          .text-gray-300, .text-gray-400, .text-gray-100 { 
            color: #333 !important; 
          }
          .text-white { 
            color: #000 !important; 
          }
          .text-purple-400.mr-2 { 
            color: #000 !important; 
            font-weight: bold !important; 
          }
          h2 + div, h3 + ul, h3 + p { 
            page-break-before: avoid; 
          }
          .grid.md\\:grid-cols-3,
          .grid.md\\:grid-cols-2 { 
            display: block !important; 
          }
          .bg-gradient-to-r { 
            border: 1pt solid #000 !important; 
            padding: 15pt !important; 
          }
        }
      `
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: false, // Set to false since we're converting to white
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 9pt; text-align: center; width: 100%; color: #000;">SYNEREX EM&V Program Overview</div>',
      footerTemplate: '<div style="font-size: 9pt; text-align: center; width: 100%; color: #000;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="EMV-Program-Overview.pdf"');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      message: error.message 
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

export default router;
