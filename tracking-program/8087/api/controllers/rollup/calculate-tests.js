var Moment = require('moment-timezone');
var async = require('async');

module.exports = function calculateTests(req, res) {

  var sails = req._sails;
  sails.log.error('[' + Moment().format() + '] calculateTests start');
  var datastore = sails.getDatastore('default');
  var now = (new Date()).getTime();

  // Find any non-deleted tests that are past their finish date and don't have a report yet.
  // Exclude static tests (isStatic = 1) as they should not be recalculated
  Test.find({ isDeleted: false, endAt: {'<': now}, reportData: null, isStatic: {'!=': 1} }).exec(function(err, tests) {
    if (err) { return res.serverError(err); }

    async.eachLimit(tests, 1, function(test, nextTest) {
      sails.log.error('[' + Moment().format() + '] calculateTests test ' + test.id);
      Project.findOne({ id: test.project }).exec(function(err, project) {
        if (err) { return exits.error(err); }
        console.log("***1");
        console.log ("project: " + project.id);
        Meter.find({ project: project.id, isDeleted: false}).select(['id']).exec(function(err, meters) {
          if (err) { return exits.error(err); }
          console.log("***2");
          
          if (meters) {
            console.log("***3");
            var meterIds = _.pluck(meters, 'id');
            var meterInputs = meterIds.toString();

            console.log("***4");
            meterIds.forEach(function(meter){
              console.log("***5");
              let meterId = meter.toString();
              sails.helpers.web.test.calculateTestResults({
                testId: test.id,
                meters: meterId,
              }).exec(function(err, results) {
                console.log("***6");
                Meter.update({ id: meter}, {
                  kwPeakSavings: results.percentSaved.kwPeak,
                  kwhSavings: results.percentSaved.kwh
                }).exec(function(err) {
                  if (err) { 
                    console.log("***7"); return exits.error(err);}
                });
              });
            });
          }

          sails.helpers.web.test.calculateTestResults({
            testId: test.id,
            meters: meterInputs,
          }).exec(function(err, testResults) {
            console.log("***8");

      // If the project has no meters, continue to the next one.

            Test.update({ id: test.id }, { reportData: testResults }).exec(function(err) {
              if (err) {
                sails.log.error('[' + Moment().format() + '] upload test result error ' + err);
              }
            });
            if (err) {
              sails.log.error('[' + Moment().format() + '] calculateTests error ' + err);
              // TODO -- alert if error occurs while calculating test report.
            }
            console.log("***9");
            return nextTest();
          });
        });
      });

    }, function() {
      if (err) {
        console.log("***10");
        return res.serverError(err);
      }
      console.log("***11");
      return res.ok();
    });

  });

};
