module.exports = {


  friendlyName: 'Get meter CSV report download URL',


  description: 'Get the URL to download a saved meter CSV report.',


  extendedDescription: 'This URL is intended to be used by the front-end app immediately; it will expire after 60 seconds',


  inputs: {

    id: {
      description: 'The ID of the meter CSV report to get a download link for.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {

      outputExample: {
        meta: {},
        response: 'http://someurl.com'
      }

    },

    unauthorized: {
      statusCode: 404
    },

    notFound: {
      statusCode: 404
    }


  },


  fn: function (inputs, exits) {
    var req = this.req;

    const StorageService = require('../../../services/StorageService')

    MeterCSV.findOne({id: inputs.id}).populate('project').exec(function(err, report) {

      if (err) { return exits.error(err); }
      if (!report) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: report.project.id} )) {
        return exits.unauthorized();
      }

      let csvPath = 'csv/' + report.title + '\.csv'

      if(!StorageService.existsSync(csvPath)) {
        return exits.error('CSV file not found')
      }

      return exits.success({meta: {}, response: StorageService.webPath(csvPath)})

    });

  }


};
