/**
 * PDF Form Field Extractor
 * Extracts AcroForm field values from fillable PDFs (e.g. utility bills).
 * Used as the first extraction step - many bills have form fields with structured data.
 */
'use strict';

const FIELD_NAME_MAPPINGS = [
  // totalKwh
  { pattern: /usage|kwh|kilowatt|energy\s*consumed/i, key: 'totalKwh', parse: parseNum },
  // kwPeak
  { pattern: /demand|peak\s*kw|kw\s*peak/i, key: 'kwPeak', parse: parseNum },
  // billAmount
  { pattern: /total\s*due|amount\s*due|balance|current\s*charge|grand\s*total/i, key: 'billAmount', parse: parseAmount },
  // daysBilled
  { pattern: /billing\s*days|days\s*billed|days\s*in\s*period/i, key: 'daysBilled', parse: parseNum },
  // customerCharge
  { pattern: /customer\s*charge|service\s*charge/i, key: 'customerCharge', parse: parseAmount },
  // kwRatePerTariff
  { pattern: /demand\s*rate|demand\s*charge|kw\s*rate/i, key: 'kwRatePerTariff', parse: parseNum },
  // voltage
  { pattern: /voltage|primary|secondary/i, key: 'voltage', parse: parseVoltage },
  // tariff
  { pattern: /tariff|rate\s*schedule|rate\s*class|schedule|rate\s*code/i, key: 'tariff', parse: identity },
  // electricCompanyName
  { pattern: /utility|company\s*name|electric\s*company/i, key: 'electricCompanyName', parse: identity },
  // accountNumber
  { pattern: /account\s*(?:#|number|no)/i, key: 'accountNumber', parse: identity },
  // meterNumber
  { pattern: /meter\s*(?:#|number|no)/i, key: 'meterNumber', parse: identity },
  // serviceAddress
  { pattern: /service\s*address|service\s*location|meter\s*location/i, key: 'serviceAddress', parse: identity },
  // billDate / billReference
  { pattern: /bill\s*date|statement\s*date|due\s*date|service\s*period/i, key: 'billReference', parse: identity }
];

function parseNum(val) {
  if (val == null || val === '') return null;
  const s = String(val).replace(/,/g, '').trim();
  const m = s.match(/[\d.]+/);
  return m ? m[0] : null;
}

function parseAmount(val) {
  if (val == null || val === '') return null;
  const s = String(val).replace(/[$,]/g, '').trim();
  const m = s.match(/[\d.]+/);
  return m ? m[0] : null;
}

function parseVoltage(val) {
  if (val == null || val === '') return null;
  const m = String(val).match(/\b(120|208|240|277|480|600)\b/i);
  if (m) return parseInt(m[1], 10);
  return null;
}

function identity(val) {
  if (val == null || val === '') return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

/**
 * Get text value from a pdf-lib form field.
 * pdf-lib field types: PDFTextField, PDFDropdown, PDFCheckBox, PDFRadioGroup.
 */
function getFieldValue(field) {
  try {
    const typeName = field.constructor.name;
    if (typeName === 'PDFTextField') return field.getText();
    if (typeName === 'PDFDropdown') {
      const sel = field.getSelected();
      return (Array.isArray(sel) && sel[0]) || sel || null;
    }
    if (typeName === 'PDFCheckBox') return field.isChecked() ? 'Yes' : null;
    if (typeName === 'PDFRadioGroup') {
      const sel = field.getSelected();
      return (Array.isArray(sel) && sel[0]) || sel || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Extract bill data from PDF form fields.
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @returns {Promise<{ success: boolean, data: object, partial?: boolean }>}
 */
async function extractFromFormFields(pdfBuffer) {
  const { PDFDocument } = require('pdf-lib');
  const result = {};

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    if (!form) {
      return { success: false, data: {} };
    }

    const fields = form.getFields();
    if (!fields || fields.length === 0) {
      return { success: false, data: {} };
    }

    for (const field of fields) {
      const name = field.getName();
      const value = getFieldValue(field);
      if (value == null || value === '') continue;

      const strVal = Array.isArray(value) ? value.join(' ') : String(value);

      for (const mapping of FIELD_NAME_MAPPINGS) {
        if (mapping.pattern.test(name) && !result[mapping.key]) {
          const parsed = mapping.parse(strVal);
          if (parsed != null) {
            result[mapping.key] = parsed;
            break;
          }
        }
      }
    }

    // Also try common abbreviated/short names
    const shortNames = {
      totalKwh: ['usage', 'kwh', 'totalkwh', 'total_usage'],
      billAmount: ['amount', 'total', 'due', 'balance', 'charges'],
      kwPeak: ['demand', 'kw', 'peak'],
      accountNumber: ['account', 'acct', 'acctno'],
      daysBilled: ['days', 'billingdays']
    };
    for (const field of fields) {
      const name = (field.getName() || '').toLowerCase().replace(/[\s_-]/g, '');
      const value = getFieldValue(field);
      if (value == null || value === '') continue;
      const strVal = Array.isArray(value) ? value.join(' ') : String(value);

      for (const [key, patterns] of Object.entries(shortNames)) {
        if (result[key]) continue;
        if (patterns.some(p => name.includes(p) || name === p)) {
          const mapping = FIELD_NAME_MAPPINGS.find(m => m.key === key);
          const parsed = mapping ? mapping.parse(strVal) : parseNum(strVal) || strVal;
          if (parsed != null) {
            result[key] = parsed;
            break;
          }
        }
      }
    }

    const hasMinimumData = result.totalKwh || result.kwPeak || result.billAmount;
    return {
      success: !!hasMinimumData,
      data: result,
      partial: hasMinimumData && !(result.totalKwh && result.kwPeak && result.billAmount)
    };
  } catch (e) {
    return { success: false, data: {} };
  }
}

module.exports = {
  extractFromFormFields
};
