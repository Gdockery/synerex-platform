module.exports = {


  friendlyName: 'List meter CSV reports',


  description: 'List all the saved meter CSV reports for a project.',


  extendedDescription: 'Note that this list does not include URLs for the reports.  The URLs are created dynamically and expire within a short period of time, so they are meant to be generated on-the-fly when a "download" link is pressed.',


  inputs: {

    project: {
      description: 'The ID of the project to list meter CSV reports for.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {

      outputExample: {
        meta: {},
        response: [{
          id: 123,
          reportType: 1,
          title: 'Some report title',
          fromDate: 12345,
          toDate: 55555,
          meterCount: 3
        }]
      }

    },

    unauthorized: {
      statusCode: 404
    }


  },


  fn: function (inputs, exits) { 
    var req = this.req;

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    MeterCSV.find({project: inputs.project})
    .sort([{createdAt: 'DESC'}])
    .populate('meters')
    .exec(function(err, reports) {

      if (err) { return exits.error(err); }

      // Roll the "alerts" array up into an alert count.
      var data = _.map(reports, function(report) {
        report.meterCount = report.meters.length;
        delete report.meters;
        return report;
      });

      return exits.success({meta: {}, response: data});


    });

  }


};
