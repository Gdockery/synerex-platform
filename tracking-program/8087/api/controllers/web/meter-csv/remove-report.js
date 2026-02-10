module.exports = {


  friendlyName: 'Remove meter CSV report',


  description: 'Remove a single meter CSV report.',


  extendedDescription: 'This will remove both the database record and the actual persisted file.',


  inputs: {

    id: {
      description: 'The ID of the meter CSV report to remove.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {

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
  
    MeterCSV.findOne({id: inputs.id}).exec(function(err, report) {

      if (err) { return exits.error(err); }
      if (!report) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: report.project} )) {
        return exits.unauthorized();
      }

      // Get a reference to the datastore.
      var datastore = sails.getDatastore('default');

      // Begin a transaction.
      datastore.transaction(function(db, proceed) {

        MeterCSV.destroy({id: inputs.id}).usingConnection(db).exec(function(err) {
          if (err) { return proceed(err); }

          let csvPath = 'csv/' + report.title + '\.csv'
          
          return proceed(StorageService.remove(csvPath));
        });

      }, function(err) {
        if (err) { return exits.error(err); }

        return exits.success();

      });


    });

  }


};
