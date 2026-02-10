/**
 * Check main meter amps against thresholds and control switches accordingly
 * @param {Object} project - The project object
 * @param {Array} meters - Array of main meters (isMain: true)
 * @param {Array} perMeterRows - Array of per-meter aggregate data rows
 * @param {Object} sails - Sails app instance
 * @param {Function} callback - Callback function(err)
 */
function checkAmpsAndControlSwitches(project, meters, perMeterRows, sails, callback) {
  var async = require('async');
  var _ = require('lodash');
  
  // Check if thresholds are configured
  if (!project.lowAmpsThreshold && !project.highAmpsThreshold) {
    // No thresholds configured, skip switch control
    console.log("Project " + project.id + " has no amps thresholds configured, skipping switch control");
    return callback(null);
  }
  
  if (!project.lowAmpsThreshold || !project.highAmpsThreshold) {
    console.log("Warning: Project " + project.id + " has only one threshold configured. Both lowAmpsThreshold and highAmpsThreshold must be set.");
    return callback(null);
  }
  
  console.log("Checking amps thresholds for project " + project.id + " (low: " + project.lowAmpsThreshold + ", high: " + project.highAmpsThreshold + ")");
  
  // Get the latest avgAmp value from all main meters
  // Sum the amps from all main meters
  var totalAmps = 0;
  var mainMeterCount = 0;
  
  _.each(meters, function(meter) {
    // Find the latest perMeterRows entry for this meter (first one is most recent)
    var meterRows = perMeterRows.filter(function(row) {
      return row.meter == meter.id;
    });
    
    if (meterRows.length > 0) {
      // Get the first (most recent) row's avgAmp
      var latestRow = meterRows[0];
      if (latestRow.avgAmp && !isNaN(latestRow.avgAmp)) {
        totalAmps += latestRow.avgAmp;
        mainMeterCount++;
      }
    }
  });
  
  if (mainMeterCount === 0) {
    console.log("Warning: No main meter data found in perMeterRows for project " + project.id + " (meters: " + meters.length + ", perMeterRows: " + perMeterRows.length + ")");
    return callback(null);
  }
  
  console.log("Project " + project.id + " total amps from " + mainMeterCount + " main meter(s): " + totalAmps.toFixed(2) + 
              " (low threshold: " + project.lowAmpsThreshold + ", high threshold: " + project.highAmpsThreshold + ")");
  
  // Determine desired action based on thresholds
  var desiredState = null;
  var commandType = null;
  if (totalAmps < project.lowAmpsThreshold) {
    desiredState = 'off';
    commandType = sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF;
    console.log("Amps below low threshold (" + totalAmps.toFixed(2) + " < " + project.lowAmpsThreshold + "), should turn switches OFF");
  } else if (totalAmps > project.highAmpsThreshold) {
    desiredState = 'on';
    commandType = sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON;
    console.log("Amps above high threshold (" + totalAmps.toFixed(2) + " > " + project.highAmpsThreshold + "), should turn switches ON");
  } else {
    // Between thresholds - no action (hysteresis)
    console.log("Amps between thresholds (" + project.lowAmpsThreshold + " <= " + totalAmps.toFixed(2) + " <= " + project.highAmpsThreshold + "), no action");
    return callback(null);
  }
  
  // Check if we already sent this command (avoid duplicate commands)
  if (project.lastThresholdSwitchState === desiredState) {
    console.log("Switches already " + desiredState.toUpperCase() + " (lastThresholdSwitchState: " + project.lastThresholdSwitchState + "), skipping duplicate command");
    return callback(null);
  }
  
  console.log("Switches need to change from " + (project.lastThresholdSwitchState || 'unknown') + " to " + desiredState + ", sending command");
  
  // Get all switches for the project
  Switch.find({ project: project.id, isDeleted: false }).exec(function(err, switches) {
    if (err) {
      return callback(err);
    }
    
    if (switches.length === 0) {
      console.log("No switches found for project " + project.id);
      return callback(null);
    }
    
    var switchIds = _.pluck(switches, 'id');
    var currentTime = Date.now();
    
    // Create SwitchCommand record first
    SwitchCommand.create({
      project: project.id,
      commandType: commandType,
      startAt: currentTime,
      switches: switchIds,
      deviceType: switches[0].deviceType || null
    }).meta({fetch: true}).exec(function(err, switchCommand) {
      if (err) {
        console.log("Error creating SwitchCommand for project " + project.id + ":", err);
        return callback(err);
      }
      
      console.log("Created SwitchCommand " + switchCommand.id + " for project " + project.id + " (" + switches.length + " switches)");
      
      // Send command to each switch
      async.eachSeries(switches, function(switchDevice, nextSwitch) {
        setTimeout(function() {
          sails.helpers.devices.sendSwitchCommand({
            projectSlug: project.slug,
            time: currentTime,
            command: commandType,
            switchId: switchDevice.id,
            switchCommandId: switchCommand.id,
            scheduleId: 'x-' + switchCommand.id
          }).exec({
            error: function(err) {
              console.log("Error sending switch command to switch " + switchDevice.id + ":", err);
              // Continue to next switch even on error
              nextSwitch();
            },
            success: function() {
              console.log("Sent " + (commandType === sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON ? "ON" : "OFF") + 
                          " command to switch " + switchDevice.id);
              nextSwitch();
            }
          });
        }, 50); // 50ms delay between commands
      }, function(err) {
        if (err) {
          console.log("Error sending switch commands for project " + project.id + ":", err);
          // Try to cancel the switch command if sending failed
          SwitchCommand.update({ id: switchCommand.id }, { isCancelled: true }).exec(function() {
            sails.helpers.devices.cancelSwitchSchedule({
              scheduleId: 'x-' + switchCommand.id
            }).exec(function() {
              // Ignore errors in cancellation
            });
          });
        } else {
          console.log("Successfully sent switch commands to all " + switches.length + " switches for project " + project.id);
          
          // Update the project's lastThresholdSwitchState to remember we sent this command
          Project.update({ id: project.id }, { lastThresholdSwitchState: desiredState }).exec(function(err) {
            if (err) {
              console.log("Warning: Failed to update lastThresholdSwitchState for project " + project.id + ":", err);
              // Don't fail the callback - the commands were sent successfully
            } else {
              console.log("Updated lastThresholdSwitchState to '" + desiredState + "' for project " + project.id);
            }
            callback(null);
          });
        }
      });
    });
  });
}

module.exports = function doRollup(req, res) {
  var Moment = require('moment-timezone');
  var async = require('async');
  var sails = req._sails;
  console.log('[' + Moment().format() + '] doRollup start - function called');
  
  try {
    console.log('[' + Moment().format() + '] doRollup start - inside try block');

  var datastore = sails.getDatastore('default');

  var memoryCache = require('../../services/utilities/memcache.js'); 

  // Begin a SQL query to get aggregate data for an entire day.
  var DAILY_SQL = 'SELECT ' +
                    'SUM(numSamples) as numSamples, ' +
                    'AVG(' + MeterDataAggregate.schema.avgVolt.columnName + ') as avgVolt, ' +
                    'AVG(' + MeterDataAggregate.schema.avgAmp.columnName + ') as avgAmp, ' +
                    'AVG(' + MeterDataAggregate.schema.avgKw.columnName + ') as avgKw, ' +
                    'AVG(' + MeterDataAggregate.schema.avgKva.columnName + ') as avgKva, ' +
                    'AVG(' + MeterDataAggregate.schema.avgPf.columnName + ') as avgPf, ' +
                    'AVG(' + MeterDataAggregate.schema.avgKvar.columnName + ') as avgKvar ' +
                  'FROM ' + MeterDataAggregate.tableName + ' as minuteData ' +
                  'WHERE day = $1 AND project = $2 ' +
                  'GROUP BY day';

  // First find all the active projects.
  Project.find({ isDeleted: false }).exec(function(err, projects) {
    if (err) { return res.serverError(err); }
    async.eachLimit(projects, 1, function(project, nextProject) {
      console.log('[' + Moment().format() + '] doRollup project ' + project.id);
      if (memoryCache.get('rollup_perform-rollup_' + project.id) !== null) {
        console.log('[' + Moment().format() + '] doRollup project ' + project.id + ' already in queue, skipping');
        return nextProject();
      } else {
        memoryCache.put('rollup_perform-rollup_' + project.id, true, 600000);
      }

      Meter.find({ isDeleted: false, isMain: true, project: project.id }).exec(function(err, meters) {
         // If the project has no meters, continue to the next one.
        if (meters.length === 0) { return nextProject(); }
        var meterIds = _.pluck(meters, 'id');
	console.log("meterIds",meterIds);

        
        // Get the current "moment" for this project's timezone.
        var moment = (new Moment()).tz(project.timeZoneId);


        // Get the current day.
        var today = moment.format('YYYY-MM-DD');
      

        // Get the current interval.
        var intervalId = sails.helpers.util.getIntervalFromMoment({ moment: moment }).execSync();

        // Get the period of the current interval.
        var intervalPeriod = sails.helpers.util.getIntervalPeriodFromMoment({ moment: moment, intervalId: intervalId }).execSync();

        // Get the IDs of all the meters in the project.
       

        // Start a transaction.
        datastore.transaction(function (db, proceed){

          // Find all of the intervals in the set of MeterData rows created since the last rollup,
          // with recordedAt < the start of the current interval.  This lets us capture data from
          // previously-rolled-up intervals that came in late.
          // TODO -- determine if any rows were somehow recorded with FUTURE intervals and deal with that case,
          // since using this query those rows will be ignored.
          datastore.sendNativeQuery('SELECT DISTINCT day, intervalId FROM ' + MeterData.tableName
                                + ' WHERE meter IS NOT NULL and createdAt > $1 AND recordedAt < $2'
                                + ' ORDER BY day, intervalId',
                                [project.lastRollupAt || 0, intervalPeriod.startTime]
          ).exec(function(err, result) {
            if (err) { console.log("sendNativeQuery datastore, select meterdata for rollup fail");return proceed(err); }

            // Get the interval periods.
            var intervalPeriods = _.map(result.rows, function(row) {
              // Parse the day string (YYYY-MM-DD) in the project's timezone
              var dayMoment = Moment.tz(row.day, 'YYYY-MM-DD', project.timeZoneId);
              return sails.helpers.util.getIntervalPeriodFromMoment({moment: dayMoment, intervalId: row.intervalId}).execSync();
            });
            console.log("getting 15 minute interval");

            // Aggregate each period.
            sails.helpers.rollup.calculate15MinuteIntervals({ meterIds: meterIds, ranges: intervalPeriods, dbConnection: db}).exec(function(err, resultRows) {
	      console.log("15 min of meterIds",meterIds);
              if (err) { return proceed(err); }
              console.log("calculated 15 minute intervals");
              // If there was no data, continue to the next project.
              if (resultRows.all == null)  { return proceed(); }
              if (resultRows.all.length === 0 || resultRows.perMeter.length === 0 ) { return proceed(); }


              // Add the project ID to each row, since it's a required attribute for MeterDataAggregate rows.
              var rows = _.map(resultRows.all, function(row) {
                // Ensure day is a string in YYYY-MM-DD format (it should already be from SQL, but ensure it)
                var dayStr = typeof row.day === 'string' ? row.day : (row.day ? Moment(row.day).format('YYYY-MM-DD') : null);
                if (!dayStr) {
                  console.log('WARNING: row.day is missing or invalid:', row.day);
                  dayStr = moment.format('YYYY-MM-DD'); // Fallback to today
                }
                // Parse the day string (YYYY-MM-DD) in the project's timezone for interval calculations
                var dayMoment = Moment.tz(dayStr, 'YYYY-MM-DD', project.timeZoneId);
                var intervalPeriod = sails.helpers.util.getIntervalPeriodFromMoment({ moment: dayMoment, intervalId: row.intervalId }).execSync();
                row.project = project.id;
                row.day = dayStr; // Explicitly set day to ensure it's correct
                row.intervalStartTime = intervalPeriod.startTime;
                row.intervalEndTime = intervalPeriod.endTime;
                return row;
              });

              //added in individual meter aggregates
              var perMeterRows = _.map(resultRows.perMeter, function(row) {
                // Ensure day is a string in YYYY-MM-DD format (it should already be from SQL, but ensure it)
                var dayStr = typeof row.day === 'string' ? row.day : (row.day ? Moment(row.day).format('YYYY-MM-DD') : null);
                if (!dayStr) {
                  console.log('WARNING: row.day is missing or invalid in perMeter:', row.day);
                  dayStr = moment.format('YYYY-MM-DD'); // Fallback to today
                }
                // Parse the day string (YYYY-MM-DD) in the project's timezone for interval calculations
                var dayMoment = Moment.tz(dayStr, 'YYYY-MM-DD', project.timeZoneId);
                var intervalPeriod = sails.helpers.util.getIntervalPeriodFromMoment({ moment: dayMoment, intervalId: row.intervalId }).execSync();
                row.project = project.id;
                row.day = dayStr; // Explicitly set day to ensure it's correct
                row.intervalStartTime = intervalPeriod.startTime;
                row.intervalEndTime = intervalPeriod.endTime;
                return row;
              });

              console.log("formed calulated aggregate meter data");
            

              var DESTROY_SQL = (function() {
                var sql = 'DELETE FROM ' + MeterDataAggregate.tableName + ' WHERE ';
                var days = _.reduce(resultRows.all, function(memo, row) {
                  memo[row.day] = memo[row.day] || [];
                  memo[row.day].push('\''+ row.intervalId + '\'');
                  return memo;
                }, {});
                return sql + 'project = ' + project.id + ' AND (' + _.reduce(days, function(memo, intervalIds, day) {
                  return memo.concat('(' + MeterDataAggregate.schema.day.columnName + '=\'' + day + '\' AND ' + MeterDataAggregate.schema.intervalId.columnName + ' IN (' + intervalIds.join(',') + '))');
                }, []).join(' OR ') + ')';
              })();

              var PER_METER_DESTROY_SQL = (function() {
                var sql = 'DELETE FROM ' + PerMeterDataAggregate.tableName + ' WHERE ';
                var days = _.reduce(resultRows.perMeter, function(memo, row) {
                  memo[row.day] = memo[row.day] || [];
                  memo[row.day].push('\''+ row.intervalId + '\'');
                  return memo;
                }, {});
                return sql + 'project = ' + project.id + ' AND (' + _.reduce(days, function(memo, intervalIds, day) {
                  return memo.concat('(' + PerMeterDataAggregate.schema.day.columnName + '=\'' + day + '\' AND ' + PerMeterDataAggregate.schema.intervalId.columnName + ' IN (' + intervalIds.join(',') + '))');
                }, []).join(' OR ') + ')';
              })();

              // Grab this value here because "rows" will be mutated by the "create" below...
              var lastRollupAt = _.max(_.pluck(rows, 'createdAt'));
              console.log('Last rollup will be set to ' + lastRollupAt);

            // Destroy any existing rows with the same day/interval as the one's we're about to create.
              datastore.sendNativeQuery(DESTROY_SQL).usingConnection(db).exec(function(err) {
                if (err) { return proceed(err); }

                // Destroy any existing rows with the same day/interval as the one's we're about to create for per meter aggregate
                datastore.sendNativeQuery(PER_METER_DESTROY_SQL).usingConnection(db).exec(function(err) {
                if (err) { return proceed(err); }

                // Attempt to create rows for each interval that we just got data for.
                // Typically this should just be one row, unless a rollup was missed
                // or some late data came in for a previously-calculated interval.
                // TODO -- alert if it looks like a rollup was missed.
              console.log("# of aggregated data ", rows.length);
              console.log("# of per meter aggregated data ", perMeterRows.length);
              // Debug: log first few day values to verify they're correct
              if (rows.length > 0) {
                console.log("Sample day values from rows:", rows.slice(0, 3).map(function(r) { return r.day; }));
              }
              if (perMeterRows.length > 0) {
                console.log("Sample day values from perMeterRows:", perMeterRows.slice(0, 3).map(function(r) { return r.day; }));
              }

                MeterDataAggregate.createEach(rows).usingConnection(db).exec(function(err) {
                  if (err) { return proceed(err); }

                  // Get the latest day in the data returned.
                  let lastDayRecorded = rows[0].day;
                  // Get the earliest day in the data returned.
                  let firstDayRecorded = _.last(rows).day;
                  // Get the latest interval returned.
                  let lastIntervalNum = parseInt(rows[0].intervalId.split('/')[0]);


                  PerMeterDataAggregate.createEach(perMeterRows).usingConnection(db).exec(function(err) {
                    if (err) { return proceed(err); }
                    // once permeter aggregate data is aggregated, check to see if peak has changed for each meter for the current month
                    console.log("Created new aggregate data");

                    // Check amps thresholds and control switches if needed
                    // This runs asynchronously and doesn't block the rollup process
                    // NOTE: This is independent of reportdata - it only uses project thresholds, meters, and perMeterRows
                    console.log("Checking switch control for project " + project.id + " (lowAmpsThreshold: " + (project.lowAmpsThreshold || 'not set') + ", highAmpsThreshold: " + (project.highAmpsThreshold || 'not set') + ")");
                    try {
                      checkAmpsAndControlSwitches(project, meters, perMeterRows, sails, function(err) {
                        if (err) {
                          console.log("Error in switch control for project " + project.id + ":", err);
                          // Don't fail rollup if switch control fails
                        }
                      });
                    } catch (err) {
                      console.log("Exception in switch control for project " + project.id + ":", err);
                      // Don't fail rollup if switch control throws an exception
                    }

                    // update peaks if new 15 minute kva is bigger than the current peak
                    ReportData.find({project: project.id}).exec(function(err, reportData) {
                      if (err) { return proceed(err); }
                      if (!reportData || reportData.length === 0) {
                        console.log("Warning: No reportData found for project " + project.id);
                        return proceed();
                      }
                      
                      //update peak for each meter
                      let newPeakTime = moment.format('YYYY/MM/DD h:mm:ss a').toString();
                      async.eachLimit(meters, 1, function(meter, nextMeter) {
                        let meterDataAggregateData = perMeterRows.filter(function(row) {
                          return row.meter == meter.id
                        });
                        
                        let newMeterPeak = _.max(_.pluck(meterDataAggregateData, 'avgKva'));

                        let currentMeterPeak = reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.type == 'meter' && item.typeId == meter.id);
                        if (!currentMeterPeak) {
                          return nextMeter(); // Skip if no reportData entry found
                        }
                        currentMeterPeak = currentMeterPeak.value;
                        console.log("meter peaks; ", newMeterPeak, currentMeterPeak);
                        if (newMeterPeak > currentMeterPeak) {
                          ReportData.update({type: 'meter', typeId: meter.id, period: 'month', valueType: 'peak'}).set({
                            value: newMeterPeak,
                            description: newPeakTime,
                          }).exec(function(err) {
                            if (err) { console.log("error here *")}
                            console.log("updated meter peak for meter ", meter.id);
                            return nextMeter();
                          });
                        } else {
                          // Must call nextMeter() even if condition is false
                          return nextMeter();
                        }
                      }, function(err) {
                        // Callback when all meters are processed
                        if (err) { return proceed(err); }

                        //update peak for project
                        let newProjectPeak = _.max(_.pluck(rows, 'avgKva'));
                        let currentProjectPeakEntry = reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.type == 'project');
                        if (!currentProjectPeakEntry) {
                          // No project peak entry found, skip update and continue
                          return continueAfterProjectPeak();
                        }
                        let currentProjectPeak = currentProjectPeakEntry.value;
                        if (newProjectPeak > currentProjectPeak) {
                          ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'peak'}).set({
                            value: newProjectPeak,
                            description: newPeakTime,
                          }).exec(function(err) {
                            if (err) { console.log("error here")}
                            console.log("updated project peak");
                            continueAfterProjectPeak();
                          });
                        } else {
                          continueAfterProjectPeak();
                        }
                        
                        function continueAfterProjectPeak() {
                          Project.update({id: project.id}).set({
                            lastRollupAt: lastRollupAt, 
                            avg15MinuteKva: _.sum(_.pluck(rows, 'avgKva')) / rows.length
                          }).exec(function(err) {
                            if (err) { return proceed(err); }
                            console.log("updated project data");

                            // If the "day" of the first meter reading we just aggregated is not the same as today,
                            // then do a daily rollup as well.  Otherwise we're done.
                            if (firstDayRecorded === today) { return proceed(); }
                          
                            // Get the list of all days that we just created aggregate rows for.
                            // If there is more than one of these then it means we missed a whole days worth
                            // of rollups somehow.
                            // TODO -- alert if it looks like rollups were missed.
                            var daysToRollUp = _.without(_.uniq(_.pluck(rows, 'day')), today);

                            if (daysToRollUp.length === 0) {
                              // No days to roll up, we're done
                              return proceed();
                            }

                            async.each(daysToRollUp, function(dayToRollUp, nextDay) {

                              // Destroy any previous daily rollup for this day.
                              MeterDataAggregate.destroy({ project: project.id, day: dayToRollUp, intervalId: '' }).usingConnection(db).exec(function(err) {
                                if (err) { return proceed(err); }
                                console.log("cleaned up day rollup");

                                datastore.sendNativeQuery(DAILY_SQL, [dayToRollUp, project.id]).usingConnection(db).exec(function(err, result) {
                                  if (err) { return proceed(err); }
                                  console.log("get new day rollup");

                                  // Set the project and day for the daily rollup record.
                                  var dailyRollup = _.extend({}, result.rows[0], {
                                    project: project.id,
                                    day: dayToRollUp
                                  });
                        
                                  // Create the daily rollup record.
                                  MeterDataAggregate.create(dailyRollup).usingConnection(db).exec(function(err) {
                                    if (err) { return proceed(err); }
                                    console.log("aggregated get new day rollup");
                                    nextDay();
                                  });
                                });
                              }); // </ MeterDataAggregate.destroy >

                            }, function(err) {
                              // Callback when all days are processed
                              if (err) { return proceed(err); }
                              console.log("finished all processes");
                              return proceed();
                            }); // </ async.each() >

                          }); // </ Project.update >
                        }
                      }); // </ async.eachLimit completion callback >

                    }); // </ ReportData.find() >

                  }); // </ PerMeterDataAggregate.createEach >

                }); // </ MeterDataAggregate.createEach >

              }); // </ PerMeterDataAggregate.destroy >

            }); // </ MeterDataAggregate.destroy >

          }); // </ datastore.calculate15MinuteIntervals >

        }); // </ datastore.sendNativeQuery >
  
      }).exec(function(err) {
        if (err) { sails.log.error('[' + Moment().format() + '] doRollup error ' + err); }
        // If there was an error, proceed to the next project.
        // No need to let one bad rollup spoil the bunch!
        // TODO -- alert if rollup throws error.
        console.log('finished rollup for project: ', project.id);
        
      });
    });
    return nextProject();
    }, function doneRollingUp(err) {
      if (err) { 
        console.log('[' + Moment().format() + '] doRollup error in doneRollingUp:', err);
        return res.serverError(err); 
      }
      console.log('[' + Moment().format() + '] doRollup completed successfully');
      return res.ok();
    });
  });
  } catch (err) {
    console.log('[' + Moment().format() + '] doRollup exception at top level:', err);
    console.log('[' + Moment().format() + '] doRollup exception stack:', err.stack);
    return res.serverError(err);
  }
};
