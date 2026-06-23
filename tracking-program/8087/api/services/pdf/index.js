// api/services/pdf/index.js
let PdfPrinter = require('pdfmake/src/printer'),
  fonts = {
    Roboto: {
      normal: __dirname + '/resources/fonts/Open_Sans/OpenSans-Regular.ttf',
      bold: __dirname + '/resources/fonts/Open_Sans/OpenSans-Bold.ttf',
      italics: __dirname + '/resources/fonts/Open_Sans/OpenSans-Italic.ttf',
      bolditalics: __dirname + '/resources/fonts/Open_Sans/OpenSans-LightItalic.ttf',
    },
    TimesNewRoman: {
      normal: __dirname + '/resources/fonts/Times_New_Roman/times_new_roman.ttf',
      bold: __dirname + '/resources/fonts/Open_Sans/OpenSans-Bold.ttf',
      italics: __dirname + '/resources/fonts/Open_Sans/OpenSans-Italic.ttf',
      bolditalics: __dirname + '/resources/fonts/Open_Sans/OpenSans-LightItalic.ttf',
    }
  },
  printer = new PdfPrinter(fonts);

let invoiceGenerator = require('./generators/invoice.js')(printer),
  budgetInvoiceGenerator = require('./generators/budget-invoice.js')(printer),
  budgetReportGenerator = require('./generators/budget-report.js')(printer),
  billAnalyticGenerator = require('./generators/bill-analytic.js')(printer),
  co2Generator = require('./generators/co2.js')(printer),
  monthlySavingsGenerator = require('./generators/monthly-energy-savings')(printer),
  lsPotentialGenerator = require('./generators/ls-potential')(printer),
  clientProposalGenerator = require('./generators/client-proposal')(printer),
  partsProcurementGenerator = require('./generators/parts-procurement')(printer),
  financeAgreementGenerator = require('./generators/finance-agreement')(printer),
  shippingDocumentsGenerator = require('./generators/shipping-documents')(printer),
  meterCertificateGenerator = require('./generators/meter-certificate')(printer),
  testReportGenerator = require('./generators/test-report')(printer);

// Helper function to resolve PDF resource paths using whitelabel
function getPdfResourcePath(req, assetName) {
  if (req && sails.helpers && sails.helpers.web && sails.helpers.web.whitelabel && sails.helpers.web.whitelabel.getAssetPath) {
    try {
      var result = sails.helpers.web.whitelabel.getAssetPath(req, assetName, 'pdf-resource');
      return result.filePath;
    } catch (err) {
      sails.log.warn('Error resolving whitelabel path for', assetName, ':', err);
    }
  }
  // Fallback to default path
  return __dirname + '/resources/' + assetName;
}

// Helper function to get brand name from request
function getBrandName(req) {
  if (req && sails.config && sails.config.whitelabel) {
    var hostname = req.hostname || req.get('host') || '';
    return sails.config.whitelabel.getBrandName(hostname);
  }
  return 'Synerex'; // Default
}

module.exports = {
  invoice: function (invoiceData, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    var brandName = getBrandName(req);
    const stream = invoiceGenerator.generate(invoiceData, logoPath, brandName);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  budgetInvoice: function (invoiceData, req) {
    let clientLogo = '/vagrant/assets/images/client_company_logo/' + invoiceData.clientLogoName;
    const stream = budgetInvoiceGenerator.generate(invoiceData, clientLogo);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  budgetReport: function (invoiceData, req) {
    const stream = budgetReportGenerator.generate(invoiceData);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  financeAgreement: function (data, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    const stream = financeAgreementGenerator.generate(data, logoPath);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  shippingDocuments: function (data, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    const stream = shippingDocumentsGenerator.generate(data, logoPath);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  billAnalytic: function (billAnalyticData, req) {
    var billAnalyticCoverPath = getPdfResourcePath(req, 'bill-cover.png');
    var billAnalyticLogoPath = getPdfResourcePath(req, 'bill-logo.png');
    var billAnalyticExclusiveImagePath = getPdfResourcePath(req, 'exclusive.png');
    const stream = billAnalyticGenerator.generate(billAnalyticData, billAnalyticCoverPath, billAnalyticLogoPath, billAnalyticExclusiveImagePath);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  testReport: function (data, req) {
    var billAnalyticLogoPath = getPdfResourcePath(req, 'bill-logo.png');
    var brandName = getBrandName(req);
    const stream = testReportGenerator.generate(data, billAnalyticLogoPath, brandName);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  meterCertificate: function (data, req) {
    var meterCertificateLogo = getPdfResourcePath(req, 'meter-certificate-logo.png');
    const stream = meterCertificateGenerator.generate(data, meterCertificateLogo);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  partsProcurement: function (partsData, req) {
    var partsProcurementGraphPath = getPdfResourcePath(req, 'parts-procurement-graph.png');
    var brandName = getBrandName(req);
    const stream = partsProcurementGenerator.generate(partsData, partsProcurementGraphPath, brandName);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  co2Savings: function (co2Data, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    var headPath = getPdfResourcePath(req, 'head.png');
    var graphPath = getPdfResourcePath(req, 'graph.png');
    var energyPath = getPdfResourcePath(req, 'energy.png');
    var graphicPath = getPdfResourcePath(req, 'graphic.png');
    const stream = co2Generator.generate(co2Data, logoPath, headPath, graphPath, energyPath, graphicPath);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  monthlySavings: function (monthlySavingsData, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    const stream = monthlySavingsGenerator.generate(monthlySavingsData, logoPath);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  lsPotential: function (monthlySavingsData, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    const stream = lsPotentialGenerator.generate(monthlySavingsData, logoPath);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  proposal: function (clientProposalData, req) {
    var proposalCoverPath = getPdfResourcePath(req, 'proposal-cover.png');
    var brandName = getBrandName(req);
    var billAnalyticLogoPath = getPdfResourcePath(req, 'bill-logo.png');
    var indexLogoPath = getPdfResourcePath(req, 'index-logo.png');
    var calculatedEnergySavingsPath = getPdfResourcePath(req, 'calculated-energy-savings.png');
    var efficiencyGainsPath = getPdfResourcePath(req, 'efficiency-gains.png');
    var advancingRedCurve = getPdfResourcePath(req, 'advancing-red-curve.png');
    var electricServiceBillPath = getPdfResourcePath(req, 'electric-service-bill.png');
    var calculationPath = getPdfResourcePath(req, 'calculation.png');
    var projectManagersEngineersPath = getPdfResourcePath(req, 'project-managers-engineers.png');
    var etlLogoPath = getPdfResourcePath(req, 'etl-logo.png');
    var xecoClientsPath = getPdfResourcePath(req, 'synerex-clients.png');
    var installationMapPath = getPdfResourcePath(req, 'installation-map.png');
    var insuranceCoveragePath = getPdfResourcePath(req, 'insurance-coverage.png');
    var signaturePath = getPdfResourcePath(req, 'signature.png');
    var powerQualityComparison = getPdfResourcePath(req, 'power-quality-comparison.png');
    var powerQualityWithXeco = getPdfResourcePath(req, 'power-quality-with-synerex.png');
    var powerQualityWithoutXeco = getPdfResourcePath(req, 'power-quality-without-synerex.png');
    var xecoRealtimePortal = getPdfResourcePath(req, 'synerex-realtime-portal.png');
    var powerQualityImprovement = getPdfResourcePath(req, 'power-quality-improvement.png');
    var powerQualityCost = getPdfResourcePath(req, 'power-quality-cost.png');
    const stream = clientProposalGenerator.generate(clientProposalData, proposalCoverPath, billAnalyticLogoPath,
      indexLogoPath, calculatedEnergySavingsPath, efficiencyGainsPath, advancingRedCurve, electricServiceBillPath,
      calculationPath, projectManagersEngineersPath, etlLogoPath, xecoClientsPath, installationMapPath, insuranceCoveragePath, signaturePath, powerQualityComparison, powerQualityWithXeco,
      powerQualityWithoutXeco, xecoRealtimePortal, powerQualityImprovement, powerQualityCost, brandName);
    stream.end(); // ADD THIS LINE
    return stream;
  },
  costSavings: function (data, req) {
    var logoPath = getPdfResourcePath(req, 'logo.png');
    var stream = monthlySavingsGenerator.generate(data, logoPath);
    stream.end(); // THIS ONE WAS ALREADY THERE, NO CHANGE NEEDED
    return stream;
  }
};
