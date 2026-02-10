/**
 * ensure-report-data.js
 *
 * @description :: Helper to ensure all required ReportData entries exist for a project
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */

module.exports = {

  friendlyName: 'Ensure ReportData exists',

  description: 'Creates missing ReportData entries for a project if they don\'t exist.',

  inputs: {
    project: {
      type: 'number',
      required: true,
      description: 'The project ID'
    }
  },

  exits: {
    success: {
      description: 'All required ReportData entries now exist'
    },
    error: {
      description: 'An error occurred'
    }
  },

  fn: function(inputs, exits) {
    var async = require('async');
    var Moment = require('moment-timezone');
    
    // First, get the project to check for test
    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error(err); }
      if (!project) { return exits.error(new Error('Project not found')); }
      
      // Check if there's a valid test and bill analytic to calculate from
      var hasValidTest = project.selectedTest && project.kwhSavings != null && project.kwPeakSavings != null;
      var hasValidBillAnalytic = project.electricBillAnalysis && 
                                 project.electricBillAnalysis.totalKwh != null && 
                                 project.electricBillAnalysis.kwPeak != null;
      var canCalculate = hasValidTest && hasValidBillAnalytic;
      
      // Define all required ReportData entries for a project (default values)
      var requiredEntries = [
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'week', description: 'weeklykwh', valueType: 'kwh', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'today', description: 'today kwh', valueType: 'kwh', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'month', description: '', valueType: 'avgKva', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'month', description: '', valueType: 'kwh', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'month', description: '', valueType: 'peak', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastMonth', description: '', valueType: 'kwh', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastMonth', description: '', valueType: 'peak', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastMonth', description: '', valueType: 'totalCost', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastMonth', description: '', valueType: 'totalSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'year', description: '', valueType: 'totalSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastYear', description: '', valueType: 'totalSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'totalSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'today', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'week', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'month', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastMonth', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'year', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastYear', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'I2RLossSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'year', description: '', valueType: 'carbonSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'carbonSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'carbonSavingsAmount', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'kwhSavingsAmount', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'peakSavingsAmount', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'peakSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'kwhSavings', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'I2RLossSavingsAmount', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'month', description: '', valueType: 'pfc', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastMonth', description: '', valueType: 'pfc', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'year', description: '', valueType: 'pfc', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'lastYear', description: '', valueType: 'pfc', value: 0},
      {type: 'project', typeId: inputs.project, project: inputs.project, period: 'allTime', description: '', valueType: 'pfc', value: 0}
    ];

    // Check which entries exist
    ReportData.find({project: inputs.project}).exec(function(err, existingData) {
      if (err) { return exits.error(err); }

      // Create a map of existing entries for quick lookup
      var existingMap = {};
      existingData.forEach(function(item) {
        var key = item.type + '|' + item.period + '|' + item.valueType;
        existingMap[key] = true;
      });

      // Find missing entries
      var missingEntries = requiredEntries.filter(function(entry) {
        var key = entry.type + '|' + entry.period + '|' + entry.valueType;
        return !existingMap[key];
      });
      
      // Find existing entries that are zero and should be recalculated if calculation is possible
      var zeroEntriesToRecalculate = [];
      if (canCalculate) {
        existingData.forEach(function(existingItem) {
          // Check if this entry matches a required entry and has value 0
          var matchesRequired = requiredEntries.some(function(reqEntry) {
            return reqEntry.type === existingItem.type &&
                   reqEntry.period === existingItem.period &&
                   reqEntry.valueType === existingItem.valueType;
          });
          if (matchesRequired && (existingItem.value === 0 || existingItem.value === null)) {
            zeroEntriesToRecalculate.push(existingItem);
          }
        });
      }

      if (missingEntries.length === 0 && zeroEntriesToRecalculate.length === 0) {
        return exits.success();
      }

      // If we have a valid test and bill analytic, calculate values from historical data
      if (canCalculate) {
        // Combine missing entries and zero entries to recalculate
        var allEntriesToProcess = missingEntries.concat(zeroEntriesToRecalculate.map(function(item) {
          return {
            type: item.type,
            typeId: item.typeId,
            project: item.project,
            period: item.period,
            valueType: item.valueType,
            description: item.description || '',
            value: 0 // Will be calculated
          };
        }));
        
        calculateAndCreateEntries(project, allEntriesToProcess, function(err) {
          if (err) {
            sails.log.warn('Failed to calculate ReportData, using defaults:', err);
            // Fall back to creating with default values (only for missing entries)
            if (missingEntries.length > 0) {
              createEntriesWithDefaults(missingEntries);
            } else {
              exits.success(); // Zero entries exist, just couldn't recalculate them
            }
          } else {
            exits.success();
          }
        });
      } else {
        // No valid test or bill analytic, create with default values (only missing entries)
        if (!hasValidTest) {
          sails.log.info('Project ' + inputs.project + ' missing valid test (selectedTest or savings percentages), using default ReportData values');
        }
        if (!hasValidBillAnalytic) {
          sails.log.info('Project ' + inputs.project + ' missing valid bill analytic (totalKwh or kwPeak), using default ReportData values');
        }
        if (missingEntries.length > 0) {
          createEntriesWithDefaults(missingEntries);
        } else {
          exits.success(); // All entries exist, just can't calculate yet
        }
      }
      
      function createEntriesWithDefaults(entries) {
        async.eachLimit(entries, 5, function(entry, cb) {
          ReportData.create(entry).exec(function(err) {
            if (err) {
              sails.log.warn('Failed to create ReportData entry:', entry, err);
            }
            cb(); // Continue even if one fails
          });
        }, function(err) {
          if (err) { return exits.error(err); }
          sails.log.info('Created ' + entries.length + ' missing ReportData entries for project ' + inputs.project);
          return exits.success();
        });
      }
      
      function calculateAndCreateEntries(project, missingEntries, callback) {
        var now = Moment.tz(new Moment(), project.timeZoneId);
        var datastore = sails.getDatastore('default');
        
        // Calculate savings ratios from test results
        var kwhSavings = project.kwhSavings == 1 ? 0 : parseFloat(project.kwhSavings) / (1 - parseFloat(project.kwhSavings));
        var kwPeakSavings = project.kwPeakSavings == 1 ? 0 : parseFloat(project.kwPeakSavings) / (1 - parseFloat(project.kwPeakSavings));
        
        // Calculate I2RLoss ratio
        var pfRatio = project.initialPf ? (parseFloat(project.initialPf) / (project.lastTotalPf || 96)) : 1;
        var I2RLossRatio = ((pfRatio * pfRatio - 1) * -1) * (5 / 100);
        
        // Get project start date (installation date) - only include data from this date onward
        var projectStartDate = project.startDate || null;
        
        // Helper function to get effective start date for a period (max of period start and project start)
        function getEffectiveStartDate(periodStart) {
          if (!projectStartDate) return periodStart;
          return periodStart > projectStartDate ? periodStart : projectStartDate;
        }
        
        // Configure week to start on Sunday (0 = Sunday, 1 = Monday)
        // Moment.js default is Monday, so we need to set it to Sunday
        var weekStartMoment = Moment(now);
        // Get the current day of week (0 = Sunday, 6 = Saturday)
        var dayOfWeek = weekStartMoment.day();
        // Calculate days to subtract to get to Sunday
        var daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
        var weekStart = weekStartMoment.subtract(daysToSunday, 'days').startOf('day').format('YYYY-MM-DD');
        var weekEnd = Moment(now).add(6 - dayOfWeek, 'days').endOf('day').format('YYYY-MM-DD');
        
        // Get date ranges (calendar boundaries)
        var today = Moment(now).startOf('day').format('YYYY-MM-DD');
        var monthStart = Moment(now).startOf('month').format('YYYY-MM-DD');
        var monthEnd = Moment(now).endOf('month').format('YYYY-MM-DD');
        var lastMonthStart = Moment(now).subtract(1, 'month').startOf('month').format('YYYY-MM-DD');
        var lastMonthEnd = Moment(now).subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
        var yearStart = Moment(now).startOf('year').format('YYYY-MM-DD');
        var yearEnd = Moment(now).endOf('year').format('YYYY-MM-DD');
        var lastYearStart = Moment(now).subtract(1, 'year').startOf('year').format('YYYY-MM-DD');
        var lastYearEnd = Moment(now).subtract(1, 'year').endOf('year').format('YYYY-MM-DD');
        
        // Calculate effective start dates for each period (respecting project installation date)
        var effectiveTodayStart = getEffectiveStartDate(today);
        var effectiveWeekStart = getEffectiveStartDate(weekStart);
        var effectiveMonthStart = getEffectiveStartDate(monthStart);
        var effectiveLastMonthStart = getEffectiveStartDate(lastMonthStart);
        var effectiveYearStart = getEffectiveStartDate(yearStart);
        var effectiveLastYearStart = getEffectiveStartDate(lastYearStart);
        
        // Query aggregate data for different periods
        // Note: avgKva in meterdataaggregate is per 15-minute interval
        // Each row represents 15 minutes = 0.25 hours
        // To get kwh: kwh = SUM(avgKva) * 0.25 (kva-hours)
        // IMPORTANT: meterdataaggregate is populated by perform-rollup.js which only processes
        // meters with isMain = true, so this data should already be filtered correctly.
        // IMPORTANT: All queries filter by project.startDate to only include data from installation date onward.
        async.parallel({
          todayKwh: function(cb) {
            // Only include today if it's on or after project start date
            if (projectStartDate && today < projectStartDate) {
              return cb(null, 0);
            }
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day = \'' + today + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying todayKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              sails.log.debug('todayKwh for project ' + project.id + ':', value);
              cb(null, value);
            });
          },
          weekKwh: function(cb) {
            // Only include week data if week end is on or after project start date
            if (projectStartDate && weekEnd < projectStartDate) {
              return cb(null, 0);
            }
            var effectiveStart = effectiveWeekStart;
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + weekEnd + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying weekKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              cb(null, value);
            });
          },
          monthKwh: function(cb) {
            // Only include month data if month end is on or after project start date
            if (projectStartDate && monthEnd < projectStartDate) {
              return cb(null, 0);
            }
            var effectiveStart = effectiveMonthStart;
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + monthEnd + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying monthKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              sails.log.debug('monthKwh for project ' + project.id + ':', value, 'rows:', result.rows.length);
              cb(null, value);
            });
          },
          monthPeak: function(cb) {
            // Only include month data if month end is on or after project start date
            if (projectStartDate && monthEnd < projectStartDate) {
              return cb(null, 0);
            }
            var effectiveStart = effectiveMonthStart;
            var sql = 'SELECT COALESCE(MAX(avgKva), 0) as peak FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + monthEnd + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) return cb(err);
              cb(null, result.rows[0] ? (result.rows[0].peak || 0) : 0);
            });
          },
          lastMonthKwh: function(cb) {
            // Only include last month data if last month end is on or after project start date
            if (projectStartDate && lastMonthEnd < projectStartDate) {
              return cb(null, 0);
            }
            var effectiveStart = effectiveLastMonthStart;
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + lastMonthEnd + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying lastMonthKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              cb(null, value);
            });
          },
          lastMonthPeak: function(cb) {
            // Only include last month data if last month end is on or after project start date
            if (projectStartDate && lastMonthEnd < projectStartDate) {
              return cb(null, 0);
            }
            var effectiveStart = effectiveLastMonthStart;
            var sql = 'SELECT COALESCE(MAX(avgKva), 0) as peak FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + lastMonthEnd + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) return cb(err);
              cb(null, result.rows[0] ? (result.rows[0].peak || 0) : 0);
            });
          },
          yearKwh: function(cb) {
            // Only include year data if year end is on or after project start date
            if (projectStartDate && yearEnd < projectStartDate) {
              return cb(null, 0);
            }
            var effectiveStart = effectiveYearStart;
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + yearEnd + '\'';
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying yearKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              cb(null, value);
            });
          },
          lastYearKwh: function(cb) {
            // Only include last year data if last year end is on or after project start date
            // This is the key fix: if project was installed in October, lastYear (Jan-Dec of previous year) should return 0
            if (projectStartDate && lastYearEnd < projectStartDate) {
              sails.log.debug('Project ' + project.id + ' installed on ' + projectStartDate + ' is after lastYear end ' + lastYearEnd + ', returning 0');
              return cb(null, 0);
            }
            var effectiveStart = effectiveLastYearStart;
            // If effective start is after lastYear end, return 0
            if (effectiveStart > lastYearEnd) {
              sails.log.debug('Project ' + project.id + ' effective start ' + effectiveStart + ' is after lastYear end ' + lastYearEnd + ', returning 0');
              return cb(null, 0);
            }
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id + 
                      ' AND day >= \'' + effectiveStart + '\' AND day <= \'' + lastYearEnd + '\'';
            sails.log.debug('lastYearKwh SQL for project ' + project.id + ':', sql);
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying lastYearKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              sails.log.debug('lastYearKwh for project ' + project.id + ':', value, 'startDate:', projectStartDate, 'effectiveStart:', effectiveStart);
              cb(null, value);
            });
          },
          allTimeKwh: function(cb) {
            // Always filter allTime by project start date if it exists
            var sql = 'SELECT COALESCE(SUM(avgKva), 0) * 0.25 as totalKwh FROM meterdataaggregate WHERE project = ' + project.id;
            if (projectStartDate) {
              sql += ' AND day >= \'' + projectStartDate + '\'';
            }
            datastore.sendNativeQuery(sql).exec(function(err, result) {
              if (err) {
                sails.log.warn('Error querying allTimeKwh for project ' + project.id + ':', err);
                return cb(err);
              }
              var value = result.rows[0] ? (result.rows[0].totalKwh || 0) : 0;
              sails.log.info('allTimeKwh for project ' + project.id + ':', value, 'rows:', result.rows.length, 'startDate:', projectStartDate);
              cb(null, value);
            });
          }
        }, function(err, data) {
          if (err) {
            sails.log.error('Error querying aggregate data for project ' + project.id + ':', err);
            return callback(err);
          }
          
          sails.log.info('Aggregate data for project ' + project.id + ':', {
            todayKwh: data.todayKwh,
            weekKwh: data.weekKwh,
            monthKwh: data.monthKwh,
            monthPeak: data.monthPeak,
            lastMonthKwh: data.lastMonthKwh,
            lastMonthPeak: data.lastMonthPeak,
            yearKwh: data.yearKwh,
            lastYearKwh: data.lastYearKwh,
            allTimeKwh: data.allTimeKwh
          });
          
          // Calculate values for each missing entry
          var entriesToCreate = missingEntries.map(function(entry) {
            var calculatedValue = 0;
            
            // Calculate based on period and valueType
            if (entry.valueType === 'kwh') {
              if (entry.period === 'today') calculatedValue = data.todayKwh * (project.multiplier || 1);
              else if (entry.period === 'week') calculatedValue = data.weekKwh * (project.multiplier || 1);
              else if (entry.period === 'month') calculatedValue = data.monthKwh * (project.multiplier || 1);
              else if (entry.period === 'lastMonth') calculatedValue = data.lastMonthKwh * (project.multiplier || 1);
            } else if (entry.valueType === 'peak') {
              if (entry.period === 'month') calculatedValue = data.monthPeak * (project.multiplier || 1);
              else if (entry.period === 'lastMonth') calculatedValue = data.lastMonthPeak * (project.multiplier || 1);
            } else if (entry.valueType === 'totalSavings') {
              var kwh = 0, peak = 0;
              if (entry.period === 'lastMonth') {
                kwh = data.lastMonthKwh; peak = data.lastMonthPeak;
              } else if (entry.period === 'year') {
                kwh = data.yearKwh; peak = 0; // Would need year peak
              } else if (entry.period === 'lastYear') {
                kwh = data.lastYearKwh; peak = 0; // Would need lastYear peak
              } else if (entry.period === 'allTime') {
                kwh = data.allTimeKwh; peak = 0; // Would need allTime peak
              }
              calculatedValue = (kwh * (project.kwhRate || 0) * kwhSavings * (1 + (project.taxRate || 0)) + 
                                 (peak * kwPeakSavings * (project.kwRate || 0))) * (project.multiplier || 1);
            } else if (entry.valueType === 'totalCost') {
              if (entry.period === 'lastMonth') {
                var kwh = data.lastMonthKwh;
                var peak = data.lastMonthPeak;
                calculatedValue = (kwh * (project.kwhRate || 0) * (1 / (1 - project.kwhSavings)) * (1 + (project.taxRate || 0)) + 
                                 (peak * (1 / (1 - project.kwPeakSavings)) * (project.kwRate || 0))) * (project.multiplier || 1);
              }
            } else if (entry.valueType === 'I2RLossSavings') {
              var kwh = 0;
              if (entry.period === 'today') kwh = data.todayKwh;
              else if (entry.period === 'week') kwh = data.weekKwh;
              else if (entry.period === 'month') kwh = data.monthKwh;
              else if (entry.period === 'lastMonth') kwh = data.lastMonthKwh;
              else if (entry.period === 'year') kwh = data.yearKwh;
              else if (entry.period === 'lastYear') kwh = data.lastYearKwh;
              else if (entry.period === 'allTime') kwh = data.allTimeKwh;
              calculatedValue = (kwh / 60) * I2RLossRatio * (project.kwhRate || 0) * (project.multiplier || 1);
            } else if (entry.valueType === 'avgKva') {
              if (entry.period === 'month') {
                var daysInMonth = Moment(now).daysInMonth();
                var daysRecorded = Moment.duration(now.diff(Moment(now).startOf('month'))).asDays();
                calculatedValue = daysRecorded > 0 ? (data.monthKwh / daysRecorded) / 24 : 0;
              }
            }
            
            entry.value = calculatedValue;
            return entry;
          });
          
          // Create or update entries with calculated values
          async.eachLimit(entriesToCreate, 5, function(entry, cb) {
            // Check if this entry already exists (for zero entries being recalculated)
            var key = entry.type + '|' + entry.period + '|' + entry.valueType;
            var existingItem = existingData.find(function(item) {
              return (item.type + '|' + item.period + '|' + item.valueType) === key;
            });
            
            if (existingItem) {
              // Update existing entry
              ReportData.update({id: existingItem.id}).set({value: entry.value}).exec(function(err) {
                if (err) {
                  sails.log.warn('Failed to update ReportData entry:', entry, err);
                }
                cb(); // Continue even if one fails
              });
            } else {
              // Create new entry
              ReportData.create(entry).exec(function(err) {
                if (err) {
                  sails.log.warn('Failed to create ReportData entry:', entry, err);
                }
                cb(); // Continue even if one fails
              });
            }
          }, function(err) {
            if (err) return callback(err);
            var createdCount = entriesToCreate.filter(function(e) {
              var key = e.type + '|' + e.period + '|' + e.valueType;
              return !existingMap[key];
            }).length;
            var updatedCount = entriesToCreate.length - createdCount;
            if (createdCount > 0 && updatedCount > 0) {
              sails.log.info('Created ' + createdCount + ' and updated ' + updatedCount + ' ReportData entries (calculated from test) for project ' + inputs.project);
            } else if (createdCount > 0) {
              sails.log.info('Created ' + createdCount + ' missing ReportData entries (calculated from test) for project ' + inputs.project);
            } else if (updatedCount > 0) {
              sails.log.info('Updated ' + updatedCount + ' zero ReportData entries (calculated from test) for project ' + inputs.project);
            }
            callback();
          });
        });
      }
    }); // end ReportData.find
    }); // end Project.findOne
  }
};

