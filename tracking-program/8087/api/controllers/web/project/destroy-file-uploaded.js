module.exports = {


  friendlyName: 'Remove savings report bill',


  description: 'Remove a bill for the savings report for this project.',


  inputs: {

    fileId: {
      description: 'table id of the file to delete',
      example: 2,
      required: true
    },

    fileName: {
      description: 'Name of file to delete.',
      example: '2017-05',
      required: true
    }

  },


  exits: {
    notFound: { statusCode: 404 }
  },


  fn: function (inputs, exits) {
    // TODO: check project ownership
    File.destroy({id: inputs.fileId}).exec(function(err) {
      if (err) { return exits.error(err); } 
      const StorageService = require('../../../services/StorageService')

      StorageService.remove('bills/' + inputs.fileName.split(" ").join('-') + '.pdf')
      return exits.success()
    });
  }
};