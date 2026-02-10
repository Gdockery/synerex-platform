module.exports = {
  friendlyName: 'Upload savings report bill',
  description: 'Upload a bill for the savings report for this project.',
  files: ['bill'],
  inputs: {
    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    month: {
      description: 'The month (YYYY-MM) that this report represents.',
      example: '2017-05',
      required: true
    },

    bill: {
      example: '===',
      required: true
    }
  },


  exits: {
    serverError: { statusCode: 500 }
  },


  fn: function (inputs, exits) {

    const StorageService = require('../../../services/StorageService')

    // TODO: check project ownership
    inputs.bill.upload({
      adapter: require('skipper-disk'),
      dirname: StorageService.localPath('bills'),
      saveAs: ['bill', inputs.project, inputs.month].join('-') + '.pdf'
    },function (err, uploadedFiles) {
      if (err) return exits.serverError(err);
    
      return exits.success({
        message: uploadedFiles.length + ' file(s) uploaded successfully!'
      });
    });
  }
};
