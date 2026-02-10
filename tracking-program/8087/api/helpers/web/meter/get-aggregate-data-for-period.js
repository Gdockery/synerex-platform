module.exports = {


  friendlyName: 'Get aggregate meter data for period',


  inputs: {

    project: {
      description: 'The ID of the project to aggregate meter data for.',
      example: 123,
      required: true
    },

    fromDate: {
      description: 'Start date for the aggregation.',
      extendedDescription: 'This is an inclusive range.  Regardless of the time of day that the timestamp represents, the range will extend from the beginning of the given day.',
      example: 12345,
      required: true
    },

    toDate: {
      description: 'End date for the aggregation.',
      extendedDescription: 'This is an inclusive range.  Regardless of the time of day that the timestamp represents, the range will extend to the end of the given day (or to the current time, whichever is earlier).',
      example: 12345,
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
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
    },

    notFound: {
      statusCode: 404
    },

    badDateParameters: {
      description: 'The `fromDate` or `toDate` value was invalid.',
      statusCode: 400
    }

  },


  fn: function(inputs, exits) {

    var Moment = require('moment-timezone');

    var now = (new Date()).getTime();

    // Validate that the "fromDate" is not in the future.
    if (inputs.fromDate > now) {
      return exits.badDateParameters();
    }

    // Validate that toDate > fromDate.
    if (inputs.fromDate > inputs.toDate) {
      return exits.badDateParameters();
    }

    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error(err); }
      if (!project) { return exits.notFound(); }
      Meter.find({ project: project.id, isDeleted: 0}).select(['id']).exec(function(err, meters) {
        if (err) { return exits.error(err); }
        
        var meterIds = _.pluck(meters, 'id');
        var meterInputs = meterIds.toString();

        sails.helpers.web.test.calculateTestResults({
          testId: project.selectedTest,
          meters: meterInputs 
        }).exec(function(err, testResults) {
        if (err) { return exits.error(err);}
       
        var startTime = (new Moment(inputs.fromDate)).tz(project.timeZoneId).startOf('day');
        var endTime = (new Moment(inputs.toDate)).tz(project.timeZoneId).endOf('day');
        var startDay = startTime.format('YYYY-MM-DD');
        var endDay = endTime.format('YYYY-MM-DD');
        var currentDay = (new Moment(now)).tz(project.timeZoneId).format('YYYY-MM-DD');

        async.auto({

           // Get all aggregated daily data in the date range.
          /*dailyData: function(cb) {
            MeterDataAggregate.find({ and: [{project: inputs.project}, {intervalId: ''}, {day: {'>=': startDay}}, {day: {'<=': endDay}}] }).exec(cb);
          },*/
          dailyData: function(cb) {
            MeterDataAggregate.find({ and: [{project: inputs.project}, {day: {'>=': startDay}}, {day: {'<=': endDay}}, {intervalId: {'!=': ''}}] }).sort('intervalStartTime ASC').exec(cb);
          },

          /*intervalData: function(cb) {
            if (endDay !== currentDay) { return cb(undefined, []); }
            MeterDataAggregate.find({ project: inputs.project, day: currentDay }).exec(cb);
          }*/

        }, function(err, results) {
          if (err) { return exits.error(err); }
          

          // Create a functon that, given an attribute name, will average together the daily data and "loose" interval data
          // for that attribute, weighting the daily data accordingly since it represents a whole day's worth of intervals.
          function avg(attr) {
            // Get the average value of the daily rollups.
            var avgDailyValue = (_.sum(_.pluck(results.dailyData, attr)) / results.dailyData.length);
            // Represent that value `numAggregatedDailyIntervals` times in the average.
            /*return ( (avgDailyValue * numAggregatedDailyIntervals) + _.sum(_.pluck(results.intervalData, attr))) / (numAggregatedDailyIntervals + numLooseIntervals);*/
            return avgDailyValue;
          }

           var duration = ((endDay !== currentDay) ? endTime.valueOf() : now) - inputs.fromDate;

          function getKwh() {
            // Get the average value of the daily rollups.
            
            var totalKwh = 0;
            var thisKwh = 0;
            for (let i = 0, h = 0; h < results.dailyData.length; i++, h++) {
              if (i < 4) {
                thisKwh += results.dailyData[h].avgKva;
          
              } else {
                totalKwh += thisKwh / 4;
                thisKwh = results.dailyData[h].avgKva;
                i = 0;
              }
              
            }
            return totalKwh;
          }

          // Get the avg KVA for the time period.
          // if project uses PF, use avgKva, if not use kw
          // ROB_TODO: assign project to be PF or kw .
          var avgKva = avg('avgKva');

          // Get the # of hours in the time period.
         

          // Multiply to get the total KWH.

          var kwh = getKwh() * project.multiplier;
          var kvaPeak = _.max(_.pluck(results.dailyData, 'avgKva')) * project.peakMultiplier;
       

          // Return the output.
          // reverse Rob's changes to see if savings report calculations work
          //kvaPeak: (_.max(_.pluck(results.dailyData, 'peakKva').concat(_.pluck(results.intervalData, 'peakKva')))*.895),
          var output = {          
            // _.max(_.pluck(results.dailyData, 'peakKva').concat(_.pluck(results.intervalData, 'avgKva'))), peakkva is always 0,
            kvaPeak: kvaPeak,
            kwPeak: _.max(_.pluck(results.dailyData, 'avgKw')),
            kwh: kwh,
            kwhoriginal: getKwh(),
            multiplier: project.multiplier,
            avgKva: avgKva, 
            carbonEmission: sails.config.constants.CARBON_EMISSIONS_RATIO * kwh,
            avgKvar: avg('avgKvar'),
            afterPf: _.round(avg('avgPf'), 2),
            xecoOffKvar: testResults.totals.xecoOff.kvar,
            xecoOnKvar: testResults.totals.xecoOn.kvar,
            kvarSavingsPercent: parseFloat(testResults.percentSaved.kvar),
            pfSavingsPercent: parseFloat(testResults.percentSaved.powerFactor),
            xecoOffPf: testResults.totals.xecoOff.powerFactor,
            xecoOnPf: testResults.totals.xecoOn.powerFactor
          };

          return exits.success(output);
          });
        });
     
    });
  });

}


};
