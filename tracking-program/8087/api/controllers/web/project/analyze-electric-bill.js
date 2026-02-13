/**
 * Analyze Electric Bill
 * Accepts an uploaded PDF, extracts data via:
 * 1. PDF form fields (AcroForm) - fastest for fillable bills
 * 2. pdf-parse text extraction
 * 3. pdf.js-extract (alternative parser) when pdf-parse returns little text
 * 4. OCR (pdf2pic + Tesseract) for scanned PDFs, with 2-min timeout
 * Returns JSON for Bill Analytic form pre-fill.
 */
'use strict';

module.exports = {
  friendlyName: 'Analyze electric bill PDF',
  description: 'Extract and parse electric bill data from uploaded PDF (form fields, text, OCR).',
  files: ['bill'],
  inputs: {
    project: {
      description: 'Project ID.',
      type: 'number',
      required: true
    },
    bill: {
      description: 'Uploaded PDF file.',
      type: 'ref',
      required: true
    }
  },
  exits: {
    success: { outputExample: '{ success: true, data: {...} }' },
    badRequest: { statusCode: 400 },
    serverError: { statusCode: 500 }
  },
  fn: function (inputs, exits) {
    const fs = require('fs');
    const StorageService = require('../../../services/StorageService');
    const pdfFormExtractor = require('../../../services/utilities/pdf-form-extractor');
    const pdfOcr = require('../../../services/utilities/pdf-ocr');
    const pdfjsExtractor = require('../../../services/utilities/pdfjs-text-extractor');
    const parser = require('../../../services/utilities/electric-bill-parser');

    const tempDir = StorageService.localPath('temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempName = 'analyze-bill-' + inputs.project + '-' + Date.now();

    inputs.bill.upload({
      adapter: require('skipper-disk'),
      dirname: tempDir,
      saveAs: tempName + '.pdf',
      maxBytes: 10 * 1024 * 1024
    }, function (err, uploadedFiles) {
      if (err) {
        return exits.serverError(err);
      }
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return exits.badRequest(new Error('No file uploaded'));
      }

      const fd = uploadedFiles[0].fd;
      const dataBuffer = fs.readFileSync(fd);
      const pdfParse = require('pdf-parse');

      function cleanup() {
        try { if (fd && fs.existsSync(fd)) fs.unlinkSync(fd); } catch (e) { sails.log.warn('Could not remove temp PDF:', e); }
      }

      function finishWithText(text) {
        const parsed = parser.parse(text || '');
        if (parsed.success) {
          return exits.success({ success: true, data: parsed.data, partial: parsed.partial });
        }
        if (parsed.data && Object.keys(parsed.data).length > 0) {
          return exits.success({ success: true, data: parsed.data, partial: true });
        }
        return exits.success({
          success: false,
          error: 'Could not extract bill data from PDF. Please enter the information manually.',
          data: {}
        });
      }

      // 1. Try PDF form fields first (fast for fillable bills)
      pdfFormExtractor.extractFromFormFields(dataBuffer)
        .then(function (formResult) {
          if (formResult.success && (formResult.data.totalKwh || formResult.data.billAmount || formResult.data.kwPeak)) {
            sails.log.info('Bill PDF: extracted data from form fields');
            cleanup();
            return exits.success({ success: true, data: formResult.data, partial: formResult.partial });
          }

          // 2. Try pdf-parse text extraction
          return pdfParse(dataBuffer)
            .then(function (pdfData) {
              let text = (pdfData && pdfData.text) ? pdfData.text : '';
              if (!pdfOcr.shouldUseOcr(text)) {
                cleanup();
                return finishWithText(text);
              }

              // 3. pdf-parse returned little text - try pdf.js-extract before OCR
              return pdfjsExtractor.extractText(dataBuffer)
                .then(function (pdfjsText) {
                  if (!pdfOcr.shouldUseOcr(pdfjsText)) {
                    sails.log.info('Bill PDF: pdf.js-extract yielded text where pdf-parse did not');
                    cleanup();
                    return finishWithText(pdfjsText);
                  }

                  // 4. Fall back to OCR with timeout
                  sails.log.info('Bill PDF has little text, trying OCR for scanned/image PDF...');
                  return pdfOcr.extractTextViaOcrWithTimeout(dataBuffer, tempDir, tempName)
                    .then(function (ocrText) {
                      cleanup();
                      return finishWithText(ocrText || text);
                    })
                    .catch(function (ocrErr) {
                      sails.log.warn('OCR fallback failed:', ocrErr.message || ocrErr);
                      cleanup();
                      return finishWithText(text);
                    });
                })
                .catch(function (pdfjsErr) {
                  sails.log.warn('pdf.js-extract failed:', pdfjsErr.message || pdfjsErr);
                  return pdfOcr.extractTextViaOcrWithTimeout(dataBuffer, tempDir, tempName)
                    .then(function (ocrText) {
                      cleanup();
                      return finishWithText(ocrText || text);
                    })
                    .catch(function (ocrErr) {
                      sails.log.warn('OCR fallback failed:', ocrErr.message || ocrErr);
                      cleanup();
                      return finishWithText(text);
                    });
                });
            });
        })
        .catch(function (err) {
          cleanup();
          sails.log.error('Bill analysis error:', err);
          return exits.serverError(new Error('Failed to read PDF. The file may be corrupted or password-protected.'));
        });
    });
  }
};
