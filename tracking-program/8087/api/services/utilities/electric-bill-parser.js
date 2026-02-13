/**
 * Electric Bill Parser
 * Extracts bill data from extracted PDF text using regex and heuristics.
 * Used for Bill Analytic pre-fill when user uploads an electric bill PDF.
 */
'use strict';

module.exports = {
  /**
   * Parse extracted PDF text and return data shape for Bill Analytic form.
   * @param {string} text - Raw text extracted from PDF
   * @returns {object} - { success, data?, error?, partial? }
   */
  parse: function (text) {
    if (!text || typeof text !== 'string') {
      return { success: false, error: 'No text to parse' };
    }

    const t = text.replace(/\s+/g, ' ').trim();
    const result = {};

    // totalKwh - "kWh", "total kWh", "usage", "energy"
    const kwhMatch = t.match(/(?:total\s+)?(?:kwh|kilowatt[\s-]?hours?|usage|energy\s+consumed)[\s:]*(?:=\s*)?([\d,]+(?:\.\d+)?)/i) ||
      t.match(/([\d,]+(?:\.\d+)?)\s*(?:kwh|kilowatt[\s-]?hours?)/i) ||
      t.match(/usage[:\s]+([\d,]+(?:\.\d+)?)/i);
    if (kwhMatch) {
      result.totalKwh = String(kwhMatch[1]).replace(/,/g, '');
    }

    // kwPeak - "peak demand", "demand (kW)", "billed demand", "kW"
    const kwMatch = t.match(/(?:peak\s+)?demand[\s:(]*(?:kw)?[\s)]*[:\s]*([\d,]+(?:\.\d+)?)/i) ||
      t.match(/billed\s+demand[\s:]+([\d,]+(?:\.\d+)?)/i) ||
      t.match(/([\d,]+(?:\.\d+)?)\s*kw\b/i);
    if (kwMatch) {
      result.kwPeak = String(kwMatch[1]).replace(/,/g, '');
    }

    // billAmount - "total due", "amount due", "balance", "current charges"
    const amountMatch = t.match(/(?:total\s+due|amount\s+due|balance\s+due|current\s+charges?)[\s:$]*([\d,]+\.\d{2})/i) ||
      t.match(/\$\s*([\d,]+\.\d{2})\s*(?:total|due)/i) ||
      t.match(/(?:total|grand\s+total)[\s:]*\$?\s*([\d,]+\.\d{2})/i);
    if (amountMatch) {
      result.billAmount = String(amountMatch[1]).replace(/,/g, '');
    }

    // daysBilled - "billing period", "days", "billing days"
    const daysMatch = t.match(/(?:billing\s+)?days[\s:]*(\d+)/i) ||
      t.match(/(\d+)\s*days?\s*(?:billed|in\s+period)/i) ||
      t.match(/billing\s+period[:\s]+(?:\d+\s*-\s*)?\d+\s*\(\s*(\d+)\s*days?/i);
    if (daysMatch) {
      result.daysBilled = daysMatch[1];
    }

    // kwRatePerTariff - "$/kW", "demand charge", "demand rate"
    const kwRateMatch = t.match(/(?:demand\s+)?(?:charge|rate)[\s:$]*([\d.]+)/i) ||
      t.match(/\$\s*([\d.]+)\s*(?:per\s+)?kw/i);
    if (kwRateMatch) {
      result.kwRatePerTariff = kwRateMatch[1];
    }

    // customerCharge - "customer charge", "service charge"
    const custMatch = t.match(/(?:customer|service)\s+charge[\s:$]*([\d.]+)/i);
    if (custMatch) {
      result.customerCharge = custMatch[1];
    }

    // voltage - "480V", "240V", "208V", "primary", "secondary", "service voltage"
    const voltMatch = t.match(/\b(480|240|208|277|120)\s*v(?:olt)?s?\b/i) ||
      t.match(/(?:voltage|service\s+voltage)[\s:]+(\d{3})/i) ||
      t.match(/(?:primary|secondary)\s+(?:voltage)?[\s:]*(\d{3})/i);
    if (voltMatch) {
      const v = parseInt(voltMatch[1], 10);
      if ([120, 208, 240, 277, 480].indexOf(v) >= 0) result.voltage = v;
    }

    // tariff - "tariff", "rate schedule", "rate class", "schedule", "rate code", "rate type", "billing schedule"
    const tariffMatch = t.match(/(?:tariff|rate\s*schedule|rate\s*class|schedule|rate\s*code|rate\s*type|billing\s*schedule)[\s:]+([A-Za-z0-9\s\-\.\/\>\<]{3,80}?)(?=\.\s+[A-Z]|\s+account\b|\s+meter\b|\s+total\s+kwh|$)/i) ||
      t.match(/(?:under\s+)?(?:tariff|schedule)[\s:]+([A-Za-z0-9\s\-\.\/\>\<]{3,60})/i) ||
      t.match(/([A-Z][A-Za-z0-9\-\/]+\s+(?:TOU|GS|General|Large|Small|Primary|Secondary|Medium|Gen)\s+[A-Za-z0-9\s\-\.\/]+)/) ||
      t.match(/([A-Z]{2,6}[\-\s]?[A-Z]?\s+(?:TOU|GS|OPT[\-\s]?V?|General|Large|Small)\s+[A-Za-z0-9\s\-\.\/]+)/i) ||
      t.match(/([A-Za-z0-9\-\/\s]{4,50}(?:TOU|Time[\s\-]?of[\s\-]?Use|General\s*Service|Demand)[A-Za-z0-9\s\-\.\/]*)/i);
    if (tariffMatch) {
      const tariff = tariffMatch[1].trim().replace(/\s+/g, ' ').substring(0, 120);
      if (tariff.length >= 3) result.tariff = tariff;
    }

    // electricCompanyName - often at top; look for common utility patterns
    const utilMatch = t.match(/([A-Z][A-Za-z\s]+(?:Energy|Electric|Power|Utilities?|Corp|Company|Co\.?))\b/);
    if (utilMatch) {
      result.electricCompanyName = utilMatch[1].trim();
    }

    // electricCompanyAddress - street address (often near "billing address" or after utility name)
    const addrMatch = t.match(/(?:billing\s+)?address[\s:]+(\d+[A-Za-z0-9\s\.\-\#]+?)(?=\s*(?:[A-Za-z]+,|[A-Z]{2}\s+\d{5}|$))/i) ||
      t.match(/(\d{1,6}\s+[A-Za-z0-9\s\.\-\#]{4,40}?(?:\s+(?:street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|way|place|pl)\.?)?)\s*(?:,|\s+[A-Z]{2}\s+\d{5}|$)/i);
    if (addrMatch) {
      result.electricCompanyAddress = addrMatch[1].trim().replace(/\s+/g, ' ');
    }

    // electricCompanyCity, State, Zip - "City, ST 12345" or "City ST 12345"
    const cityStateZipMatch = t.match(/([A-Za-z\s\-]+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/) ||
      t.match(/([A-Za-z\s\-]+)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/);
    if (cityStateZipMatch) {
      const city = cityStateZipMatch[1].trim();
      const state = cityStateZipMatch[2];
      const zip = cityStateZipMatch[3];
      if (!result.electricCompanyCity) result.electricCompanyCity = city;
      if (!result.electricCompanyState) result.electricCompanyState = state;
      if (!result.electricCompanyZip) result.electricCompanyZip = zip;
    }

    // serviceAddress, serviceCity, serviceState, serviceZip - "service address", "service location", "meter location"
    const svcAddrMatch = t.match(/(?:service\s+(?:address|location)|meter\s+location|service\s+to)[\s:]+([^\n]+?)(?=\s*\n|$)/i);
    if (svcAddrMatch) {
      const svcLine = svcAddrMatch[1].trim().replace(/\s+/g, ' ');
      const parts = svcLine.split(/,\s*/);
      if (parts[0]) result.serviceAddress = parts[0].trim();
      const svcCsz = svcLine.match(/([A-Za-z\s\-]+),?\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
      if (svcCsz) {
        result.serviceCity = svcCsz[1].trim();
        result.serviceState = svcCsz[2];
        result.serviceZip = svcCsz[3];
      }
    }

    // accountNumber
    const acctMatch = t.match(/(?:account\s*(?:#|number|no\.?)[\s:]*)([A-Za-z0-9\-]+)/i);
    if (acctMatch) {
      result.accountNumber = acctMatch[1].trim();
    }

    // meterNumber
    const meterMatch = t.match(/(?:meter\s*(?:#|number|no\.?)[\s:]*)([\d\-]+)/i);
    if (meterMatch) {
      result.meterNumber = meterMatch[1].trim();
    }

    // voltage - "480V", "240V", "208V", "600V", "277V", "primary 480", "secondary voltage"
    const voltageMatch = t.match(/\b(600|480|460|277|240|230|208|120)\s*v(?:olts?)?\b/i) ||
      t.match(/(?:primary|service)\s*(?:voltage|level)?[\s:]*(\d{3})/i) ||
      t.match(/(\d{3})\s*(?:volt|v)\s*(?:service|primary|secondary)?/i);
    if (voltageMatch) {
      const v = parseInt(voltageMatch[1], 10);
      if (v === 120 || v === 208) result.voltage = v;
      else if (v === 230 || v === 240) result.voltage = 240;
      else if (v === 277) result.voltage = 277;
      else if (v === 460 || v === 480) result.voltage = 480;
      else if (v === 600) result.voltage = 600;
    }

    // billDate / billReference - statement date, service period
    const dateMatch = t.match(/(?:statement|bill)\s+date[\s:]+(\w+\s+\d{1,2},?\s*\d{4})/i) ||
      t.match(/(\w+\s+\d{1,2},?\s*\d{4})/);
    if (dateMatch) {
      result.billReference = dateMatch[1];
      try {
        const d = new Date(dateMatch[1]);
        if (!isNaN(d.getTime())) {
          result.billDate = d.getTime();
        }
      } catch (e) { /* ignore */ }
    }

    // Line items - try to find charge table rows
    const lineItems = [];
    const kwhChargeMatch = t.match(/(?:energy|kwh)\s+charge[s]?[\s:$]*([\d,]+\.?\d*)/i);
    if (kwhChargeMatch) {
      lineItems.push({
        name: 'KWH Charges',
        type: 'kwh',
        cost: parseFloat(String(kwhChargeMatch[1]).replace(/,/g, '')) || 0,
        billingRate: 0,
        tierHours: '24',
        meterReading: result.totalKwh || '',
        savings: 0
      });
    }
    const kwChargeMatch = t.match(/(?:demand|kw)\s+charge[s]?[\s:$]*([\d,]+\.?\d*)/i);
    if (kwChargeMatch) {
      lineItems.push({
        name: 'KW Charges',
        type: 'kw',
        cost: parseFloat(String(kwChargeMatch[1]).replace(/,/g, '')) || 0,
        billingRate: result.kwRatePerTariff ? parseFloat(result.kwRatePerTariff) : 0,
        tierHours: '24',
        meterReading: result.kwPeak || '',
        savings: 0
      });
    }
    if (lineItems.length) {
      result.lineItems = lineItems;
    }

    const hasMinimumData = result.totalKwh || result.kwPeak || result.billAmount;
    return {
      success: !!hasMinimumData,
      data: result,
      partial: !!(result.totalKwh || result.kwPeak || result.billAmount) && !(result.totalKwh && result.kwPeak && result.billAmount)
    };
  }
};
