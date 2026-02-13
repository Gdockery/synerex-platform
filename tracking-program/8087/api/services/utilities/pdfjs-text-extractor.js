/**
 * PDF.js Text Extractor
 * Alternative to pdf-parse using Mozilla PDF.js (via pdf.js-extract).
 * Often more reliable for PDFs where pdf-parse returns little or no text.
 */
'use strict';

/**
 * Extract text from a PDF buffer using PDF.js.
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @returns {Promise<string>} - Extracted text from all pages
 */
function extractText(pdfBuffer) {
  const PDFExtract = require('pdf.js-extract').PDFExtract;
  const pdfExtract = new PDFExtract();

  return new Promise((resolve, reject) => {
    pdfExtract.extractBuffer(pdfBuffer, { firstPage: 1, lastPage: undefined }, (err, data) => {
      if (err) return reject(err);
      if (!data || !data.pages) return resolve('');

      const textParts = data.pages.map(function (page) {
        if (!page.content || !Array.isArray(page.content)) return '';
        return page.content.map(function (item) {
          return (item && item.str) ? item.str : '';
        }).join(' ');
      });

      resolve(textParts.join('\n').trim());
    });
  });
}

module.exports = {
  extractText
};
