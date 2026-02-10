// api/helpers/pdf/generate-pdf.js
module.exports = {
  friendlyName: 'Generate PDF',
  description: 'Generate a PDF document based on type and data.',

  inputs: {
    project: { type: 'number', required: true },
    documentKind: { type: 'string', required: true, description: 'The type of document to generate (proposal, testReport, etc.)' },
    metersToReport: { type: 'ref' },
    meter: { type: 'number' },
    test: { type: 'number' },
    token: { type: 'string', required: true }
  },

  exits: {
    success: { description: 'PDF stream generated successfully' },
    error: { description: 'An error occurred during PDF generation' }
  },

  fn: function (inputs, exits) {
    var log = sails.log;
    log.info('Helper started: generatePdf', 'Kind:', inputs.documentKind, 'Inputs:', JSON.stringify(inputs));

    var generator;

    // Function to execute the data mapper and generate the PDF
    const executeMapperAndGenerate = (mapper, mapperInputs, serviceMethod) => {
      mapper(mapperInputs).exec((err, mappedData) => {
        if (err) {
          log.error(`Error in ${mapperInputs.documentKind}DataMapper:`, err);
          return exits.error(err);
        }
        log.debug(`Data mapped for ${mapperInputs.documentKind}`);
        try {
          // The pdfservice function (e.g., pdfservice.billAnalytic) will now return an *already ended* stream.
          // So, you just need to return it directly. Do NOT call .end() here.
          // Pass req object for whitelabel asset resolution
          var req = this.req || null;
          generator = sails.services.pdfservice[serviceMethod](mappedData, req);
          log.info('Generator completed:', inputs.documentKind);
          return exits.success(generator); // generator is the stream
        } catch (err) {
          log.error('Generator error:', err);
          return exits.error(err);
        }
      });
    };

    switch (inputs.documentKind) {
      case 'proposal':
        log.debug('Mapping data with proposalDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.proposalDataMapper,
          { project: inputs.project },
          'proposal'
        );
        break;

      case 'testReport':
        log.debug('Mapping data with testReportDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.testReportDataMapper,
          { project: inputs.project, test: inputs.test, meters: inputs.metersToReport },
          'testReport'
        );
        break;

      case 'depositInvoice':
      case 'finalInvoice':
      case 'installationInvoice':
      case 'totalInvoice':
        log.debug(`Mapping data with invoiceDataMapper for ${inputs.documentKind}`);
        executeMapperAndGenerate(
          sails.helpers.pdf.invoiceDataMapper,
          { project: inputs.project, type: inputs.documentKind },
          'invoice'
        );
        break;

      case 'partsProcurement':
        log.debug('Mapping data with partsProcurementDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.partsProcurementDataMapper,
          { project: inputs.project },
          'partsProcurement'
        );
        break;

      case 'meterCertificate':
        log.debug('Mapping data with meterCertificateDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.meterCertificateDataMapper,
          { project: inputs.project, meter: inputs.meter },
          'meterCertificate'
        );
        break;

      case 'billAnalytic':
        log.debug('Mapping data with billAnalyticDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.billAnalyticDataMapper,
          inputs.metersToReport ? { project: inputs.project, metersToReport: inputs.metersToReport } : { project: inputs.project },
          'billAnalytic'
        );
        break;

      case 'selectedBillAnalytic':
        log.debug('Mapping data with billAnalyticDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.billAnalyticDataMapper,
          { project: inputs.project, metersToReport: inputs.metersToReport },
          'billAnalytic'
        );
        break;

      case 'selectedProposal':
        log.debug('Mapping data with proposalDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.proposalDataMapper,
          { project: inputs.project },
          'proposal'
        );
        break;

      case 'selectedShippingDocuments':
      case 'shippingDocuments':
        log.debug('Mapping data with shippingDocumentsDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.shippingDocumentsDataMapper,
          { project: inputs.project },
          'shippingDocuments'
        );
        break;

      case 'costSavings':
        log.debug('Mapping data with costSavingsDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.costSavingsDataMapper,
          { project: inputs.project },
          'costSavings'
        );
        break;

      case 'lsPotential':
        log.debug('Mapping data with lsPotentialDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.lsPotentialDataMapper,
          { project: inputs.project },
          'lsPotential'
        );
        break;

      case 'co2Savings':
        log.debug('Mapping data with co2SavingsDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.co2SavingsDataMapper,
          { project: inputs.project },
          'co2Savings'
        );
        break;

      case 'budgetInvoice':
        log.debug('Mapping data with budgetInvoiceDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.budgetInvoiceDataMapper,
          { project: inputs.project },
          'budgetInvoice'
        );
        break;

      case 'budgetReport':
        log.debug('Mapping data with budgetReportDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.budgetReportDataMapper,
          { project: inputs.project },
          'budgetReport'
        );
        break;

      case 'financeAgreement':
        log.debug('Mapping data with financeAgreementDataMapper');
        executeMapperAndGenerate(
          sails.helpers.pdf.financeAgreementDataMapper,
          { project: inputs.project },
          'financeAgreement'
        );
        break;

      default:
        log.warn('Invalid document type:', inputs.documentKind);
        return exits.error(new Error(`Invalid document type: ${inputs.documentKind}`));
    }
  }
};
