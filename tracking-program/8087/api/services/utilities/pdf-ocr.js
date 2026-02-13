/**
 * PDF OCR - Extract text from scanned/image PDFs using pdf2pic + tesseract.js
 * Used when pdf-parse returns little or no text (image-based PDFs).
 */
'use strict';

const MIN_TEXT_LENGTH_FOR_OCR_FALLBACK = 80;
const OCR_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes - prevent long hangs
const PDF2PIC_DENSITY = 200;
const PDF2PIC_FORMAT = 'png';

/**
 * Extract text from a PDF using OCR (for scanned/image PDFs).
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @param {string} tempDir - Directory for temporary image files
 * @param {string} baseName - Base name for temp files (no extension)
 * @returns {Promise<string>} - Extracted text from all pages
 */
async function extractTextViaOcr(pdfBuffer, tempDir, baseName) {
  const path = require('path');
  const fs = require('fs');
  const { fromBuffer } = require('pdf2pic');
  const Tesseract = require('tesseract.js');

  const options = {
    density: PDF2PIC_DENSITY,
    format: PDF2PIC_FORMAT,
    savePath: tempDir,
    saveFilename: baseName
  };

  const convert = fromBuffer(pdfBuffer, options);
  const result = await convert.bulk(-1, { responseType: 'image' });

  if (!result || !Array.isArray(result) || result.length === 0) {
    return '';
  }

  const worker = await Tesseract.createWorker('eng');
  let fullText = '';

  try {
    for (let i = 0; i < result.length; i++) {
      const pageResult = result[i];
      const imagePath = (pageResult && (pageResult.path || pageResult.name)) ||
        path.join(tempDir, baseName + '.' + (i + 1) + '.' + PDF2PIC_FORMAT);
      if (fs.existsSync(imagePath)) {
        const ocrResult = await worker.recognize(imagePath);
        fullText += (ocrResult && ocrResult.data && ocrResult.data.text) ? ocrResult.data.text : '';
        fullText += '\n';
        try { fs.unlinkSync(imagePath); } catch (e) { /* ignore */ }
      }
    }
  } finally {
    await worker.terminate();
  }

  return fullText.trim();
}

/**
 * Extract text via OCR with a timeout to prevent long hangs.
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @param {string} tempDir - Directory for temporary image files
 * @param {string} baseName - Base name for temp files (no extension)
 * @param {number} [timeoutMs=OCR_TIMEOUT_MS] - Max time before aborting
 * @returns {Promise<string>} - Extracted text, or '' on timeout
 */
async function extractTextViaOcrWithTimeout(pdfBuffer, tempDir, baseName, timeoutMs) {
  const ms = timeoutMs != null ? timeoutMs : OCR_TIMEOUT_MS;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('OCR timed out after ' + (ms / 1000) + ' seconds')), ms);
  });
  return Promise.race([
    extractTextViaOcr(pdfBuffer, tempDir, baseName),
    timeoutPromise
  ]);
}

/**
 * Check if we should fall back to OCR (extracted text too short).
 * @param {string} text - Text extracted by pdf-parse
 * @returns {boolean}
 */
function shouldUseOcr(text) {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.replace(/\s/g, '').trim();
  return trimmed.length < MIN_TEXT_LENGTH_FOR_OCR_FALLBACK;
}

module.exports = {
  extractTextViaOcr,
  extractTextViaOcrWithTimeout,
  shouldUseOcr,
  MIN_TEXT_LENGTH_FOR_OCR_FALLBACK,
  OCR_TIMEOUT_MS
};
