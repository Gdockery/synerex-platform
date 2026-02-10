module.exports = {
  friendlyName: 'Upload savings report bill',
  description: 'Upload a bill for the savings report for this project.',
  files: ['bill'],
  inputs: {
    project: {
      description: 'The ID of this project.',
      example: 123,
    },

    name: {
      description: 'Name of file to upload',
      example: 'map-of-plant',
      required: true
    },

    description: {
      description: 'Description of file to upload',
      example: 'map-of-plant',
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
    console.log("inputs", inputs.name, inputs.description, inputs.project);
    // TODO: check project ownership


    File.create({
      name: inputs.name,
      description: inputs.description,
      url: inputs.name.split(" ").join('-') + '.pdf',
      project: inputs.project ? inputs.project : null ,  
    }).meta({fetch: true}).exec(function(err, file) {
      if (err) { return exits.error(err); }
      console.log("uploaded file", inputs.name.split(" ").join('-') + '.pdf');

      const StorageService = require('../../../services/StorageService')

    // TODO: check project ownership
    inputs.bill.upload({
      adapter: require('skipper-disk'),
      dirname: StorageService.localPath('bills'),
      saveAs: inputs.name.split(" ").join('-') + '.pdf',
    },function (err, uploadedFiles) {
      if (err) return exits.serverError(err);
    
        return exits.success({
          message: uploadedFiles.length + ' file(s) uploaded successfully!'
        });
      });
    });
  }
};
