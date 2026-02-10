const fs = require('fs');

module.exports = {
  friendlyName: 'Generate invoice or proposal',

  description: 'Generate and upload an invoice or proposal for this project.',

  inputs: {

    project: {
      description: 'The project model.',
      example: {},
      required: true
    },

    documentKind: {
      description: 'The kind of document to generate.',
      example: 'proposal',
      required: true,
      isIn: ['proposal','depositInvoice','finalInvoice','installationInvoice']
    }

  },


  exits: {

    success: {
      outputFriendlyName: 'Document Source URL',
      outputExample: 'https://placekitten.com/350/350'
    }

  },


  fn: function (inputs, exits) {
    const StorageService = require('../../../services/StorageService')

    sails.helpers.pdf.invoiceDataMapper({project: inputs.project}).exec((err, data) => {
      if (err) { return exits.error(err); }
      // Build PDF and slurp it up into a readable stream
      let stream = sails.services.pdfservice.generateInvoice(data);
      let path = 'pdf/project-' + inputs.project.id + '-' + inputs.documentKind + '.pdf'

      StorageService.writeStream(path, stream, err => {
        if (err) return exits.error(err)

        return exits.success(StorageService.webPath(path));
      })

      stream.end();
    });

  }


};
