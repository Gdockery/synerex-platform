var Moment = require('moment-timezone');
var async = require('async');

module.exports = function doDailySavings(req, res) {
  var sails = req._sails;
  var datastore = sails.getDatastore('default');
  console.log('initiate savings Project calculation-calculate-savings.js------------------------------');
  Project.find({ isDeleted: false }).exec(function(err, projects) {
    async.eachLimit(projects, 1, function(project, nextProject) {
      console.log('initiate calculation for project: ', project.id, " ", project.name);
      let now = Moment.tz(new Moment(), project.timeZoneId);
      let thisMonth = Moment(now).format('MM').toString();
      let lastMonth =  Moment(now).subtract(1, 'month').format('MM').toString();
      let lastMonthYear = Moment(now).subtract(1, 'month').format('YYYY').toString();
      let currentYear = Moment(now).format('YYYY').toString();
      let lastYear =  Moment(now).subtract(1, 'year').format('YYYY').toString();
      let daysInMonth = Moment(now).daysInMonth(); 
      let today = '\'' + Moment(now).startOf('day').format('YYYY-MM-DD') + '\'';
      // Calculate week start (Sunday = 0)
      var dayOfWeek = now.day();
      var daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
      var weekStartMoment = Moment(now).subtract(daysToSunday, 'days').startOf('day');
      let weekStart = weekStartMoment.format('YYYY-MM-DD');
      let weekEnd = Moment(now).add(6 - dayOfWeek, 'days').endOf('day').format('YYYY-MM-DD');
      let weekDiff = Moment.duration(now.diff(weekStartMoment)).asHours();
      let monthDiff = Moment.duration(now.diff(Moment(now).startOf('month'))).asHours();
      let dayDiff = Moment.duration(now.diff(Moment(now).startOf('day'))).asHours();
      let monthStart = Moment(now).startOf('month').format('YYYY-MM-DD');
      let monthEnd = Moment(now).endOf('month').format('YYYY-MM-DD');
      let hours = Moment(now).format('HH');
      
      let projectTotalPeaks = 0;
      let yearTotalPeaks = 0;
      let currentMonthKwh = 0;
      let remainingPeaks = 0;
      let allKwPeaks = [];
      let lastYearTotalPeaks = 0; 
      let yearTotalKwh = 0;
      let lastYearTotalKwh = 0;
      let lastMonthAvgKw = 0;
      let lastMonthKwh = 0;
      let remainingKwh = 0;
      let totalKwh = 0;
      let currentMonthPeak = 0;
      let lastMonthPeak = 0;
      let currentMonthAvgKw = 0;
      let projectTotalKwh = 0;

      let kwhSavings, kwPeakSavings;
      let pfRatio, I2RLossRatio, kwh;
      var SQL, SQL2, SQL3, currentMonthPeakTime, TODAY_SQL;
      let weekAvgKw, todayKw;
      var hoursInMonth;

      Meter.find({ isDeleted: false, project: project.id, isMain: true, lastCommunicatedAt: {'>': 0}}).exec(function(err, meters) {
        console.log("meters length,", meters.length)
        if (err) { console.log("meter error", err); return exits.error(err); }
        if (meters.length == 0) {
          return nextProject();
        }

        async.eachLimit(meters, 1, function(meter, nextMeter) {
          console.log(meter.id);
     
          SQL = 'SELECT AVG(avgKw) AS weekAvgKw ' + 'FROM permeterdataaggregate where meter = ' + meter.id 
                  + ' AND day >= \'' + weekStart + '\' AND day <= \'' + weekEnd + '\'';

          weekAvgKw = 0;

          let meterId = meter.id.toString();
          sails.helpers.web.test.calculateTestResults({
              testId: project.selectedTest,
              meters: meterId,
          }).exec(function(err, results) {

          
          // Find all rolled-up days in the given period, grouped by year+month.
            sails.getDatastore().sendNativeQuery(SQL).exec(function(err, result) {
              if (err) { return exits.error(err); }
              if (result.rows.length == 0) {
                weekAvgKw = 0;
              } else {
                weekAvgKw = result.rows[0].weekAvgKw;
              }

              // Filter by project.startDate to only include data from installation date onward
              var startDateFilter = project.startDate ? ' AND day >= \'' + project.startDate + '\'' : '';
              SQL2 = 'SELECT YEAR(day) as year, ' 
                    + 'MONTH(day) as month, ' 
                    + 'AVG(metersum.sumKva) as avgKva, ' 
                    + 'MAX(metersum.sumKva) as peak FROM ' 
                    + '(SELECT AVG(avgKva) as sumKva, ' 
                    + 'intervalId, day FROM permeterdataaggregate '  
                    + 'WHERE meter = ' + meter.id
                    + startDateFilter
                    + ' GROUP BY intervalId, day) as metersum '
                    + 'GROUP BY year DESC, month DESC';


              sails.getDatastore().sendNativeQuery(SQL2).exec(function(err, result2) {
                if (err) { return exits.error(err); }
                if (result2.rows.length == 0) {
                  console.log("No data in permeterdataaggregate for meter:  ", meter.id);
                  return nextMeter();
                } else {
                  allKwPeaks.push(_.pluck(result2.rows, 'year'));
                  allKwPeaks.push(_.pluck(result2.rows, 'month'));
                  allKwPeaks.push(_.pluck(result2.rows, 'peak'));
                  allKwPeaks.push(_.pluck(result2.rows, 'avgKva'));

                  console.log("here after result rows");
                
                  hoursInMonth = 0;
                  for (var i = 0; i < allKwPeaks[0].length; i++){ //without current month
                  //get number of hours in month
                    if (parseInt(allKwPeaks[1][i]) == 2){
                      hoursInMonth = 28 * 24;
                    } else if (parseInt(allKwPeaks[1][i]) == 4 || parseInt(allKwPeaks[1][i]) == 6 || parseInt(allKwPeaks[1][i]) == 9 || parseInt(allKwPeaks[1][i]) == 11){
                      hoursInMonth = 30 * 24;
                    }else {
                      hoursInMonth = 31 * 24;
                    }
		    console.log("start months",i,hoursInMonth);

                    //get last month kwh and last month
                    if (allKwPeaks[1][i] == parseInt(thisMonth) && parseInt(allKwPeaks[0][i]) == parseInt(currentYear)) {
                      currentMonthPeak = allKwPeaks[2][i]; 
                      currentMonthKwh = allKwPeaks[3][i] * monthDiff;
                      currentMonthAvgKw = allKwPeaks[3][i];

                    } else if (allKwPeaks[1][i] == parseInt(lastMonth) && parseInt(allKwPeaks[0][i]) == parseInt(lastMonthYear)) {
                      // Check if last month is on or after project start date
                      var lastMonthDateStr = lastMonthYear + '-' + (parseInt(lastMonth) < 10 ? '0' : '') + lastMonth + '-01';
                      var lastMonthDate = Moment(lastMonthDateStr);
                      var shouldIncludeLastMonth = !project.startDate || lastMonthDate.isSameOrAfter(Moment(project.startDate).startOf('month'));
                      
                      if (!shouldIncludeLastMonth) {
                        console.log('Skipping lastMonth ' + lastMonthDateStr + ' (before project startDate ' + project.startDate + ')');
                        lastMonthPeak = 0;
                        lastMonthKwh = 0;
                        lastMonthAvgKw = 0;
                      } else {
                        lastMonthPeak = allKwPeaks[2][i];
                        lastMonthKwh = allKwPeaks[3][i] * monthDiff;
                        lastMonthAvgKw = allKwPeaks[3][i];
                      }
                    } 
		    console.log("currentMonthKwh",currentMonthKwh);
		    console.log("lastMonthKwh",lastMonthKwh);

                    // Check if this month is on or after project start date
                    var monthDateStr = allKwPeaks[0][i] + '-' + (allKwPeaks[1][i] < 10 ? '0' : '') + allKwPeaks[1][i] + '-01';
                    var monthDate = Moment(monthDateStr);
                    var shouldInclude = !project.startDate || monthDate.isSameOrAfter(Moment(project.startDate).startOf('month'));
                    
                    if (!shouldInclude) {
                      // Skip months before project start date
                      console.log('Skipping month ' + monthDateStr + ' (before project startDate ' + project.startDate + ')');
                    } else if (parseInt(allKwPeaks[0][i]) == parseInt(currentYear)) {
                        yearTotalPeaks += allKwPeaks[2][i]; 
                        yearTotalKwh += allKwPeaks[3][i] * hoursInMonth;
                    } else if (parseInt(allKwPeaks[0][i]) == parseInt(lastYear)) {
                        // Only include lastYear data if the month is actually in the last year AND after project start
                        var lastYearStart = Moment(now).subtract(1, 'year').startOf('year');
                        if (monthDate.isSameOrAfter(lastYearStart) && monthDate.isBefore(Moment(now).startOf('year'))) {
                          lastYearTotalPeaks += allKwPeaks[2][i];
                          lastYearTotalKwh += allKwPeaks[3][i] * hoursInMonth;
                        }
                    } else {
                        remainingPeaks += allKwPeaks[2][i];
                        remainingKwh += allKwPeaks[3][i] * hoursInMonth;
                    }
		    console.log("yearTotalPeaks",yearTotalPeaks);
		    console.log("yearTotalKwh",yearTotalKwh);
		    console.log("lastYearTotalPeaks",lastYearTotalPeaks);
		    console.log("lastYearTotalKwh",lastYearTotalKwh);
		    console.log("remainingPeaks",remainingPeaks);
		    console.log("remainingKwh",remainingKwh);
                  }

                  yearTotalPeaks = yearTotalPeaks - currentMonthPeak;
                  yearTotalKwh = yearTotalKwh - currentMonthKwh;
		    console.log("yearTotalPeaks",yearTotalPeaks);
		    console.log("yearTotalKwh",yearTotalKwh);
                 
                  projectTotalPeaks = yearTotalPeaks + lastYearTotalPeaks + remainingPeaks;
                  projectTotalKwh = yearTotalKwh + lastYearTotalKwh + remainingKwh;
		    console.log("projectTotalPeaks",yearTotalPeaks);
		    console.log("projectTotalKwh",yearTotalKwh);
                }

                console.log("done peaks");

                 SQL3 = 'SELECT metersum.intervalStartTime as intervalStartTime FROM '
                  + '(SELECT SUM(avgKva) as sumKva, intervalId, day, MAX(intervalStartTime) as intervalStartTime ' 
                  + 'FROM permeterdataaggregate WHERE meter = ' + meter.id + ' AND day >= \'' + monthStart + '\' AND day <= \'' + monthEnd + '\' GROUP BY intervalId, day) as metersum '
                  + 'WHERE metersum.sumKva = ' + currentMonthPeak ;

                TODAY_SQL = 'SELECT AVG(avgKva) as avgKva ' 
                  + 'FROM permeterdataaggregate WHERE meter = ' +  meter.id  + ' AND day = ' + today;

                console.log(SQL3, TODAY_SQL);

                sails.getDatastore().sendNativeQuery(SQL3).exec(function(err, res) {
                  if (err) { console.log("err: ", err);  return exits.error(err); }
                    sails.getDatastore().sendNativeQuery(TODAY_SQL).exec(function(err, today_res) {
                      if (err) { console.log("err2: ", err); return exits.error(err); }
                      todayKw = 0
                      if (today_res.rows.length == 0) {
                        todayKw = 0;
                      } else {
                        todayKw = today_res.rows[0].avgKva;
                      } 

                      console.log("today kva", todayKw);
                      //console.log(res.rows);
                      if (res.rows.length != 0){
                        currentMonthPeakTime = Moment.tz(new Moment(res.rows[0].intervalStartTime),project.timeZoneId).format('YYYY/MM/DD h:mm:ss a');
                        console.log("has peak");
                      } else {
                        currentMonthPeakTime = "No data for this month, peak for last month";
                        console.log("no peak");
                      }  

                      console.log(currentMonthPeakTime);

                      if (meter.lastTotalPf == 0){
                        meter.lastTotalPf = 1;
                      }
                      console.log("meter.lastTotalPf = " , meter.lastTotalPf);

                      pfRatio = project.initialPf / meter.lastTotalPf;
                      I2RLossRatio = ((pfRatio * pfRatio - 1) * -1) * (5 / 100);
                      console.log("pfRatio = " , pfRatio);
                      console.log("results = " , results);

		      if (results === undefined) {
			console.log("results is undefined");
                        kwPeakSavings = 0;
                        kwhSavings = 0;
                      } else {
			console.log("results is not undefined");
			if (results.percentSaved.kwPeak == 1) {
                            results.percentSaved.kwPeak = 0;
                      	} else {
                            kwPeakSavings = results.percentSaved.kwPeak / (1 - results.percentSaved.kwPeak);
                      	}
                      	if (results.percentSaved.kwh == 1) {
                            results.percentSaved.kwh = 0;
                      	} else {
                            kwhSavings = results.percentSaved.kwh / (1 - results.percentSaved.kwh);
                     	}
		      }
                      console.log("kwPeakSavings = " , kwPeakSavings);

                      //kwhSavings = results.percentSaved.kwh / (1 - results.percentSaved.kwh);
                      //kwPeakSavings = results.percentSaved.kwPeak / (1 - results.percentSaved.kwPeak);

                      //console.log("meter: ", meter.id, " ", results.percentSaved.kwh, results.percentSaved.kwPeak);
                      console.log("meter: ", meter.id, " ", kwhSavings, kwPeakSavings);
                      console.log("I2RLossRatio ", I2RLossRatio);
                      console.log(yearTotalKwh, yearTotalPeaks, projectTotalKwh, projectTotalPeaks);

                      console.log("here report meters");

                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'week', valueType: 'kwh', value: weekAvgKw * weekDiff, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);}
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'today', valueType: 'kwh', value: todayKw * dayDiff, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);}
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'month', valueType: 'avgKva', value: currentMonthAvgKw, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);}
                      });

                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'month', valueType: 'kwh', value: currentMonthKwh, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                       
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'month', valueType: 'peak', value: currentMonthPeak, description: currentMonthPeakTime}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                       
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastMonth', valueType: 'kwh', value: lastMonthKwh, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                       
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastMonth', valueType: 'peak', value: lastMonthPeak, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                       
                      });
		      if (results === undefined) {
			console.log("meter lastMonth created with 0 because results undefined");
                      	ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastMonth', valueType: 'totalCost', description: '',value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
                          if (err) {
                            console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                          }
                        });
		      } else {
                      	ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastMonth', valueType: 'totalCost', description: '',value: lastMonthKwh * project.kwhRate * (1 / (1 - results.percentSaved.kwh)) * (1 + project.taxRate) + (lastMonthPeak * (1 / (1 - results.percentSaved.kwPeak)) * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                          if (err) {
                            console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                          }
                        });
		      }
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastMonth', valueType: 'totalSavings', description: '', value: lastMonthKwh * project.kwhRate * kwhSavings * (1 + project.taxRate) + (lastMonthPeak * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'year', valueType: 'totalSavings', description: '', value: yearTotalKwh * project.kwhRate * kwhSavings * (1 + project.taxRate) + (yearTotalPeaks * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastYear', valueType: 'totalSavings', description: '', value: lastYearTotalKwh * project.kwhRate * kwhSavings * (1 + project.taxRate) + (lastYearTotalPeaks * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });

                      console.log("middle meteers update");
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastYear', valueType: 'totalSavings', description: '', value: lastYearTotalKwh * project.kwhRate * kwhSavings * (1 + project.taxRate) + (lastYearTotalPeaks * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'allTime', valueType: 'totalSavings', description: '', value: projectTotalKwh * project.kwhRate * kwhSavings * (1 + project.taxRate) + (projectTotalPeaks * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'today', valueType: 'I2RLossSavings', description: '', value: todayKw * dayDiff * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'week', valueType: 'I2RLossSavings', description: '', value: weekAvgKw * weekDiff * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'month', valueType: 'I2RLossSavings', description: '', value: currentMonthKwh * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastMonth', valueType: 'I2RLossSavings', description: '', value: lastMonthKwh * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'year', valueType: 'I2RLossSavings', description: '', value: yearTotalKwh * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'lastYear', valueType: 'I2RLossSavings', description: '', value: lastYearTotalKwh * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });
                      ReportData.create({type: 'meter', typeId: meter.id, project: project.id, period: 'allTime', valueType: 'I2RLossSavings', description: '', value: projectTotalKwh * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                        if (err) {
                          console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id);
                        }
                      });

		      if (results === undefined) {
                        console.log("Meter savings not updated, results was undefined");
		      } else {
                        Meter.update({id: meter.id}).set({
                          kwPeakSavings: results.percentSaved.kwPeak,
                          kwhSavings: results.percentSaved.kwh
                        }).meta({fetch: true}).exec(function(err, updatedMeter){
                          if (err) {console.log('[' + Moment().format() + '] upload savings detail for meter error ' + meter.id)};
                          console.log("updatedMeter details for ", meter.id)
                          return nextMeter();
                        });
		       }
                    });
                  });
                });
              });
            }); 
          }); 
        return nextProject();
        }); 
      
    }, function(err) {
      if (err) { console.log("err3: " , res.serverError(err)); return res.serverError(err);}
      return res.ok();
    });
  });
};

