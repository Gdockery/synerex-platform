module.exports = {


  friendlyName: 'Remove savings report bill',


  description: 'Remove a bill for the savings report for this project.',


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
    }

  },


  exits: {
    notFound: { statusCode: 404 }
  },


  fn: function (inputs, exits) {

    // TODO: check project ownership

    const StorageService = require('../../../services/StorageService')

    StorageService.remove('bills/' + ['bill', inputs.project, inputs.month].join('-') + '.pdf')

    return exits.success()
  }


};
