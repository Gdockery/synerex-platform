var Moment = require('moment-timezone');
var async = require('async');

module.exports = function doDailySavings(req, res) {
  var sails = req._sails;
  var datastore = sails.getDatastore('default');
  console.log('initiate savings Project calculation-rollup------------------------------');
  Project.find({ isDeleted: false }).exec(function(err, projects) {
    async.eachLimit(projects, 1, function(project, nextProject) {
      console.log('initiate calculation for project: ', project.id);
       Meter.find({ isDeleted: false, isMain: true, project: project.id}).exec(function(err, meters) {
        if (err) { console.log("meter error", err); return exits.error(err); }
        if (meters.length == 0) {return nextProject();}

        Switch.find({isDeleted: false, project: project.id, lastCommunicatedAt: {'>': 0}, deviceType: 2}).exec(function(err, schedulers) {
          if (err) { return res.serverError(err); }
          ReportData.find({project: project.id}).exec(function(err, reportData) {
            if (err) { console.log("meter error", err); return exits.error(err); }
            if (reportData.length == 0) {return nextProject();}

            let now = Moment.tz(new Moment(), project.timeZoneId);
            let daysInMonth = Moment(now).daysInMonth();  
            let today = Moment(now);
            let yesterday = Moment(now).subtract(1, 'day');
            let newWeek = yesterday.startOf('week').isSame(today.startOf('week')) ? false : true;
            console.log("Is this a new week? ", newWeek);
            let newMonth = yesterday.startOf('month').isSame(today.startOf('month')) ? false: true;
            console.log("Is this a new month? ", newMonth);
            let newYear = yesterday.startOf('year').isSame(today.startOf('year')) ? false : true;
            console.log("Is this a new year? ", newYear);

            ReportData.update({type: 'project', typeId: project.id, period: 'today', valueType: 'kwh'}).set({
              value: 0, 
            }).meta({fetch: true}).exec(function(err, updatedProject) {
              if (err) {console.log('upload savings detail for project error ', project.id);} 
            });
            ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'kwhSavings'}).set({
              value: reportData.find(item => item.period == 'allTime' && item.valueType == 'kwhSavings' && item.type == 'project').value + (project.avg15MinuteKva * 24 * project.kwhSavings  * project.kwhRate)
            }).meta({fetch: true}).exec(function(err, updatedProject) {
              if (err) {console.log('upload savings detail for project error ', project.id);} 
            });
            ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'kwhSavingsAmount'}).set({
              value: reportData.find(item => item.period == 'allTime' && item.valueType == 'kwhSavingsAmount' && item.type == 'project').value + (project.avg15MinuteKva * 24 * project.kwhSavings ) 
            }).meta({fetch: true}).exec(function(err, updatedProject) {
              if (err) {console.log('upload savings detail for project error ', project.id);} 
            });
            ReportData.update({type: 'project', typeId: project.id, period: 'today', valueType: 'I2RLoss'}).set({
              value: 0
            }).meta({fetch: true}).exec(function(err, updatedProject) {
              if (err) {console.log('upload savings detail for project error ', project.id);}
              console.log("updated project for day");
            });

            async.eachLimit(meters, 1, function(meter, nextMeter) {
              ReportData.update({type: 'meter', typeId: meter.id, period: 'today', valueType: 'kwh'}).set({
                value: 0, 
              }).meta({fetch: true}).exec(function(err, updatedMeter){
                if (err) {console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);}
              });
              ReportData.update({type: 'meter', typeId: meter.id, period: 'today', valueType: 'I2RLoss'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedMeter){
                if (err) {
                  console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                }
              });
              return nextMeter();

            }, function(err) {if (err) {console.log("failed to calculate savings for ", project.id);}});

            async.eachLimit(schedulers, 1, function(scheduler, nextScheduler) {
              ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'today', valueType: 'kwh'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', scheduler.id);} 
              });
              ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'today', valueType: 'totalCost'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ',scheduler.id);} 
              });
              return nextScheduler();
            });
        
            if (newWeek) {
              ReportData.update({type: 'project', typeId: project.id, period: 'week', valueType: 'kwh'}).set({
                value: 0, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'week', valueType: 'I2RLoss'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
              });

              async.eachLimit(meters, 1, function(meter, nextMeter) {
                ReportData.update({type: 'meter', typeId: meter.id, period: 'week', valueType: 'kwh'}).set({
                  value: 0, 
                }).meta({fetch: true}).exec(function(err, updatedMeter){
                  if (err) {
                    console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                  }
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'week', valueType: 'I2RLoss'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedMeter){
                  if (err) {
                    console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                  }
                });
                return nextMeter();

              }, function(err) {
                if (err) {console.log("failed to calculate meter savings for ", project.id);}
              });

              async.eachLimit(schedulers, 1, function(scheduler, nextScheduler) {
                ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'week', valueType: 'totalCost'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ',scheduler.id);} 
                });
                return nextScheduler();
              });

            } 

            let kwhSavings, kwPeakSavings, monthSavings, monthKwh, monthPeak;
            
            if (newMonth) {
              monthKwh = reportData.find(item => item.period == 'month' && item.valueType == 'kwh' && item.type == 'project').value;
              monthPeak = reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.type == 'project').value;
              kwhSavings = project.kwhSavings ;
              kwPeakSavings = project.kwPeakSavings;
              monthSavings = (monthKwh * kwhSavings * project.kwhRate) * (1 + project.taxRate) + (monthPeak * kwPeakSavings * project.kwRate);
              monthBudget = (monthKwh * (1 - project.kwhSavings) * project.kwhRate) * (1 + project.taxRate) + (monthPeak * (1 - project.kwPeakSavings) * project.kwRate) * (1 + project.taxRate);

              ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'kwh'}).set({
                value: 0, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'peak'}).set({
                value: avg15MinuteKva,
                description: now.format('YYYY/MM/DD h:mm:ss a').toString(),
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastMonth', valueType: 'totalSavings'}).set({
                value: monthSavings, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastMonth', valueType: 'totalCost'}).set({
                value: monthBudget, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastMonth', valueType: 'peak'}).set({
                value: monthPeak, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastMonth', valueType: 'kwh'}).set({
                value: monthKwh, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'totalSavings'}).set({
                value: reportData.find(item => item.period == 'year' && item.valueType == 'totalSavings' && item.type == 'project').value + monthSavings, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'totalSavings'}).set({
                value: reportData.find(item => item.period == 'allTime' && item.valueType == 'totalSavings' && item.type == 'project').value + monthSavings, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'I2RLossSavings'}).set({
                value: 0, 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastMonth', valueType: 'I2RLossSavings'}).set({
                value: reportData.find(item => item.period == 'month' && item.valueType == 'I2RLossSavings' && item.type == 'project').value 
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'peakSavings'}).set({
                value: reportData.find(item => item.period == 'allTime' && item.valueType == 'peakSavings' && item.type == 'project').value 
                + monthPeak * kwPeakSavings * project.kwRate 
                + reportData.find(item => item.period == 'month' && item.valueType == 'pfc' && item.type == 'project').value
                + reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.type == 'project').value * project.kwRate * kwPeakSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'allTime', valueType: 'peakSavingsAmount'}).set({
                value: reportData.find(item => item.period == 'allTime' && item.valueType == 'peakSavingsAmount' && item.type == 'project').value + monthPeak * kwPeakSavings
                + reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.type == 'project').value * kwPeakSavings
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastMonth', valueType: 'pfc'}).set({
                value: reportData.find(item => item.period == 'month' && item.valueType == 'pfc' && item.type == 'project').value
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'month', valueType: 'pfc'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
                console.log('uploaded savings detail of new day for project ', project.id, project.name);  
              });



              async.eachLimit(meters, 1, function(meter, nextMeter) {
                monthKwh = reportData.find(item => item.period == 'month' && item.valueType == 'kwh' && item.typeId == meter.id && item.type == 'meter').value;
                monthPeak = reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.typeId == meter.id && item.type == 'meter').value;
                kwhSavings = meter.kwhSavings / (1 - meter.kwhSavings);
                kwPeakSavings = meter.kwPeakSavings / (1 - meter.kwPeakSavings);
                monthSavings = (monthKwh * kwhSavings * project.kwhRate) * (1 + project.taxRate) + (monthPeak * kwPeakSavings * project.kwRate) ;
                monthBudget = (monthKwh * (1 / meter.kwhSavings) * project.kwhRate) * (1 + project.taxRate) + (monthPeak * 1 / meter.kwPeakSavings * project.kwRate);
             
                
                ReportData.update({type: 'meter', typeId: meter.id, period: 'month', valueType: 'kwh'}).set({
                  value: meter.lastTotalKva
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'month', valueType: 'peak'}).set({
                  value: meter.lastTotalKva, description: now.format('YYYY/MM/DD h:mm:ss a').toString()
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastMonth', valueType: 'totalSavings'}).set({
                  value: monthSavings
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastMonth', valueType: 'peak'}).set({
                  value: monthPeak
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastMonth', valueType: 'peak'}).set({
                  value: monthPeak
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastMonth', valueType: 'totalCost'}).set({
                  value: monthBudget
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastMonth', valueType: 'kwh'}).set({
                  value: monthKwh
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'year', valueType: 'totalSavings'}).set({
                  value: reportData.find(item => item.period == 'year' && item.valueType == 'totalSavings' && item.type == 'meter' && item.typeId == meter.id).value + monthSavings
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'allTime', valueType: 'totalSavings'}).set({
                  value: reportData.find(item => item.period == 'allTime' && item.valueType == 'totalSavings' && item.type == 'meter' && item.typeId == meter.id).value + monthSavings
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastMonth', valueType: 'I2RLossSavings'}).set({
                  value: reportData.find(item => item.period == 'month' && item.valueType == 'I2RLossSavings' && item.type == 'meter' && item.typeId == meter.id).value 
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'month', valueType: 'I2RLossSavings'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });

                return nextMeter();

              }, function(err) {
                if (err) {console.log("failed to calculate savings for ", project.id);}
              });
              
              async.eachLimit(schedulers, 1, function(scheduler, nextScheduler) {
                ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'month', valueType: 'totalCost'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ',scheduler.id);} 
                });
                return nextScheduler();
              });
            }


            if (newYear) {

              ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'totalSavings'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastYear', valueType: 'totalSavings'}).set({
                value: reportData.find(item => item.period == 'year' && item.valueType == 'totalSavings' && item.type == 'project').value
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);} 
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'I2RLossSavings'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'lastYear', valueType: 'I2RLossSavings'}).set({
                value: reportData.find(item => item.period == 'year' && item.valueType == 'I2RLossSavings' && item.type == 'project').value
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
              });
              ReportData.update({type: 'project', typeId: project.id, period: 'year', valueType: 'carbonSavings'}).set({
                value: 0
              }).meta({fetch: true}).exec(function(err, updatedProject) {
                if (err) {console.log('upload savings detail for project error ', project.id);}
              });

              async.eachLimit(meters, 1, function(meter, nextMeter) {
                ReportData.update({type: 'meter', typeId: meter.id, period: 'year', valueType: 'totalSavings'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);}
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastYear', valueType: 'totalSavings'}).set({
                  value: reportData.find(item => item.period == 'year' && item.valueType == 'totalSavings' && item.type == 'meter').value
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', project.id);}    
                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'year', valueType: 'I2RLossSavings'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedProject) {

                });
                ReportData.update({type: 'meter', typeId: meter.id, period: 'lastYear', valueType: 'I2RLossSavings'}).set({
                  value: reportData.find(item => item.period == 'year' && item.valueType == 'I2RLossSavings' && item.type == 'meter').value
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ', meter.id);} 
                });
                return nextMeter();

              }, function(err) {
                if (err) {console.log("failed to calculate savings for ", project.id);}
              });

              async.eachLimit(schedulers, 1, function(scheduler, nextScheduler) {
                ReportData.update({type: 'scheduler', typeId: scheduler.id, period: 'year', valueType: 'totalCost'}).set({
                  value: 0
                }).meta({fetch: true}).exec(function(err, updatedProject) {
                  if (err) {console.log('upload savings detail for project error ',scheduler.id);} 
                });
                return nextScheduler();
              });
            }
          });
        });
      });
      return nextProject();
    }, function(err) {
      if (err) {return res.serverError(err);}

      return res.ok();
    });
  });
}

