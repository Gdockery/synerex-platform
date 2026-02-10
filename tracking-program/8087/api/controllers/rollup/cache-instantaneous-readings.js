var Moment = require('moment-timezone');
var async = require('async');

module.exports = function doInstantaneousReadings(req, res) {

  var sails = req._sails;
  var datastore = sails.getDatastore('default');

  // Make sure the project is real and not archived.
  Project.find({isDeleted: false}).exec(function(err, projects) {
    if (err) { return res.serverError(err); }
    async.eachLimit(projects, 1, function(project, nextProject) {

      var record;
      var LAST_RECORD;

      var now = Moment.tz(new Moment(), project.timeZoneId);
        // Get the day of the recording.
      var day = now.format('YYYY-MM-DD') || '';
        // Get the interval ID of the recording.
      var intervalId = sails.helpers.util.getIntervalFromMoment({moment: now}).execSync() || '';
        // Get the minute of the recording.
      var minute = now.minute() || 0;

      console.log('[' + Moment().format() + '] cache-instantaneous-readings doInstantaneousReadings projectId ' + project.id + ', ' + project.name);
      if (err) { return res.serverError(err);}
      if (!project) { return res.notFound(); }

      let kwhSavings, kwPeakSavings, pfRatio, I2RLossRatio, kwh, I2RLossSavings, savings, carbonSavings, carbonSavingsValue;
      
      console.log("looking for meter");
      Meter.find({isDeleted: false, project: project.id, isReporting: true, isMain: true, lastCommunicatedAt: {'>': 0}}).exec(function(err, meters) {
        if (err) { return res.serverError(err); }

        ReportData.find({project: project.id}).exec(function(err, reportData) {
          if (err) { console.log("meter error", err); return res.serverError(err); }
          if (reportData.length == 0) {
            return nextProject();
          }
       
          let totalKw = 0, totalKva = 0, totalLoad = 0;
          console.log("looking at reportdata - if this fails look for missing project or meter lines in reportdata");
          
          //
          async.eachLimit(meters, 1, function(meter, nextMeter) {
            if (parseFloat(meter.lastTotalKw)> 0 && parseFloat(meter.lastTotalKvar) > 0 && parseFloat(meter.lastTotalKva) > 0) {
              totalKw += parseFloat(meter.lastTotalKw);
              totalKva += parseFloat(meter.lastTotalKva);
              totalLoad += parseFloat(meter.lastTotalAmp);
            }
	  console.log("----totalKw-----",totalKw);
          
          //Add meter data with rollup in case meter stops recording. This meter data has the same values as most recent recorded
          //data from the meter other than timestamps and rawData field is null
 
            LAST_RECORD = 'SELECT * FROM ' + MeterData.tableName + ' WHERE ' + MeterData.schema.meter.columnName + 
                                ' = ' + meter.id + ' ORDER BY ' + MeterData.schema.recordedAt.columnName + ' DESC limit 1';
	    console.log(LAST_RECORD);
            datastore.sendNativeQuery(LAST_RECORD).exec(function(err, result) {
              if (err) {
                console.log('Error querying LAST_RECORD for meter ' + meter.id + ':', err);
                return nextMeter();
              }
              if (!result || !result.rows || result.rows.length == 0) {
                console.log('No rows found for meter ' + meter.id); 
                return nextMeter();
              }
              record = result.rows[0];
              console.log("here");
              delete record.id;
              delete record.rawData;

              console.log("see if need to create data based on previous data");
              //console.log("time difference", now.valueOf(), now.valueOf() - record.recordedAt, "meter: ", record.meter);
              if ((now.valueOf() - record.recordedAt) > (59 * 1000)) {
                console.log("need to create data based on previous data");
                MeterData.create({
                  createdAt: now.valueOf(),
                  updatedAt: now.valueOf(),
                  recordedAt: now.valueOf(),
                  day: day,
                  minute: minute,
                  intervalId: intervalId,
                  l1Volt: record.l1Volt,
                  l1Amp: record.l1Amp,
                  l1Kw: record.l1Kw,
                  l1Kva: record.l1Kva,
                  l1Pf: record.l1Pf,
                  l1Kvar: record.l1Kvar,
                  l2Volt: record.l2Volt,
                  l2Amp: record.l2Amp,
                  l2Kw: record.l2Kw,
                  l2Kva: record.l2Kva,
                  l2Pf: record.l2Pf,
                  l2Kvar: record.l2Kvar,
                  l3Volt: record.l3Volt,
                  l3Amp: record.l3Amp,
                  l3Kw: record.l3Kw,
                  l3Kva: record.l3Kva,
                  l3Pf: record.l3Pf,
                  l3Kvar: record.l3Kvar,
                  totalVolt: record.totalVolt,
                  totalAmp: record.totalAmp,
                  totalKw: record.totalKw,
                  totalKva: record.totalKva,
                  totalPf: record.totalPf,
                  totalKvar: record.totalKvar,
                  kvaInterval: record.kvaInterval,
                  meter: record.meter,
                  meshId: record.meshId,
		  outputAmp: record.outputAmp
                }).meta({fetch: true}).exec(function(err, newData) {
                  if (err) {
                    console.log('upload fake meter data error for meter ' + meter.id + ':', err);
                  } else if (newData) {
                    console.log("fake meterdata id", newData.id, "meter: ", newData.meter);
                  }
                });
              } 
              // Continue processing - nextMeter() will be called after ReportData updates
            });
            if (meter.kwhSavings == 1) {
              kwhSavings = 1;
            } else {
              kwhSavings = parseFloat(meter.kwhSavings) / (1 - parseFloat(meter.kwhSavings));
            }
	   // First, try to parse the value
	   let lastPf = parseFloat(meter.lastTotalPf);

	   // Check if the result is a valid number AND is greater than 0
	   if (!isNaN(lastPf) && lastPf > 0) {
		  pfRatio = parseFloat(project.initialPf) / lastPf;
	   } else {
		  // Use the default if lastPf was null, NaN, 0, or negative
		  pfRatio = parseFloat(project.initialPf) / 96;
	    }

            I2RLossRatio = ((pfRatio * pfRatio - 1) * -1) * (5 / 100);
            kwh = parseFloat(meter.lastTotalKva) * project.multiplier * kwhSavings;
            I2RLossSavings = kwh / 60 * I2RLossRatio * parseFloat(project.kwhRate);
            savings = kwh / 60 * parseFloat(project.kwhRate) * (1 + parseFloat(project.taxRate)); 
	    console.log("reportdata update - if fails look for missing entries");
            
            // Helper function to safely get reportData value (returns 0 if not found)
            function getReportValue(period, valueType) {
              var entry = reportData.find(item => item.period == period && item.valueType == valueType && item.type == 'meter' && item.typeId == meter.id);
              return entry && entry.value ? entry.value : 0;
            }
            
            // Only update ReportData if entries exist, otherwise skip to avoid errors
            var monthKwhEntry = reportData.find(item => item.period == 'month' && item.valueType == 'kwh' && item.type == 'meter' && item.typeId == meter.id);
            if (monthKwhEntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'month', valueType: 'kwh'}).set({
                value: monthKwhEntry.value + parseFloat(meter.lastTotalKva * project.multiplier) / 60
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var weekKwhEntry = reportData.find(item => item.period == 'week' && item.valueType == 'kwh' && item.type == 'meter' && item.typeId == meter.id);
            if (weekKwhEntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'week', valueType: 'kwh'}).set({
                value: weekKwhEntry.value + parseFloat(meter.lastTotalKva * project.multiplier) / 60
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var todayKwhEntry = reportData.find(item => item.period == 'today' && item.valueType == 'kwh' && item.type == 'meter' && item.typeId == meter.id);
            if (todayKwhEntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'today', valueType: 'kwh'}).set({
                value: todayKwhEntry.value + parseFloat(meter.lastTotalKva * project.multiplier) / 60
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var todayI2REntry = reportData.find(item => item.period == 'today' && item.valueType == 'I2RLossSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (todayI2REntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'today', valueType: 'I2RLossSavings'}).set({
                value: todayI2REntry.value + I2RLossSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var weekI2REntry = reportData.find(item => item.period == 'week' && item.valueType == 'I2RLossSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (weekI2REntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'week', valueType: 'I2RLossSavings'}).set({
                value: weekI2REntry.value + I2RLossSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var monthI2REntry = reportData.find(item => item.period == 'month' && item.valueType == 'I2RLossSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (monthI2REntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'month', valueType: 'I2RLossSavings'}).set({
                value: monthI2REntry.value + I2RLossSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var yearI2REntry = reportData.find(item => item.period == 'year' && item.valueType == 'I2RLossSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (yearI2REntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'year', valueType: 'I2RLossSavings'}).set({
                value: yearI2REntry.value + I2RLossSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var allTimeI2REntry = reportData.find(item => item.period == 'allTime' && item.valueType == 'I2RLossSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (allTimeI2REntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'allTime', valueType: 'I2RLossSavings'}).set({
                value: allTimeI2REntry.value + I2RLossSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var allTimeSavingsEntry = reportData.find(item => item.period == 'allTime' && item.valueType == 'totalSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (allTimeSavingsEntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'allTime', valueType: 'totalSavings'}).set({
                value: allTimeSavingsEntry.value + savings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            var yearSavingsEntry = reportData.find(item => item.period == 'year' && item.valueType == 'totalSavings' && item.type == 'meter' && item.typeId == meter.id);
            if (yearSavingsEntry) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'year', valueType: 'totalSavings'}).set({
                value: yearSavingsEntry.value + savings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', meter.id);} 
              });
            }
            
            return nextMeter();
          });

          Switch.find({isDeleted: false, project: project.id, lastCommunicatedAt: {'>': 0}, deviceType: 2}).exec(function(err, schedulers) {
            if (err) { 
                console.log('err1'); return res.serverError(err); }

            async.eachLimit(schedulers, 1, function(scheduler, nextScheduler) {
              let EQUIPMENT_LAST_RECORD = 'SELECT * FROM ' + EquipmentData.tableName + ' WHERE ' + EquipmentData.schema.switch.columnName + 
                                ' = ' + scheduler.id + ' ORDER BY ' + EquipmentData.schema.recordedAt.columnName + ' DESC limit 1';

              datastore.sendNativeQuery(EQUIPMENT_LAST_RECORD).exec(function(err, schedulerResult) {
                if (err) {
                  console.log('Error querying EQUIPMENT_LAST_RECORD for scheduler ' + scheduler.id + ':', err);
                  return nextScheduler();
                }
                if (!schedulerResult || !schedulerResult.rows || schedulerResult.rows.length == 0) {
                    //console.log('err2'); 
                    return nextScheduler();
                }
        
                let scheduler_record = schedulerResult.rows[0];
                console.log('processing scheduler: ' + scheduler_record.switch); 

                if ((now.valueOf() - scheduler_record.recordedAt) < (60 * 2000)) {
                  // Only update ReportData if entries exist, otherwise skip to avoid errors
                  var todayKwhSchedulerEntry = reportData.find(item => item.period == 'today' && item.valueType == 'kwh' && item.type == 'scheduler' && item.typeId == scheduler_record.switch);
                  if (todayKwhSchedulerEntry) {
                    ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'today', valueType: 'kwh'}).set({
                      value: todayKwhSchedulerEntry.value + parseFloat(scheduler_record.totalKw) / 60 
                    }).meta({fetch: true}).exec(function(err, updatedProject) {
                      if (err) {console.log('upload savings detail for project error ',scheduler_record.switch);} 
                    });
                  }
                  
                  var todayCostSchedulerEntry = reportData.find(item => item.period == 'today' && item.valueType == 'totalCost' && item.type == 'scheduler' && item.typeId == scheduler_record.switch);
                  if (todayCostSchedulerEntry) {
                    ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'today', valueType: 'totalCost'}).set({
                      value: todayCostSchedulerEntry.value + parseFloat(scheduler_record.totalKw) / 60 * project.kwhRate
                    }).meta({fetch: true}).exec(function(err, updatedProject) {
                      if (err) {console.log('upload savings detail for project error ', scheduler_record.switch);} 
                    });
                  }
                  
                  var weekCostSchedulerEntry = reportData.find(item => item.period == 'week' && item.valueType == 'totalCost' && item.type == 'scheduler' && item.typeId == scheduler_record.switch);
                  if (weekCostSchedulerEntry) {
                    ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'week', valueType: 'totalCost'}).set({
                      value: weekCostSchedulerEntry.value + parseFloat(scheduler_record.totalKw) / 60 * project.kwhRate
                    }).meta({fetch: true}).exec(function(err, updatedProject) {
                      if (err) {console.log('upload savings detail for project error ', scheduler_record.switch);} 
                    });
                  }
                  
                  var monthCostSchedulerEntry = reportData.find(item => item.period == 'month' && item.valueType == 'totalCost' && item.type == 'scheduler' && item.typeId == scheduler_record.switch);
                  if (monthCostSchedulerEntry) {
                    ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'month', valueType: 'totalCost'}).set({
                      value: monthCostSchedulerEntry.value + parseFloat(scheduler_record.totalKw) / 60 * project.kwhRate
                    }).meta({fetch: true}).exec(function(err, updatedProject) {
                      if (err) {console.log('upload savings detail for project error ', scheduler_record.switch);} 
                    });
                  }
                  
                  var yearCostSchedulerEntry = reportData.find(item => item.period == 'year' && item.valueType == 'totalCost' && item.type == 'scheduler' && item.typeId == scheduler_record.switch);
                  if (yearCostSchedulerEntry) {
                    ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'year', valueType: 'totalCost'}).set({
                      value: yearCostSchedulerEntry.value + parseFloat(scheduler_record.totalKw) / 60 * project.kwhRate
                    }).meta({fetch: true}).exec(function(err, updatedProject) {
                      if (err) {console.log('upload savings detail for project error ', scheduler_record.switch);} 
                    });
                  }
                  
                  var allTimeCostSchedulerEntry = reportData.find(item => item.period == 'allTime' && item.valueType == 'totalCost' && item.type == 'scheduler' && item.typeId == scheduler_record.switch);
                  if (allTimeCostSchedulerEntry) {
                    ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'allTime', valueType: 'totalCost'}).set({
                      value: allTimeCostSchedulerEntry.value + parseFloat(scheduler_record.totalKw) / 60 * project.kwhRate
                    }).meta({fetch: true}).exec(function(err, updatedProject) {
                      if (err) {console.log('upload savings detail for project error ', scheduler_record.switch);} 
                    });
                  }

                  console.log("updated scheduler");
                }
                
                return nextScheduler();
              });
            });
          
          let lastTotalPfSafeValue = 0;

          if (totalKva > 0 && totalKw > 0)
            lastTotalPfSafeValue = (totalKw / totalKva * 100);
          else //make it not crash
            lastTotalPfSafeValue = 100;

          kwhSavings = parseFloat(project.kwhSavings) / (1 - parseFloat(project.kwhSavings));
          pfRatio = parseFloat(project.initialPf) / lastTotalPfSafeValue;
          I2RLossRatio = ((pfRatio * pfRatio - 1) * -1) * (5 / 100);
          kwh = parseFloat(project.avg15MinuteKva) * kwhSavings;
          I2RLossSavings = kwh / 60 * I2RLossRatio * parseFloat(project.kwhRate);
          savings = kwh / 60 * parseFloat(project.kwhRate) * (1 + parseFloat(project.taxRate)); 
          carbonSavings = kwh / 60 * (0.7054/1000);
          carbonSavingsValue = kwh / 60 * (0.7054/1000) * parseFloat(project.carbonCreditRate);
          
          Project.update({id: project.id}, {
            lastTotalPf: lastTotalPfSafeValue,
            totalAmpLoad: totalLoad,
          }).exec(function(err, updatedProject) {
            if (err) { console.log('.err.');return res.serverError(err); } 
            console.log("updated project");
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'today', valueType: 'I2RLossSavings'}).set({
            value: reportData.find(item => item.period == 'today' && item.valueType == 'I2RLossSavings' && item.type == 'project').value + I2RLossSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'week', valueType: 'I2RLossSavings'}).set({
            value: reportData.find(item => item.period == 'week' && item.valueType == 'I2RLossSavings' && item.type == 'project').value + I2RLossSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'I2RLossSavings'}).set({
            value: reportData.find(item => item.period == 'month' && item.valueType == 'I2RLossSavings' && item.type == 'project').value + I2RLossSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'I2RLossSavings'}).set({
            value: reportData.find(item => item.period == 'year' && item.valueType == 'I2RLossSavings' && item.type == 'project').value + I2RLossSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'I2RLossSavings'}).set({
            value: reportData.find(item => item.period == 'allTime' && item.valueType == 'I2RLossSavings' && item.type == 'project').value + I2RLossSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'totalSavings'}).set({
            value: reportData.find(item => item.period == 'year' && item.valueType == 'totalSavings' && item.type == 'project').value + savings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'totalSavings'}).set({
            value: reportData.find(item => item.period == 'allTime' && item.valueType == 'totalSavings' && item.type == 'project').value + savings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'carbonSavings'}).set({
            value: reportData.find(item => item.period == 'year' && item.valueType == 'carbonSavings' && item.type == 'project').value + carbonSavingsValue
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'carbonSavingsAmount'}).set({
            value: reportData.find(item => item.period == 'allTime' && item.valueType == 'carbonSavingsAmount' && item.type == 'project').value + carbonSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'kwh'}).set({
            value: reportData.find(item => item.period == 'month' && item.valueType == 'kwh' && item.type == 'project').value  + parseFloat(project.avg15MinuteKva * project.multiplier) / 60
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'week', valueType: 'kwh'}).set({
            value: reportData.find(item => item.period == 'week' && item.valueType == 'kwh' && item.type == 'project').value  + parseFloat(project.avg15MinuteKva * project.multiplier) / 60
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'today', valueType: 'kwh'}).set({
            value: reportData.find(item => item.period == 'today' && item.valueType == 'kwh' && item.type == 'project').value  + parseFloat(project.avg15MinuteKva * project.multiplier) / 60
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'kwhSavingsAmount'}).set({
            value: reportData.find(item => item.period == 'allTime' && item.valueType == 'kwhSavingsAmount' && item.type == 'project').value + parseFloat(project.avg15MinuteKva * project.multiplier) / 60 * kwhSavings
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'kwhSavings'}).set({
            value: reportData.find(item => item.period == 'allTime' && item.valueType == 'kwhSavings' && item.type == 'project').value + parseFloat(project.avg15MinuteKva * project.multiplier) / 60 * kwhSavings * project.kwhRate
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });
          ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'I2RLossSavingsAmount'}).set({
            value: reportData.find(item => item.period == 'allTime' && item.valueType == 'I2RLossSavingsAmount' && item.type == 'project').value + parseFloat(project.avg15MinuteKva * project.multiplier) / 60 * kwhSavings * I2RLossRatio
          }).meta({fetch: true}).exec(function(err, updatedProject) {
            if (err) {console.log('upload savings detail for project error ', project.id);} 
          });

          console.log("updated project reportData");

          });
          
        });
      });

      let curTime = (new Date()).getTime();
      let startTime = curTime;
      let endTime = curTime;
      let testRunning = false;
      Test.find({
          project: project.id,
          startAt: { '<=': curTime },
          endAt: { '>=': curTime },
          isDeleted: false
      })
      .exec(function(err, tests) {
        console.log('looked at Tests');
        if (err) {console.log('err3'); return res.serverError(err);}

        // If a test is running, need to check status of each switch vs expected,
        // and if not a match, send switch cmd to switch NOW
        if (tests.length > 0) {
          async.eachLimit(tests, 1, function(test, nextTest) {
            startTime = test.startAt;
            endTime = test.endAt;
            console.log('Test is Running');
	    let allSwitchesSet = true;
	    console.log("allSwitchesSet = true");

            sails.helpers.web.findAndFormatRecords({
              model: Switch,
              selectClause: ['id', 'name', 'lastCommunicatedAt', 'meshLastCommunicatedAt', 'deviceId', 'hasSchedule', 'deviceType', 'gateway', 'meshIp'],
              whereClause: {
                project: project.id,
                deviceType: 1,
                isDeleted: false,
                lastCommunicatedAt: {'>': curTime - 3600000}
              },
              pageSize: 500,
              page: 1
            }).exec({
              success: function(report) {
                console.log('Ran Report');
                // Test the state of the switch based on piboard
                PiBoard.find({
                  deviceId: { in: _.pluck(report.response, 'deviceId') }
                })
                .exec(function(err, piboards) {
                    //console.log('found deviceId');
                    if (err) {
                      console.log("Error finding piboards:", err);
                      return nextTest(err);
                    }

                    let status = 'Undefined';
                    let devId = 'Undefined';
                    report.response = report.response.map(switchItem => {
                      let piboard = _.find(piboards, function(item) { return item.deviceId === switchItem.deviceId; });
                      //console.log('found piboard');
                      devId = switchItem.deviceId;

                      if (piboard) {
                        console.log ("switch " + devId);
                        // Switch statuses are actually reversed
                        status = piboard.switchState ? 1 : 0;
                        console.log ("switch " + devId + " state is " + status);

                        let onOffTime = (curTime - startTime) % 10800000;

                        if (onOffTime < 7200000 && onOffTime > 60000 && status == 0) {
                          console.log ("switch " + devId + " should be off");
			  allSwitchesSet = false;
	    		  console.log("allSwitchesSet = false");
                          // send switch command

                          /*SwitchCommand.create({
                            project: project.id,
                            commandType: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF,
                            startAt: curTime,
                            switches: switchItem.id,
                            deviceType: 1, 
                          }).meta({fetch: true}).exec(function(err, onSwitchCommand) {
                            if (err) { console.log ("waherror: " + err); return res.serverError(err); }

                            var switchesArray = [];
                            switchesArray.push(switchItem.id);
                            //switchesArray.push(0);
                            async.eachSeries(switchesArray, function(switchId, nextSwitch) {

                              console.log("switchId : " + switchId);
                              /*if (switchId != 0) {
                                setTimeout(function() {
                                  sails.helpers.devices.sendSwitchCommand({
                                    projectSlug: project.slug,
                                    time: onSwitchCommand.startAt,
                                    command: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF,
                                    switchId: switchItem.id,
                                    switchCommandId: onSwitchCommand.id,
                                    scheduleId: 'x-' + onSwitchCommand.id
                                  }).exec(nextSwitch);
                                    //console.log ("hi: ");
                                }, 50);
                              }
                            }, function(err) {
                              if (err) {
                                    // TODO -- notify the front-end of any errors.
                                SwitchCommand.update({ id: onSwitchCommand.id }, { isCancelled: true }).exec(function() {
                                  // Note that we don't handle db error here; we might as well still try and cancel
                                  // the hardware commands.
                                  sails.helpers.devices.cancelSwitchSchedule({
                                    scheduleId: 'x-' + onSwitchCommand.id
                                  }).exec(function noop() {
                                    console.log ("hoo");
                                    // TODO -- notify the front-end of any errors.
                                  });
                                });
                              }
                            });
                          });*/
                        } else if (onOffTime > 7260000 && status == 1) {
                          console.log ("switch " + devId + " should be on");
			  allSwitchesSet = false;
	    		  console.log("allSwitchesSet = false");
                          // send switch command
                         /* SwitchCommand.create({
                            project: project.id,
                            commandType: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON,
                            startAt: curTime,
                            switches: switchItem.id,
                            deviceType: 1, 
                          }).meta({fetch: true}).exec(function(err, onSwitchCommand) {
                            if (err) { console.log ("waherror: " + err); return res.serverError(err); }

                            var switchesArray = [];
                            switchesArray.push(switchItem.id);
                            switchesArray.push(0);
                            async.eachSeries(switchesArray, function(switchId, nextSwitch) {

                              console.log("switchId : " + switchItem.id);
                              /*setTimeout(function() {
                                sails.helpers.devices.sendSwitchCommand({
                                  projectSlug: project.slug,
                                  time: onSwitchCommand.startAt,
                                  command: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON,
                                  switchId: switchItem.id,
                                  switchCommandId: onSwitchCommand.id,
                                  scheduleId: 'x-' + onSwitchCommand.id
                                }).exec(nextSwitch);
                                  //console.log ("hi: ");
                              }, 50);
                            }, function(err) {
                              if (err) {
                                    // TODO -- notify the front-end of any errors.
                                SwitchCommand.update({ id: onSwitchCommand.id }, { isCancelled: true }).exec(function() {
                                  // Note that we don't handle db error here; we might as well still try and cancel
                                  // the hardware commands.
                                  sails.helpers.devices.cancelSwitchSchedule({
                                    scheduleId: 'x-' + onSwitchCommand.id
                                  }).exec(function noop() {
                                    console.log ("hoo");
                                    // TODO -- notify the front-end of any errors.
                                  });
                                });
                              }
                            });
                          });*/
                        }

                      }
                    });
                    //console.log ("test startAt " + startTime + " test endAt " + endTime);
                    
                    // Update test after processing all switches
                    if (allSwitchesSet) {
                      // All switches are set for this interval
                      console.log("allSwitchesSet = true, updating Test");
                      console.log("test.allswitchesset: ", test.allswitchesset, ", test.id: " , test.id);

                      if (test.allswitchesset == null) {
                        console.log("trying to update test, first interval " , curTime);
                        Test.update( { id: test.id }, {allswitchesset: curTime }).exec(function(err) {
                          if (err) {
                            console.log("Error updating test:", err);
                          } else {
                            console.log("updated Test");
                          }
                          return nextTest(); // Continue to next test
                        });
                      } else {
                        console.log("trying to update test, " , curTime);
                        Test.update( { id: test.id }, {allswitchesset: test.allswitchesset + ", " + curTime }).exec(function(err) {
                          if (err) {
                            console.log("Error updating test:", err);
                          } else {
                            console.log("updated Test");
                          }
                          return nextTest(); // Continue to next test
                        });
                      }
                    } else {
                      console.log("allSwitchesSet = false, updating Test");
                      Test.update( { id: test.id }, {allswitchesset: test.allswitchesset + ", 0" }).exec(function(err) {
                        if (err) {
                          console.log("Error updating test:", err);
                        } else {
                          console.log("updated Test");
                        }
                        return nextTest(); // Continue to next test
                      });
                    }
                  });
              },
              error: function (err) {
                console.log("error occurred here");
                return nextTest(err); // Continue to next test even on error
              },
              badRequest: function(err){
                console.log("error occurred here2");
                return nextTest(err); // Continue to next test even on error
              }
            });
          });
        }
      });
      return nextProject();
    }, function doneRollingUp(err) {
      if (err) { return res.serverError(err); }

      return res.ok();
    });
  });
};
