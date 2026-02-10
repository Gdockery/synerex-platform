module.exports = {


  friendlyName: 'Calculate test results.',


  description: 'Given a test ID, calculate (or re-calculate) the results of the test.',


  inputs: {

    testId: {
      example: 123,
      description: 'The ID of the test to calculate results for.',
      required: true
    },

    meters: {
      example: "1, 2, 3",
      description: 'user seleced meters, only use selected meters to calculate test',
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
    },

    /*dbConnection: {
      example: '===',
      description: 'A database connection to use for queries.',
      required: true
    },*/

    dryRun: {
      description: 'Whether or not to update the project and test records with the new calculated savings values.',
      extendedDescription: 'If `true`, the records will NOT be updated.',
      example: true,
      defaultsTo: false
    }

  },


  exits: {

    notFound: {
      description: 'No test could be found with the given ID.'
    },

    testNotComplete: {
      description: 'The specified test has not completed yet.'
    },

    success: {
      outputExample: sails.config.constants.TEST_REPORT_OUTPUT_EXAMPLE
    }

  },


  fn: function(inputs, exits) {

    var Moment = require('moment-timezone');

    // Create a simple averaging function.
    function avg(vals) {
      return _.sum(vals) / (vals.length);
    }

    function sum(vals) {
      return _.sum(vals);
    }

    //var db = inputs.dbConnection;

    // Retrieve the test in question.

    Test.findOne({id: inputs.testId, isDeleted: false}).populate('project').exec(function(err, test) {
      if (err) { return exits.error(err);}
      if (!test) { return exits.notFound(); }

      // If this is a static test and has reportData, return it without recalculating
      if (test.isStatic === 1 && test.reportData) {
        return exits.success(test.reportData);
      }

      var now = (new Date()).getTime();
      if (now <= test.endAt) {
        return exits.testNotComplete();
      }

      // Debug: Output test start and end times
      var testStartFormatted = Moment(test.startAt).format('YYYY-MM-DD HH:mm:ss');
      var testEndFormatted = Moment(test.endAt).format('YYYY-MM-DD HH:mm:ss');
      console.log('=== TEST TIMING DEBUG ===');
      console.log('Test Start:', testStartFormatted);
      console.log('Test End:', testEndFormatted);
      console.log('Minutes to Average:', inputs.minutesToAverage || 5);
      console.log('Minutes to Ignore:', inputs.minutesToIgnore || 1);
      console.log('========================');

      async.auto({

        getAggregateData: function(cb) {
       
         // Get the rows to hide by finding the first minute of every segment.
          var numSegments = (test.duration / test.interval * 2 / 3);
	  var segIndex = 1;
	  var peakSegIndex = 1;
          var segmentFirstMinutesCriteria = _.map(_.range(0, numSegments), function(segment) {
//            console.log("segment - " , segment);
            var start = 0;
            var end = 0;
	    if (test.interval == 24) { //24 hour test (on/off same)
		start = test.startAt + (2*1000*60) + ((segment+segIndex) * (test.interval) * 60 * 60 * 1000);
		end = start + (test.interval*1000*60*60) - (5*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
		//end = start + (8*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
	        segIndex = segIndex + 1;
	    } else if (test.project.name.indexOf("ione") >= 0 ) {
              if (segment % 2) { // on segment
                console.log("pioneer on segment");
	        if (test.project.name.indexOf("New Hope") >= 0) {
		 	console.log("New Hope");
                	start = test.startAt + (7*1000*60) + ((segment+segIndex) * (test.interval) * 60 * 60 * 1000);
                	end = start + (6*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
		} else { 
                	start = test.startAt + (7*1000*60) + ((segment+segIndex) * (test.interval) * 60 * 60 * 1000);
                	end = start + (8*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
		}
                segIndex = segIndex + 1;
              } else {
                console.log("pioneer off segment");
	        if (test.project.name.indexOf("New Hope") >= 0) {
		 	console.log("New Hope");
                	start = test.startAt + (58*1000*60) + ((segment+segIndex) * (test.interval) * 60 * 60 * 1000);
                	end = start + (2*1000*60) - 1;// + (test.interval * 60 * 60 * 1000);
		} else {
                	start = test.startAt + (59*1000*60) + ((segment+segIndex) * (test.interval) * 60 * 60 * 1000);
                	end = start + (1*1000*60) - 1;// + (test.interval * 60 * 60 * 1000);
		}
              } 
           } else {
	      if (segment % 2) { // on segment
	  	console.log("on segment");
		// Use minutesToAverage: average for the specified minutes starting from transition
		// Use minutesToIgnore: skip the first N minutes after transition
		var minutesToAvg = inputs.minutesToAverage || 5;
		var minutesToIgnore = inputs.minutesToIgnore || 1;
		// Pattern is 2 hours OFF, 1 hour ON
		// For ON segment: transition happens at the start of the ON segment
		// ON segment starts at: cycleStartAt + 2*interval (end of 2-hour OFF period)
		// Calculate which cycle this segment belongs to: segment/2 gives cycle number
		var cycleNum = Math.floor(segment / 2);
		var cycleStartAt = test.startAt + (cycleNum * 3 * test.interval * 60 * 60 * 1000);
		// Transition point is at the start of ON segment (end of 2-hour OFF period)
		var transitionPoint = cycleStartAt + (2 * test.interval * 60 * 60 * 1000);
		// Start after ignoring the first N minutes (if ignore=0, start at transition; if ignore=1, start 1 min after)
		start = transitionPoint + (minutesToIgnore*1000*60);  // Start after ignoring the first N minutes
		// End minutesToAvg minutes after start (inclusive)
		end = start + (minutesToAvg*1000*60) - 1;  // Average for specified minutes
		// Debug output for ON segment
		console.log('ON Segment', segment, '- Cycle', cycleNum + 1, ':');
		console.log('  Transition Point:', Moment(transitionPoint).format('YYYY-MM-DD HH:mm:ss'));
		console.log('  Segment Start:', Moment(start).format('YYYY-MM-DD HH:mm:ss'), '(after ignoring', minutesToIgnore, 'minutes)');
		console.log('  Segment End:', Moment(end).format('YYYY-MM-DD HH:mm:ss'), '(averaging', minutesToAvg, 'minutes)');
	        segIndex = segIndex + 1;
	      } else {
		console.log("off segment");
		// Use minutesToAverage: average for the specified minutes ending at transition
		// Use minutesToIgnore: end earlier to ignore the last N minutes before transition
		var minutesToAvg = inputs.minutesToAverage || 5;
		var minutesToIgnore = inputs.minutesToIgnore || 1;
		// Pattern is 2 hours OFF, 1 hour ON
		// For OFF segment: transition happens at the end of the 2-hour OFF period
		// Calculate which cycle this segment belongs to: segment/2 gives cycle number
		var cycleNum = Math.floor(segment / 2);
		var cycleStartAt = test.startAt + (cycleNum * 3 * test.interval * 60 * 60 * 1000);
		// Transition point is at the end of OFF segment (start of ON segment, which is 2 hours into the cycle)
		var transitionPoint = cycleStartAt + (2 * test.interval * 60 * 60 * 1000);
		// Calculate the end time: transition point minus ignore minutes
		// If ignore=0: end at transitionPoint (will be filtered to exclude transition in later step)
		// If ignore=1: end 1 minute before transition
		var offEndTime = transitionPoint - (minutesToIgnore * 60 * 1000);
		// Calculate start time: minutesToAvg minutes before the end
		start = offEndTime - (minutesToAvg * 60 * 1000);
		// End at offEndTime, but subtract 1ms to ensure we don't include the transition point itself
		// This ensures that when ignore=0, we capture up to but not including the transition
		end = offEndTime - 1;
		// Debug output for OFF segment
		console.log('OFF Segment', segment, '- Cycle', cycleNum + 1, ':');
		console.log('  Transition Point:', Moment(transitionPoint).format('YYYY-MM-DD HH:mm:ss'));
		console.log('  Segment Start:', Moment(start).format('YYYY-MM-DD HH:mm:ss'), '(averaging', minutesToAvg, 'minutes before end)');
		console.log('  Segment End:', Moment(end).format('YYYY-MM-DD HH:mm:ss'), '(ignoring last', minutesToIgnore, 'minutes before transition)');
	      }
	    }
//	    console.log('( >= ' , start , ' AND intervalEndTime <= ' , end ,')');
            return '(recordedAt >= ' + start + ' AND recordedAt <= ' + end +')';
          }).join(' OR ');

  	  console.log(segmentFirstMinutesCriteria);
	  
	  peakSegIndex = 1;
          var segmentPeakOffCriteria = _.map(_.range(0, numSegments), function(segment) {
            var start = 0;
            var end = 0;
	    if (!(segment % 2)) { // off segment
	      if (test.project.name.indexOf("ione") >= 0 ) {
		if (test.project.name.indexOf("alt") >= 0 && !(peakSegIndex == 1 || peakSegIndex == 3)) {
                  start = test.startAt + (1*1000*60) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
                  end = start + (58*1000*60) - 1;// + (test.interval * 60 * 60 * 1000);
		} else if (!(test.project.name.indexOf("alt") >= 0)) {
                  start = test.startAt + (1*1000*60) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
                  end = start + (58*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
		}
	      } else {
		start = test.startAt + (50*60*1000) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
		end = start + (10*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
	      }
	      peakSegIndex = peakSegIndex + 1;
	    }
            return '(recordedAt >= ' + start + ' AND recordedAt <= ' + end +')';
          }).join(' OR ');

	  peakSegIndex = 1;
          var segmentPeakCriteria = _.map(_.range(0, numSegments), function(segment) {
            var start = 0;
            var end = 0;
	    if (segment % 2) { // on segment
	      if (test.project.name.indexOf("ione") >= 0 ) {
		if (test.project.name.indexOf("alt") >= 0 && !(peakSegIndex == 1 || peakSegIndex == 3)) {
                  start = test.startAt + (1*1000*60) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
                  end = start + (58*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
/*		} else if ((test.project.name.indexOf("hipp") >= 0)) {
                  start = test.startAt + (7*1000*60) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
                  end = start + (8*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
*/		} else if (!(test.project.name.indexOf("alt") >= 0)) {
                  start = test.startAt + (7*1000*60) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
                  end = start + (8*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
		}
	      } else {
		  start = test.startAt + (1*60*1000) + ((segment+peakSegIndex) * (test.interval) * 60 * 60 * 1000);
		  end = start + (10*1000*60) - 1;  //(test.interval * 60 * 60 * 1000);
	      }
	      peakSegIndex = peakSegIndex + 1;
	    }
            return '(recordedAt >= ' + start + ' AND recordedAt <= ' + end +')';
          }).join(' OR ');

	  console.log("segPeakCrit",segmentPeakCriteria);

          // Create a SQL statement that gets all MeterData rows in the specified time ranges.
          var meterIds = inputs.meters.split(",");
          var meterIdsIn = '(' + meterIds.join() + ')';
        
          var SQL = 'SELECT day, intervalId, count(id) as numSamples, ' +
                    'MAX(createdAt) as createdAt, ' +
                    'MAX(updatedAt) as updatedAt, ' +
                    'MIN(recordedAt) as intervalStartTime, MAX(recordedAt) as intervalEndTime, ' ;
/*	  if (segment % 2) { //on segment
                    SQL = SQL + 'AVG(totalVolt) as avgVolt, ' +
                    'AVG(totalAmp) as avgAmp, ' +
                    'AVG(totalKva) as avgKva, ' +
                    'AVG(totalKw) as avgKw, ' +
                    'AVG(totalKvar) as avgKvar, ' +
                    'AVG(CASE WHEN totalPf < 0 THEN 100 ELSE totalPf END) as avgPf ' ;
	} else {
  */                  SQL = SQL + 'AVG(totalVolt) as avgVolt, ' +
                    'AVG(totalAmp) as avgAmp, ';

		    //'(select MAX(totalKva) from meterdata where day = "2024-08-16") as maxKVAOff, ' +
	         if (test.project.name.indexOf("ione") >= 0 ) {
                    SQL = SQL + 'AVG(totalKva) as avgKva, ' +
                    'AVG(totalKw) as avgKw, ' +
                    'AVG(totalKvar) as avgKvar, ' +
		    'AVG(totalTHD) as avgTHD, ';
		   if (test.project.name.indexOf("hipp") >=0) {
		     SQL = SQL + '(select avg(totalKva)*' + meterIds.length + ' as summedPeak from meterdata  where meter in ' + meterIdsIn + ' and (recordedAt > ' + test.startAt + ' and recordedAt < ' + test.endAt + ')  group by intervalId, minute order by summedPeak desc limit 1) as maxKVAOff, ';
		   } else {
                     SQL = SQL + '(select avg(totalKva)*' + meterIds.length + ' as summedPeak from meterdata  where meter in ' + meterIdsIn + ' and (' + segmentPeakOffCriteria + ')  group by intervalId, minute order by summedPeak desc limit 1) as maxKVAOff, ';
		   }
		 } else {
                    SQL = SQL + 'AVG(totalKva)*' + meterIds.length + ' as avgKva, ' +
                    'AVG(totalKw)*' + meterIds.length + ' as avgKw, ' +
                    'AVG(totalKvar)*' + meterIds.length + ' as avgKvar, ' +
		    'AVG(totalTHD)*' + meterIds.length + ' as avgTHD, ' +
		    '(select sum(totalKva)/' + meterIds.length + ' as summedPeak from meterdata  where meter in ' + meterIdsIn + ' and (recordedAt > ' + test.startAt + ' and recordedAt < ' + test.endAt + ')  group by intervalId, minute order by summedPeak desc limit 1) as maxKVAOff, ';
		 }

		    SQL = SQL + '(select avg(totalKva)*' + meterIds.length + ' as summedPeak from meterdata  where meter in ' + meterIdsIn + ' and (' + segmentPeakCriteria + ') group by intervalId, minute order by summedPeak desc limit 1) as maxKVAOn, ' +
                    'AVG(CASE WHEN totalPf < 0 THEN 100 ELSE totalPf END) as avgPf ' ;
		    
    //    }
                   SQL = SQL + 'FROM meterdata as md1 WHERE meter in ' + meterIdsIn + 
                   ' AND (' + segmentFirstMinutesCriteria + ') ';
	         if (test.project.name.indexOf("New Hope") >= 0 ) {
                   SQL = SQL + ' GROUP BY day, intervalId';
		 } else {
                   SQL = SQL + ' GROUP BY day, intervalId, minute';
		 }
          console.log(SQL);  
          sails.getDatastore().sendNativeQuery(SQL).exec(function(err, aggregateRecords) {
            if (err) { return exits.error(err); }
            //console.log(aggregateRecords);
            return cb(undefined, aggregateRecords.rows);

          }); // </ MeterDataAggregate.find() >
        },

        calculate: ['getAggregateData', function(results, cb) {
          //per meter aggregateRecord, each record is the 15min aggregate of 1 meter
          var aggregateRecords = results.getAggregateData;

          // Initialize an array that will hold references to every segment,
          // to easily aggregate "Xeco OFF" and "Xeco ON" segment data.
          var segments = [];

          // Now that we've removed the hidden data, let's calculate each cycle.
          // Remember that a cycle consists of two segments (Xeco OFF and Xeco ON).
          var numCycles = (test.duration / test.interval) / 3;
          var cycles = _.map(_.range(0, numCycles), function(cycleNum) {

          // Calculate the start and end times of the cycle.
          var cycleStartAt = test.startAt + ((cycleNum * 3) * (test.interval * 60 * 60 * 1000));
          var cycleEndAt = cycleStartAt + (test.interval * 3 * 60 * 60 * 1000);

          // Initialize the cycle data object.
          var cycle = {
            cycle: cycleNum + 1,
            startedAt: cycleStartAt,
            endedAt: cycleEndAt,
            percentSaved: {}
          };

          // Debug: Output cycle and transition point
          var transitionPoint = cycleStartAt + (2 * test.interval * 60 * 60 * 1000);
          console.log('');
          console.log('=== CYCLE', cycleNum + 1, '===');
          console.log('Cycle Start:', Moment(cycleStartAt).format('YYYY-MM-DD HH:mm:ss'));
          console.log('Cycle End:', Moment(cycleEndAt).format('YYYY-MM-DD HH:mm:ss'));
          console.log('Transition Point:', Moment(transitionPoint).format('YYYY-MM-DD HH:mm:ss'));

          // Calculate data for each cycle segment.
          cycle.segments = _.map(_.range(0, 2), function(segmentNum) {
            // Calculate the actual time range used in the SQL query for this segment
            // This must match the calculation in segmentFirstMinutesCriteria above
            var minutesToAvg = inputs.minutesToAverage || 5;
            var minutesToIgnore = inputs.minutesToIgnore || 1;
            
            var segmentStartTime, segmentEndTime;
            if (segmentNum % 2) { // on segment
              // ON segment: start after transition + ignore, end after minutesToAvg
              segmentStartTime = transitionPoint + (minutesToIgnore * 60 * 1000);
              segmentEndTime = segmentStartTime + (minutesToAvg * 60 * 1000) - 1;
              console.log('  ON Segment (Segment', segmentNum + 1, '):');
              console.log('    Start:', Moment(segmentStartTime).format('YYYY-MM-DD HH:mm:ss'), '(after ignoring', minutesToIgnore, 'minutes)');
              console.log('    End:', Moment(segmentEndTime).format('YYYY-MM-DD HH:mm:ss'), '(averaging', minutesToAvg, 'minutes)');
            } else {
              // OFF segment: end before transition - ignore, start minutesToAvg before that
              var offEndTime = transitionPoint - (minutesToIgnore * 60 * 1000);
              segmentEndTime = offEndTime - 1;
              segmentStartTime = offEndTime - (minutesToAvg * 60 * 1000);
              console.log('  OFF Segment (Segment', segmentNum + 1, '):');
              console.log('    Start:', Moment(segmentStartTime).format('YYYY-MM-DD HH:mm:ss'), '(averaging', minutesToAvg, 'minutes before end)');
              console.log('    End:', Moment(segmentEndTime).format('YYYY-MM-DD HH:mm:ss'), '(ignoring last', minutesToIgnore, 'minutes before transition)');
            }
            
	    console.log('  Filter: intervalStartTime >=', segmentStartTime, 'AND intervalEndTime <=', segmentEndTime);
            // Get the aggregate data for the segment's time period.
            // The SQL query already filtered by recordedAt, but we need to match by intervalStartTime/intervalEndTime
            // to ensure we get the right aggregated records for this specific segment
            var aggregatedIntervals = _.filter(aggregateRecords, function(record) {
              // Include records where the interval overlaps with our segment time range
              // A record is included if its start is before or equal to segment end AND its end is after or equal to segment start
              return record.intervalStartTime <= segmentEndTime && record.intervalEndTime >= segmentStartTime;
            });

      
            // Get the average KVA value for this period.
            // Note that we label this "avgKw" instead of "avgKva", for the customer's benefit. (NOT ANYMORE 8/4/2018)

            var avgKw15MinInterval = _.sum(_.pluck(aggregatedIntervals, 'avgKva')) / aggregatedIntervals.length;
            var thisPeak = 0;
	    if (!!segmentNum) 
		thisPeak = _.max(_.pluck(aggregatedIntervals, 'maxKVAOn'));
	    else
		thisPeak = _.max(_.pluck(aggregatedIntervals, 'maxKVAOff'));
            //var avgKw15MinInterval = _.max(_.pluck(aggregatedIntervals, 'avgKva'));

            // Create the data dictionary for the segment.
            var segment = {
              segment: segmentNum + 1,
              startTime: cycleStartAt + (60*60*1000) + (segmentNum * test.interval * 60 * 60 * 1000),
              // Xeco is off for segment 0, on for segment 1.
              xecoSwitchedOn: !!segmentNum,
              duration: test.interval,
	      include: true,

              // Note that we use avgKva to calculate the peak, but call if KW -- this is for the customer's benefit.
              maxKVAOff: _.max(_.pluck(aggregatedIntervals, 'maxKVAOff')),
              maxKVAOn: _.max(_.pluck(aggregatedIntervals, 'maxKVAOn')),
              //kwPeak: thisPeak,
              kwPeak: _.max(_.pluck(aggregatedIntervals, 'avgKva')),
              powerFactor: _.sum(_.pluck(aggregatedIntervals, 'avgPf')) / aggregatedIntervals.length,
              THD: _.sum(_.pluck(aggregatedIntervals, 'avgTHD')) / aggregatedIntervals.length,
              avgKw15MinInterval: avgKw15MinInterval,
              kvar: _.sum(_.pluck(aggregatedIntervals, 'avgKvar')) / aggregatedIntervals.length,
              kwh: avgKw15MinInterval, 
            };


            // Push this segment into our (temporary) array of segments that we'll use to determine test totals.
            segments.push(segment);

            // Return this segment.
            return segment;

          });

            // Calculate the percent saved for various items in the this cycle by getting the ratio of the
            // "Xeco ON" value to the "Xeco OFF" value.
            _.each(['avgKw15MinInterval'], function(attr) {
		if (cycle.segments[0][attr] > cycle.segments[1][attr]) 
              	  cycle.percentSaved[attr] = ((cycle.segments[0][attr] - cycle.segments[1][attr]) / cycle.segments[0][attr]) || 0;
		else {
//		  cycle.segments[0].includeInTotal = false;
//		  cycle.segments[1].includeInTotal = false;
              	  cycle.percentSaved[attr] = ((cycle.segments[0][attr] - cycle.segments[1][attr]) / cycle.segments[1][attr]) || 0;
		}
	    });
            _.each(['kwPeak', 'kvar', 'kwh', 'THD'], function(attr) {
	        if (cycle.segments[0][attr] > cycle.segments[1][attr]) 
              	   cycle.percentSaved[attr] = ((cycle.segments[0][attr] - cycle.segments[1][attr]) / cycle.segments[0][attr]) || 0;
		else
              	   cycle.percentSaved[attr] = ((cycle.segments[0][attr] - cycle.segments[1][attr]) / cycle.segments[1][attr]) || 0;
           });
	   if (cycle.segments[0]['powerFactor'] > cycle.segments[1]['powerFactor']) 
             cycle.percentSaved['powerFactor'] = ((cycle.segments[1]['powerFactor'] - cycle.segments[0]['powerFactor']) / cycle.segments[0]['powerFactor']) || 0;
	   else
             cycle.percentSaved['powerFactor'] = ((cycle.segments[1]['powerFactor'] - cycle.segments[0]['powerFactor']) / cycle.segments[1]['powerFactor']) || 0;
	   return cycle;

          });

          var kvaDiffMin = 100000;
          var kvaDiffMax = -100000;
          var remSegMax = 0;
          var remSegMin = 0;
//        console.log("l");
          cycles.forEach(function(c) {
            //console.log(c);
            let newVal = c.percentSaved['kwPeak'];
            //let newVal = c.percentSaved['avgKw15MinInterval'];
//          console.log("newVal",newVal);
//          console.log(kvaDiffMin);
            if (newVal < kvaDiffMin) {
              //console.log( remSegMin);
              kvaDiffMin = newVal;
              remSegMin = c.cycle;
              //console.log("newMin",newVal);
            }
            if (newVal > kvaDiffMax) {
              //console.log( remSegMax);
              kvaDiffMax = newVal;
              remSegMax = c.cycle;
              //console.log("newMax",newVal);
            }
          });
          //console.log(cycles[7]);
          console.log("Max" ,remSegMax);
          console.log("Min" ,remSegMin);	  
	  if (cycles.length >= 5 && !(test.project.name.indexOf("New Hope") >=0)) { // more than half day test
            cycles.forEach(function(c) {
             if (c.cycle == remSegMax || c.cycle == remSegMin) {
                c.segments.forEach(function(s) {
                   s.include = false;
                });
             }
            });
	  }

          // Get references to the segments where Xeco is off/on.
          var xecoOffSegments = _.where(segments, {xecoSwitchedOn: false, include:true});
          var xecoOnSegments = _.where(segments, {xecoSwitchedOn: true, include:true});
	  var thisPeak = 0;

	   if (test.project.name.indexOf("ione") >= 0 && !(test.project.name.indexOf("New Hope") >=0)) {
		thisPeak = _.max(_.pluck(xecoOffSegments, 'maxKVAOff'));
	   } else {
		thisPeak = _.max(_.pluck(xecoOffSegments, 'kwPeak'));
	   }
/*	   if (cycles.length > 8) { // more than a full day test
		thisPeak = avg(_.pluck(xecoOffSegments, 'kwPeak'));
	   }
*/          // Create the full report dictionary.
          var report = {
            duration: test.duration,
            startedAt: test.startAt,
            endAt: test.endAt,
            cycles: cycles,
            totals: {
              xecoOff: {
                kwPeak: thisPeak,
                powerFactor: avg(_.pluck(xecoOffSegments, 'powerFactor')) ,
                THD: avg(_.pluck(xecoOffSegments, 'THD')) || 0,
                kvar: avg(_.pluck(xecoOffSegments, 'kvar')),
                kva: avg(_.pluck(xecoOffSegments, 'avgKw15MinInterval')),
                kwh: sum(_.pluck(xecoOffSegments, 'avgKw15MinInterval'))
              },
              
            }
          };

          //deal with leading power factors, if pf reading is less than when equipments are off, then pf is 100
          let onPfTemp = _.pluck(xecoOnSegments, 'powerFactor'); 

          onPfTemp.forEach(function(pf) {
            if (pf < report.totals.xecoOff.powerFactor) {
              pf = 100;
            }
          });
          //here we're going to take out negative savings, to footnote later
	  let offPf = _.pluck(xecoOffSegments, 'powerFactor'); 
	  let offPeak = _.pluck(xecoOffSegments, 'kwPeak'); 
	  let offKvar = _.pluck(xecoOffSegments, 'kvar'); 
	  let offKva = _.pluck(xecoOffSegments, 'avgKw15MinInterval'); 
	  let offKw = _.pluck(xecoOffSegments, 'avgKw15MinInterval'); 
	  let onPf = _.pluck(xecoOnSegments, 'powerFactor'); 
	  let onPeak = _.pluck(xecoOnSegments, 'kwPeak'); 
	  let onKvar = _.pluck(xecoOnSegments, 'kvar'); 
	  let onKva = _.pluck(xecoOnSegments, 'avgKw15MinInterval'); 
	  let onKw = _.pluck(xecoOnSegments, 'avgKw15MinInterval'); 

	  var thisPeak = 0;
	   if (test.project.name.indexOf("ione") >= 0 && !(test.project.name.indexOf("New Hope") >=0)) {
		thisPeak = _.max(_.pluck(xecoOnSegments, 'maxKVAOn'));
	   } else {
		thisPeak = _.max(_.pluck(xecoOnSegments, 'kwPeak'));
	   }
/*	   if (cycles.length > 8) { // more than a full day test
		thisPeak = avg(_.pluck(xecoOnSegments, 'kwPeak'));
	   }
*/          report.totals.xecoOn = {
            kwPeak: thisPeak,
            powerFactor: avg(_.pluck(xecoOnSegments, 'powerFactor')),
            THD: avg(_.pluck(xecoOnSegments, 'THD')) || 0,
            kvar: avg(_.pluck(xecoOnSegments, 'kvar')),
            kva: avg(_.pluck(xecoOnSegments, 'avgKw15MinInterval')),
            kwh: sum(_.pluck(xecoOnSegments, 'avgKw15MinInterval'))
          };

          report.totals.savings = {
            kwPeak: report.totals.xecoOff.kwPeak - report.totals.xecoOn.kwPeak,
            powerFactor: (report.totals.xecoOn.powerFactor - report.totals.xecoOff.powerFactor),
            THD: (report.totals.xecoOff.THD - report.totals.xecoOn.THD) || 0,
            kvar: report.totals.xecoOff.kvar - report.totals.xecoOn.kvar,
            kva: report.totals.xecoOff.kva - report.totals.xecoOn.kva,
            kwh: report.totals.xecoOff.kwh - report.totals.xecoOn.kwh,
          };
	  console.log(report.totals.xecoOff);
	  console.log(report.totals.xecoOn);
	  console.log(report.totals.savings);

          // Note that these calculations actually show how much _more_ power is used
          // when the Xeco units are turned off, rather than how much _less_ is used
          // when they are turned on.  It is extremely important to remember this when
          // estimating actual savings later on for the cost savings report and ROI readout.
          // For example, if `report.percentSaved.kwh` comes out to .05 below, and a
          // customer's electricity bill shows 1000kwh for a month, their estimated savings
          // would be 50kwh (1000*.05) rather than 52.63158kwh (1000/.95 - 1000), as it would
          // be if the .05 represented a traditional savings percentage.
	  let kwPeakMax, pfMax, kvarMax, kvaMax, kwhMax;
	  if (report.totals.xecoOff.kwPeak > report.totals.xecoOn.kwPeak) 
	    kwPeakMax = report.totals.xecoOff.kwPeak;
	  else
	    kwPeakMax = report.totals.xecoOn.kwPeak;
	  if (report.totals.xecoOff.powerFactor > report.totals.xecoOn.powerFactor) 
	    pfMax = report.totals.xecoOff.powerFactor;
	  else
	    pfMax = report.totals.xecoOn.powerFactor;
	  if (report.totals.xecoOff.kvar > report.totals.xecoOn.kvar) 
	    kvarMax = report.totals.xecoOff.kvar;
	  else
	    kvarMax = report.totals.xecoOn.kvar;
	  if (report.totals.xecoOff.kva > report.totals.xecoOn.kva) 
	    kvaMax = report.totals.xecoOff.kva;
	  else
	    kvaMax = report.totals.xecoOn.kva;
	  if (report.totals.xecoOff.kwh > report.totals.xecoOn.kwh) 
	    kwhMax = report.totals.xecoOff.kwh;
	  else
	    kwhMax = report.totals.xecoOn.kwh;
          report.percentSaved = {
            kwPeak: (report.totals.savings.kwPeak / kwPeakMax) || 0,
            powerFactor: report.totals.savings.powerFactor / pfMax || 0,
            THD: report.totals.savings.THD || 0,
            kvar: (report.totals.savings.kvar / kvarMax) || 0,
            kva: (report.totals.savings.kva / kvaMax) || 0,
            kwh: (report.totals.savings.kwh / kwhMax) || 0,
            //kvar: (report.totals.savings.kvar / report.totals.xecoOff.kvar) || 0,
            //kva: (report.totals.savings.kva / report.totals.xecoOff.kva) || 0,
            //kwh: (report.totals.savings.kwh / report.totals.xecoOff.kwh) || 0
          };
    
          return cb(undefined, report);

        }],

        
      }, function(err, results) {
        if (err) { return exits.error(err); }

        console.log(results.calculate);
       
        return exits.success(results.calculate);
      });

    });

  }

};
