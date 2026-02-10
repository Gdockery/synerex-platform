module.exports = {


  friendlyName: 'Get meter CSV report details',


  description: 'Get the details of a saved meter CSV report.',


  inputs: {

    id: {
      description: 'The ID of the meter CSV report to get details of.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {

      outputExample: {
        meta: {},
        response: {
          id: 123,
          reportType: 1,
          title: 'Some report title',
          fromDate: 12345,
          toDate: 55555,
          meters: [{
            id: 123,
            name: 'Meter #1'
          }],
          users: [{
            id: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acmeinc.com'
          }]
        }
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


    MeterCSV.findOne({id: inputs.id})
    .populate('meters')
    .populate('users')
    .exec(function(err, report) {

      if (err) { return exits.error(err); }
      if (!report) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: report.project} )) {
        return exits.unauthorized();
      }

      return exits.success({meta: {}, response: report});

    });

  }


};
