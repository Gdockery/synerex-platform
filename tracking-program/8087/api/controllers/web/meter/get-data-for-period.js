module.exports = {


  friendlyName: 'Get data for period',


  description: 'Given a date range, return the aggregated up meter data for the given project in that range.',


  inputs: {

    project: {
      description: 'The ID of the project to list meters for.',
      example: 123,
      required: true
    },

    fromDate: {
      description: 'Start date for the report.',
      example: 12345,
      required: true
    },

    toDate: {
      description: 'End date for the report.',
      example: 12345
    }

  },


  exits: {
    success: {
      outputExample: {
        meta: {
        },
        response: {
          kvaPeak: 123,
          kwPeak: 123,
          kwh: 123,
          avgKva: 123,
          carbonEmission: 123,
          avgKvar: 123,
          afterPf: 123,
          xecoOffKvar: 1023,
          xecoOnKvar: 123,
          kvarSavingsPercent: 0.25,
          pfSavingsPercent: 0.35,
          xecoOffPf: 123,
          xecoOnPf: 123
        }
      }
    },

    notFound: {
      statusCode: 404
    },

    unauthorized: {
      statusCode: 404
    },

    badDateParameters: {
      description: 'The `fromDate` or `toDate` value was invalid.',
      statusCode: 400
    },


  },


  fn: function (inputs, exits, env) {

    var req = env.req;

    var project = _.find(req.user.projects, {id: inputs.project} );

    // Make sure that the logged-in user has access to this project.
    if ( !project ) {
      return exits.unauthorized();
    }

    // If there's no "toDate", set it to the same as the start date.
    var toDate = inputs.toDate || inputs.fromDate;

    sails.helpers.web.meter.getAggregateDataForPeriod({
      project: inputs.project,
      fromDate: inputs.fromDate,
      toDate: toDate
    }).exec({
      notFound: exits.notFound,
      badDateParameters: exits.badDateParameters,
      error: exits.error,
      success: function(data) {
        return exits.success({
          meta: {},
          response: data
        });
      }
    });

  }


};
