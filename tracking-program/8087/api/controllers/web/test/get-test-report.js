module.exports = {


  friendlyName: 'Get test report',


  description: 'Get data for a single test report.',


  inputs: {

    id: {
      description: 'The ID of the test to get report data for.',
      example: 123,
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
        meta: {},
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

    // Retrieve the test in question.
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
          return exits.success({
            meta: {},
            response: test.reportData
          });
        } else {
          // Static test but no reportData - return error
          return exits.error(new Error('Static test has no report data'));
        }
      }

      // If there's a cached test report, return it.
      if (test.reportData) {
        return exits.success({
          meta: {},
          response: test.reportData
        });
      }

      Project.findOne({ id: test.project }).exec(function(err, project) {
        if (err) { return exits.error(err); }
        Meter.find({ project: project.id, isDeleted: false, lastCommunicatedAt: {'>': 0}}).select(['id']).exec(function(err, meters) {
          if (err) { return exits.error(err); }
          
          var meterIds = _.pluck(meters, 'id');  
          var meterInputs = meterIds.toString();

           meterIds.forEach(function(meter){
            let meterId = meter.toString();
            sails.helpers.web.test.calculateTestResults({
              testId: test.id,
              meters: meterId,
            }).exec(function(err, testResults) {
              Meter.update({ id: meter}, {
                kwPeakSavings: testResults.percentSaved.kwPeak,
                kwhSavings: testResults.percentSaved.kwh
              }).exec(function(err) {
                if (err) { return exits.error(err);}
              });
            });
          });

          sails.helpers.web.test.calculateTestResults({
            testId: inputs.id,
            meters: meterInputs,
          }).exec(function(err, results) {
            if (err) { return exits.error(err);}
            Test.update({ id: test.id }, { reportData: results }).exec(function(err) {
              if (err) { return exits.error(err);}
              Project.update({ id: test.project }, {
                kwPeakSavings: results.percentSaved.kwPeak,
                pfSavings: results.percentSaved.powerFactor,
                kvarSavings: results.percentSaved.kvar,
                kvaSavings: results.percentSaved.kva,
                kwhSavings: results.percentSaved.kwh
              }).exec(function(err) {
                if (err) { return exits.error(err);}
              });
            });
          });
        });
      });
    });
  }


};
