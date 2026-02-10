module.exports = {


  friendlyName: 'Get test report',


  description: 'Get data for a single test report.',


  inputs: {

    id: {
      description: 'The ID of the test to get report data for.',
      example: 123,
      required: true
    },

    meters: {
      description: 'A string of user selected meters',
      example: "1, 2, 3",
      required: true
    },

    minutesToAverage: {
      description: 'Number of minutes before and after the change from off to on to average',
      example: 5,
      type: 'number',
      defaultsTo: 5
    },

    minutesToIgnore: {
      description: 'Minutes to ignore at the transition from off to on (ignores last N minutes of off and first N minutes of on)',
      example: 1,
      type: 'number',
      defaultsTo: 1
    }

  },


  exits: {

    success: {
      outputExample: {
        
        response: sails.config.constants.TEST_REPORT_OUTPUT_EXAMPLE
      }
    },
    unauthorized: {
      statusCode: 404
    },
    notFound: {
      statusCode: 404
    },
    testNotComplete: {
      statusCode: 400
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;
    Test.findOne({id: inputs.id, isDeleted: false}).exec(function(err, test) {
      if (err) { return exits.error(err);}
      if (!test) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: test.project} )) {
        return exits.unauthorized();
      }

      // If this is a static test, return the existing reportData without recalculating
      if (test.isStatic === 1) {
        if (test.reportData) {
          // For selected meters, we still need to filter the reportData
          // But since it's static, we should return what's stored
          // Note: This may need adjustment if selected meters filtering is required for static tests
          return exits.success({response: test.reportData});
        } else {
          return exits.error(new Error('Static test has no report data'));
        }
      }

        sails.helpers.web.test.calculateTestResults({
          testId: test.id,
          meters: inputs.meters,
          minutesToAverage: inputs.minutesToAverage || 5,
          minutesToIgnore: inputs.minutesToIgnore || 1
        }).exec(function(err, results) {
        if (err) { return exits.error(err); }
        return exits.success({response: results});
      });

   
  });

  }


};
