module.exports = {
  friendlyName: 'Download pdf',
  description: 'Download a pdf for this project.',
  extendedDescription: 'Note that the input actually used to send the document token itself communicates what _kind_ of document this is.',

  inputs: {
    proposal: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    depositInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    testReport: { description: 'The document token.', example: '{"token": "bab31813459a03913afe1839", "test": 7958200, "meters": [236345]}' },
    finalInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    installationInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    totalInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    billAnalytic: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    costSavings: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    lsPotential: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    co2Savings: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    partsProcurement: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    budgetInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    budgetReport: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    financeAgreement: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    shippingDocuments: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    meterCertificate: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    selectedBillAnalytic: { description: 'The document token', example: '{token: "bab31813459a03913afe1839", bills: ["meter1", "meter2"]}' },
    selectedShippingDocuments: { description: 'The document token', example: '{token: "bab31813459a03913afe1839", bills: ["meter1", "meter2"]}' },
    selectedProposal: { description: 'The document token', example: '{token: "bab31813459a03913afe1839", bills: ["meter1", "meter2"]}' },
    meter: { description: 'meter Id for meter serial number', example: 1 }
  },

  exits: {
    success: {
      outputFriendlyName: 'Readable stream',
      outputDescription: 'The requested PDF file.',
      outputExample: '==='
    },
    badRequest: { statusCode: 400 },
    notFound: { statusCode: 404 },
  },

  fn: function (inputs, exits) {
    var flaverr = require('flaverr');
    var log = sails.log;
    var res = this.res;

    log.info('Starting PDF download:', inputs);

    var DOCUMENT_KINDS = ['proposal', 'depositInvoice', 'finalInvoice', 'installationInvoice',
      'totalInvoice', 'billAnalytic', 'costSavings', 'lsPotential', 'co2Savings', 'partsProcurement', 'testReport',
      'budgetInvoice', 'budgetReport', 'financeAgreement', 'shippingDocuments', 'selectedBillAnalytic',
      'selectedProposal', 'selectedShippingDocuments', 'meterCertificate'];

    var documentShareToken;
    var documentKind;
    var badUsageError;
    let metersToReport;
    let meter;
    let test;

    _.each(DOCUMENT_KINDS, function(tokenParamName) {
      if (badUsageError) { return; }
      else if (documentShareToken && inputs[tokenParamName]) {
        badUsageError = new Error('Cannot specify both `' + documentKind + '` AND `' + tokenParamName + '`!');
      }
      else if (inputs[tokenParamName]) {
        documentKind = tokenParamName;
        if (['selectedBillAnalytic', 'selectedProposal', 'selectedShippingDocuments'].includes(documentKind)) {
          let selectedBillAnalytic = JSON.parse(inputs[tokenParamName]);
          documentShareToken = selectedBillAnalytic.token;
          metersToReport = selectedBillAnalytic.bills;
        } else if (['meterCertificate'].includes(documentKind)) {
          let meterCertificate = JSON.parse(inputs[tokenParamName]);
          documentShareToken = meterCertificate.token;
          meter = parseInt(meterCertificate.meter);
        } else if (['testReport'].includes(documentKind)) {
          let testReport = JSON.parse(inputs[tokenParamName]);
          documentShareToken = testReport.token;
          test = parseInt(testReport.test);
          metersToReport = testReport.meters;
        } else {
          documentShareToken = inputs[tokenParamName];
        }
      }
    });

    if (!documentShareToken) {
      badUsageError = new Error('Invalid link. (A document token must be specified.)');
    }
    if (badUsageError) {
      log.warn('Bad request:', badUsageError.message);
      return exits.badRequest(badUsageError);
    }

    log.debug('Document kind:', documentKind, 'Token:', documentShareToken);

    log.debug('Starting transaction');
    Project.getDatastore()
      .transaction(function $transactionally(db, proceed) {
        log.debug('Looking up project with token:', documentShareToken);
        Project.findOne({
          documentShareToken: documentShareToken
        })
        .exec(function(err, project) {
          if (err) {
            log.error('Database error:', err);
            return proceed(err);
          }
          if (!project) {
            log.warn('Project not found for token:', documentShareToken);
            return proceed(flaverr('E_PROJECT_NOT_FOUND', new Error('Project not found')));
          }
          log.debug('Project found:', project.id);

          log.debug('Generating PDF with helper');
          log.debug('Calling generatePdf with inputs:', {
            project: project.id,
            documentKind: documentKind,
            metersToReport: metersToReport,
            meter: meter,
            test: test,
            token: documentShareToken
          });

          sails.helpers.pdf.generatePdf({
            project: project.id,
            documentKind: documentKind,
            metersToReport: metersToReport,
            meter: meter,
            test: test,
            token: documentShareToken
          }).exec(function(err, stream) {
            if (err) {
              log.error('Error generating PDF:', err);
              return proceed(err);
            }
            log.debug('PDF stream generated at:', new Date().toISOString());
            res.set('Content-Type', 'application/pdf');
            res.set('Content-Disposition', 'attachment; filename="test-report.pdf"');
            stream.pipe(res);
            stream.on('end', function() {
              log.debug('PDF stream ended at:', new Date().toISOString());
              proceed(); // Complete transaction
              exits.success(stream); // Send response after stream ends
            });
            stream.on('error', function(streamErr) {
              log.error('Stream error:', streamErr);
              return proceed(streamErr);
            });
          });
        });
      })
      .exec(function (err, stream) {
        if (err) {
          if (err.code === 'E_PROJECT_NOT_FOUND') {
            log.warn('Not found exit');
            return exits.notFound();
          } else {
            log.error('Transaction error:', err);
            return exits.error(err);
          }
        }
        log.debug('Sending PDF stream at:', new Date().toISOString());
        // Note: exits.success moved to stream.on('end')
      });
  }
};
