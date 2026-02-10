module.exports = function doEquipmentRollup(req, res) {
  var Moment = require('moment-timezone');
  var async = require('async');
  var sails = req._sails;
  console.log('[' + Moment().format() + '] doRollup start');

  var datastore = sails.getDatastore('default');

  var memoryCache = require('../../services/utilities/memcache.js');

  // Begin a SQL query to get aggregate data for an entire day.
  var DAILY_SQL = 'SELECT ' +
                    'SUM(numSamples) as numSamples, ' +
                    'MAX(' + EquipmentDataAggregate.schema.avgKva.columnName + ') as peakKva, ' +
                    'MAX(' + EquipmentDataAggregate.schema.avgKw.columnName + ') as peakKw, ' +
                    'AVG(' + EquipmentDataAggregate.schema.avgVolt.columnName + ') as avgVolt, ' +
                    'AVG(' + EquipmentDataAggregate.schema.avgAmp.columnName + ') as avgAmp, ' +
                    'AVG(' + EquipmentDataAggregate.schema.avgKw.columnName + ') as avgKw, ' +
                    'AVG(' + EquipmentDataAggregate.schema.avgKva.columnName + ') as avgKva, ' +
                    'AVG(' + EquipmentDataAggregate.schema.avgPf.columnName + ') as avgPf, ' +
                    'AVG(' + EquipmentDataAggregate.schema.avgKvar.columnName + ') as avgKvar ' +
                  'FROM ' + EquipmentDataAggregate.tableName + ' as minuteData ' +
                  'WHERE day = $1 AND project = $2 ' +
                  'GROUP BY day';

  // First find all the active projects.
  Project.find({ isDeleted: false }).exec(function(err, projects) {
    if (err) { return res.serverError(err); }
    async.eachLimit(projects, 1, function(project, nextProject) {
      console.log('[' + Moment().format() + '] doRollup project ' + project.id);
      let now = Moment.tz(new Moment(), project.timeZoneId);
      Switch.find({ isDeleted: false, project: project.id }).exec(function(err, switches) {
        if (memoryCache.get('rollup_perform-rollup_' + project.id) !== null) {
          console.log('[' + Moment().format() + '] doRollup project ' + project.id + ' already in queue, skipping');
          return nextProject();
        } else {
          memoryCache.put('rollup_perform-rollup_' + project.id, true, 600000);
        }

        // Get the current "moment" for this project's timezone.
        var moment = (new Moment()).tz(project.timeZoneId);

        // Get the current day.
        var today = moment.format('YYYY-MM-DD');
        let monthStart = now.startOf('month').format('YYYY-MM-DD').toString();
      

        // Get the current interval.
        var intervalId = sails.helpers.util.getIntervalFromMoment({ moment: moment }).execSync();

        // Get the period of the current interval.
        var intervalPeriod = sails.helpers.util.getIntervalPeriodFromMoment({ moment: moment, intervalId: intervalId }).execSync();

        // Get the IDs of all the meters in the project.
        var switchIds = _.pluck(switches, 'id');

        // If the project has no meters, continue to the next one.
        if (switchIds.length === 0) { return nextProject(); }

        // Start a transaction.
        datastore.transaction(function (db, proceed){

        // Find all of the intervals in the set of MeterData rows created since the last rollup,
        // with recordedAt < the start of the current interval.  This lets us capture data from
        // previously-rolled-up intervals that came in late.
        // TODO -- determine if any rows were somehow recorded with FUTURE intervals and deal with that case,
        // since using this query those rows will be ignored.
        datastore.sendNativeQuery('SELECT DISTINCT day, intervalId FROM ' + EquipmentData.tableName
                              + ' WHERE switch IS NOT NULL and createdAt > $1 AND recordedAt < $2'
                              + ' ORDER BY day, intervalId LIMIT 10000',
                              [project.lastRollupAt || 0, intervalPeriod.startTime]
        ).exec(function(err, result) {
          if (err) { 
            console.log("sendNativeQuery datastore, select meterdata for rollup fail");
            return proceed(err); }

          // Get the interval periods.
          var intervalPeriods = _.map(result.rows, function(row) {
            return sails.helpers.util.getIntervalPeriodFromMoment({moment: Moment.tz(row.day, project.timeZoneId), intervalId: row.intervalId}).execSync();
          });
          console.log("getting 15 minute interval");
          // Aggregate each period.
          sails.helpers.rollup.calculate15MinuteEquipmentIntervals({ switches: switchIds, ranges: intervalPeriods, dbConnection: db}).exec(function(err, resultRows) {
            if (err) { return proceed(err); }
            console.log("calculated 15 minute intervals");
            // If there was no data, continue to the next project.
            if (resultRows == null)  { return proceed(); }
            if (resultRows.length === 0 ) { return proceed(); }


            // Add the project ID to each row, since it's a required attribute for MeterDataAggregate rows.
            var rows = _.map(resultRows, function(row) {
              var intervalPeriod = sails.helpers.util.getIntervalPeriodFromMoment({ moment: new Moment.tz(row.day, project.timeZoneId), intervalId: row.intervalId }).execSync();
              row.project = project.id; 
              row.intervalStartTime = intervalPeriod.startTime;
              row.intervalEndTime = intervalPeriod.endTime;
              return row;
            });

            //added in individual meter aggregates
            

            console.log("formed calulated aggregate meter data");
            

            var DESTROY_SQL = (function() {
              var sql = 'DELETE FROM ' + EquipmentDataAggregate.tableName + ' WHERE ';
              var days = _.reduce(resultRows, function(memo, row) {
                memo[row.day] = memo[row.day] || [];
                memo[row.day].push('\''+ row.intervalId + '\'');
                return memo;
              }, {});
              return sql + 'project = ' + project.id + ' AND (' + _.reduce(days, function(memo, intervalIds, day) {
                return memo.concat('(' + EquipmentDataAggregate.schema.day.columnName + '=\'' + day + '\' AND ' + EquipmentDataAggregate.schema.intervalId.columnName + ' IN (' + intervalIds.join(',') + '))');
              }, []).join(' OR ') + ')';
            })();


            // Grab this value here because "rows" will be mutated by the "create" below...
            var lastRollupAt = _.max(_.pluck(rows, 'createdAt'));

            console.log('Last rollup will be set to ' + lastRollupAt);

            // Destroy any existing rows with the same day/interval as the one's we're about to create.
            datastore.sendNativeQuery(DESTROY_SQL).usingConnection(db).exec(function(err) {
              if (err) { return proceed(err); }

              // Destroy any existing rows with the same day/interval as the one's we're about to create for per meter aggregate
        

              // Attempt to create rows for each interval that we just got data for.
              // Typically this should just be one row, unless a rollup was missed
              // or some late data came in for a previously-calculated interval.
              // TODO -- alert if it looks like a rollup was missed.
              EquipmentDataAggregate.createEach(rows).usingConnection(db).exec(function(err) {
                if (err) { return proceed(err); }


           
                // once permeter aggregate data is aggregated, check to see if peak has changed for each meter for the current month

                // Get the latest day in the data returned.
                var lastDayRecorded = rows[0].day;
                // Get the earliest day in the data returned.
                var firstDayRecorded = _.last(rows).day;
                // Get the latest interval returned.
                var lastIntervalNum = parseInt(rows[0].intervalId.split('/')[0]);

                // Get all of the MeterDataAggregate rows for the day of the last interval recorded.
                // We'll use this to update the cached "instantaneous" data on the Project record.
               
                console.log("Created new aggregate data");
                EquipmentDataAggregate.find({ project: project.id, day: lastDayRecorded, intervalId: {'!=': ''}}).sort('intervalId DESC').usingConnection(db).exec(function(err, aggregateRows) {
                  if (err) { return proceed(err); }
                  EquipmentDataAggregate.find({ project: project.id, day: {'>=': monthStart}, intervalId: ''}).usingConnection(db).exec(function(err, dailyAggregatesForMonth) {
                  if (err) { return proceed(err); }
                
                  console.log("lastDayRecorded", lastDayRecorded);
                  console.log("# daily rollup for month: ", dailyAggregatesForMonth.length);
       
                  
                  let newIntervalNum = parseInt(aggregateRows[0].intervalId.split('/')[0]) + 1;
                  
                  let lastKwhAggregates = [];
                  
                  if (aggregateRows.length > 4){ //get interval total avgKw assuming every interval is recorded
                    let hourIndexStart = (newIntervalNum % 4 );
                    let hourIndexEnd = hourIndexStart + 4;
                    for (i = hourIndexStart; i < hourIndexEnd; i++) {
                      lastKwhAggregates.push(aggregateRows[i]);
                    }
                  } else {
                    lastKwhAggregates = aggregateRows;
                  }
                  

                  let lastKwh = _.sum(_.pluck(lastKwhAggregates, 'avgKva')) / lastKwhAggregates.length;

    

                    // If this is the first interval of the day, the average KVA is the peak.
                    // Otherwise, the peak is the average KVA _if_ it's higher than the current cached peak.
                    var kvaMax = _.max(_.pluck(aggregateRows, 'avgKva'));

                    var peakKva = kvaMax > project.monthPeak ? kvaMax : project.monthPeak;

      
                    let peakRecord = aggregateRows.filter(function(row) {
                      return row.avgKva == kvaMax;
                    });
                    let peakRecordTime = Moment.tz(new Moment(peakRecord.intervalStartTime), project.timeZoneId).format('YYYY/MM/DD h:mm:ss a');
                    let originalTime = Moment.tz(new Moment(rows[0].intervalStartTime), project.timeZoneId).format('YYYY/MM/DD h:mm:ss a');
                    let peakTime = kvaMax > project.monthPeak ? peakRecordTime : project.peakTime;
              

                    // Update the "lastRollupAt" for the project.
                    Project.update({id: project.id}, {
                      lastRollupAt: lastRollupAt,
                      monthPeak: peakKva,
                      avg15MinuteKva: _.sum(_.pluck(aggregateRows, 'avgKva')) / aggregateRows.length,
                      peakTime: peakTime,
                      lastKwh: lastKwh,
                    }).usingConnection(db).exec(function(err) {
                      if (err) { return proceed(err); }

                      // If the "day" of the first meter reading we just aggregated is not the same as today,
                      // then do a daily rollup as well.  Otherwise we're done.
                      if (firstDayRecorded === today) { return proceed(); }

                      // Get the list of all days that we just created aggregate rows for.
                      // If there is more than one of these then it means we missed a whole days worth
                      // of rollups somehow.
                      // TODO -- alert if it looks like rollups were missed.
                      var daysToRollUp = _.without(_.uniq(_.pluck(rows, 'day')), today);

                      async.each(daysToRollUp, function(dayToRollUp, nextDay) {

                        // Destroy any previous daily rollup for this day.
                        EquipmentDataAggregate.destroy({ project: project.id, day: dayToRollUp, intervalId: '' }).usingConnection(db).exec(function(err) {
                        if (err) { return proceed(err); }

                          datastore.sendNativeQuery(DAILY_SQL, [dayToRollUp, project.id]).usingConnection(db).exec(function(err, result) {
                          if (err) { return proceed(err); }

                            // Set the project and day for the daily rollup record.
                            var dailyRollup = _.extend({}, result.rows[0], {
                              project: project.id,
                              day: dayToRollUp
                            });
                
                            // Create the daily rollup record.
                              EquipmentDataAggregate.create(dailyRollup).usingConnection(db).exec(nextDay);
                            
                              });

                            }); // </ MeterDataAggregate.destroy >

                           }, proceed); // </ async.each() >

                        }); // </ Project.update() >

                      }); // </ MeterDataAggregate.find() >

                    }); // </ PerMeterDataAggregate.createEach >


                  }); // </ datastore.calculate15MinuteIntervals >

                });
               });
      
            }); // </ datastore.sendNativeQuery >

          }).exec(function(err) {
            if (err) { sails.log.error('[' + Moment().format() + '] doRollup error ' + err); }
            // If there was an error, proceed to the next project.
            // No need to let one bad rollup spoil the bunch!
            // TODO -- alert if rollup throws error.
            console.log('finished rollup for project: ', project.id);
            return nextProject();
          });
        });
      }, function doneEquipmentRollingUp(err) {
        if (err) { return res.serverError(err); }
        return res.ok();
      });
  });
};
