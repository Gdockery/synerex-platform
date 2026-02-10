var Moment = require('moment-timezone');
var async = require('async');

module.exports = function doDailySavings(req, res) {
  var sails = req._sails;
  var datastore = sails.getDatastore('default');
  console.log('initiate savings Project calculation-calculate-project-savings.js ------------------------------');
  Project.find({ isDeleted: false }).exec(function(err, projects) {
    async.eachLimit(projects, 1, function(project, nextProject) {
      console.log('initiate calculation for project: ', project.id, " ", project.name);
      let now = Moment.tz(new Moment(), project.timeZoneId);
      // Calculate week start (Sunday = 0)
      var dayOfWeek = now.day();
      var daysToSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
      var weekStartMoment = Moment(now).subtract(daysToSunday, 'days').startOf('day');
      let weekDiff = Moment.duration(now.diff(weekStartMoment)).asHours();
      let monthDiff = Moment.duration(now.diff(Moment(now).startOf('month'))).asHours();
      let lastMonthDiff = Moment.duration(Moment(now).subtract(1, 'month').endOf('month').diff(Moment(now).subtract(1, 'month').startOf('month'))).asHours();
      let dayDiff = Moment.duration(now.diff(Moment(now).startOf('day'))).asHours();
      let thisMonth = Moment(now).format('MM').toString();
      let lastMonth =  Moment(now).subtract(1, 'month').format('MM').toString();
      let lastMonthYear = Moment(now).subtract(1, 'month').format('YYYY').toString();
      let currentYear = Moment(now).format('YYYY').toString();
      let lastYear =  Moment(now).subtract(1, 'year').format('YYYY').toString();
      let daysInMonth = Moment(now).daysInMonth(); 
      let today = '\'' + Moment(now).startOf('day').format('YYYY-MM-DD') + '\'';
      let weekStart = weekStartMoment.format('YYYY-MM-DD');
      let weekEnd = Moment(now).add(6 - dayOfWeek, 'days').endOf('day').format('YYYY-MM-DD');
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
      var SQL, SQL2;
      let weekAvgKw;

      Meter.find({ isDeleted: false, isMain: true, project: project.id}).exec(function(err, meters) {
        console.log("meters length,", meters.length)
        if (err) { console.log("meter error", err); return exits.error(err); }
        if (meters.length == 0) {
          return nextProject();
        }

        SQL = 'SELECT AVG(avgKva) AS weekAvgKw ' + 'FROM meterdataaggregate where project = ' + project.id + ' AND'
                + ' day >= \'' + weekStart + '\' AND day <= \'' + weekEnd + '\'';

        weekAvgKw = 0;

        sails.getDatastore().sendNativeQuery(SQL).exec(function(err, result) {

          if (err) { console.log("error", err); return nextProject(); }
          if (result.rows.length == 0) {
            weekAvgKw = 0;
          } else {
            weekAvgKw = result.rows[0].weekAvgKw;
          }

          // Filter by project.startDate to only include data from installation date onward
          var startDateFilter = project.startDate ? ' AND day >= \'' + project.startDate + '\'' : '';
          SQL2 = 'SELECT YEAR(day) as year, ' 
                  + 'MONTH(day) as month, ' 
                  + 'AVG(avgKva) as avgKva, ' 
                  + 'MAX(avgKva) as peak FROM meterdataaggregate WHERE project = '
                  + project.id  
                  + startDateFilter
                  + ' GROUP BY year DESC, month DESC';

          var START_DAY_SQL = 'SELECT day FROM meterdataaggregate WHERE project = ' +  project.id  + ' ORDER BY createdAt ASC limit 1';

          sails.getDatastore().sendNativeQuery(START_DAY_SQL).exec(function(err, start_day) {
            if (err) { return nextProject(); } 
            let firstDayYear = Moment(start_day.rows[0]).format('YYYY').toString();
            let firstDayMonth = Moment(start_day.rows[0]).format('MM').toString();

            if (parseInt(lastMonth) == parseInt(firstDayMonth) && parseInt(lastMonthYear) == parseInt(firstDayYear)) {
              lastMonthDiff =  Moment.duration(Moment(start_day.rows[0]).endOf('month').diff(Moment(start_day.rows[0]))).asHours();
            }

            if (parseInt(thisMonth) == parseInt(firstDayMonth) && parseInt(currentYear) == parseInt(firstDayYear)) {
              monthDiff =  Moment.duration(now.diff(Moment(start_day.rows[0]))).asHours();
            }

            // Check if project start is after week start (Sunday)
            var projectStartMoment = Moment(start_day.rows[0]);
            if( projectStartMoment > weekStartMoment) {
              weekDiff = Moment.duration(now.diff(projectStartMoment)).asHours();
            }

            sails.getDatastore().sendNativeQuery(SQL2).exec(function(err, result2) {
              if (err) { return nextProject(); }

              if (result2.rows.length == 0 || start_day.rows.length == 0){
                console.log("No data in meterdataaggregate for this project " );
                return nextProject();
              } else {
                allKwPeaks.push(_.pluck(result2.rows, 'year'));
                allKwPeaks.push(_.pluck(result2.rows, 'month'));
                allKwPeaks.push(_.pluck(result2.rows, 'peak'));
                allKwPeaks.push(_.pluck(result2.rows, 'avgKva'));
                
                var hoursInMonth = 0;
                console.log("started,this,last",thisMonth,lastMonth);
                for (var i = 0; i < allKwPeaks[0].length; i++){ //without current month
                  //get number of hours in month
                  if (parseInt(allKwPeaks[1][i]) == 2){
                    hoursInMonth = 28 * 24;
                  } else if (parseInt(allKwPeaks[1][i]) == 4 || parseInt(allKwPeaks[1][i]) == 6 || parseInt(allKwPeaks[1][i]) == 9 || parseInt(allKwPeaks[1][i]) == 11){
                    hoursInMonth = 30 * 24;
                  }else {
                    hoursInMonth = 31 * 24;
                  }
                  //get last month kwh and last month
                  if (allKwPeaks[1][i] == parseInt(thisMonth) && parseInt(allKwPeaks[0][i]) == parseInt(currentYear)) {
                    currentMonthPeak = allKwPeaks[2][i]; 
                    currentMonthKwh = allKwPeaks[3][i] * monthDiff;
                    currentMonthAvgKw = allKwPeaks[3][i];
                    yearTotalPeaks += currentMonthPeak; 
                    yearTotalKwh += currentMonthKwh;
                    console.log("currentMonthPeak",currentMonthPeak);
                    console.log("currentMonthKwh",currentMonthKwh);
                    console.log("currentMonthAvgKw",currentMonthAvgKw);

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
                      lastMonthKwh = allKwPeaks[3][i] * hoursInMonth;
                      lastMonthAvgKw = allKwPeaks[3][i];
                      if (parseInt(lastMonthYear) == parseInt(currentYear)) {
                        yearTotalPeaks += lastMonthPeak; 
                        yearTotalKwh += lastMonthKwh;
                      } else {
                        lastYearTotalPeaks += lastMonthPeak;
                        lastYearTotalKwh += lastMonthKwh;
                      }
                    }
                    console.log("lastMonthPeak",lastMonthPeak);
                    console.log("lastMonthKwh",lastMonthKwh);
                    console.log("lastMonthAvgKw",lastMonthAvgKw);
                  } else {
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
		 }
                    console.log("i, hoursInMonth",allKwPeaks[1][i], hoursInMonth);
                    console.log("yearTotalPeaks",yearTotalPeaks);
                    console.log("yearTotalKwh",yearTotalKwh);
                    console.log("lastYearTotalPeaks",lastYearTotalPeaks);
                    console.log("lastYearTotalKwh",lastYearTotalKwh);

                    console.log("projectTotalPeaks",yearTotalPeaks);
                    console.log("projectTotalKwh",yearTotalKwh);
                } // end for loop

/*
                if (parseInt(lastMonthYear) == parseInt(currentYear)) {
                  yearTotalKwh = yearTotalKwh + currentMonthKwh + lastMonthKwh;
                  yearTotalPeaks = yearTotalPeaks + currentMonthPeak + lastMonthPeak;
                } else {
                  yearTotalKwh = yearTotalKwh + currentMonthKwh;
                  yearTotalPeaks = yearTotalPeaks + currentMonthPeak;
                  lastYearTotalKwh = lastYearTotalKwh + lastMonthKwh;
                  lastYearTotalPeaks = lastYearTotalPeaks + yearTotalPeaks;
                }
*/
                projectTotalPeaks = yearTotalPeaks + lastYearTotalPeaks + remainingPeaks;
                projectTotalKwh = yearTotalKwh + lastYearTotalKwh + remainingKwh;
                    console.log("yearTotalPeaks",yearTotalPeaks);
                    console.log("yearTotalKwh",yearTotalKwh);
                    console.log("lastYearTotalPeaks",lastYearTotalPeaks);
                    console.log("lastYearTotalKwh",lastYearTotalKwh);
                    console.log("remainingPeaks",remainingPeaks);
                    console.log("remainingKwh",remainingKwh);

                    console.log("projectTotalPeaks",yearTotalPeaks);
                    console.log("projectTotalKwh",yearTotalKwh);
              }

              let reportsPfc = {year:[], month:[], pfc: []}; //pfc is 0 or negative
              let monthPfc = 0;
              let lastMonthPfc = 0;
              let yearPfc = 0;
              let lastYearPfc = 0;
              let projectPfc = 0;
              let taxPercent = 0;

              let billingRate = 0, avgRate = 0, kwMultiplier = 0, kwhMultiplier = 0;

              SavingsReport.find({project: project.id}).sort('createdAt DESC').exec(function(err, savingsReports) {
                if (err) { return nextProject(); }
                //Find rates, avg rate and whether has power credit when there is X (specified in line items in savings report)  
                if (savingsReports.length == 0 || !savingsReports[0].reportData.lineItems) {
                    kwMultiplier = 1;
                    kwhMultiplier = 1;
                    if (project.electricBillAnalysis ) {
                    //if there is no new bills entered use the initial bill analytics
                      project.electricBillAnalysis.lineItems.forEach(function(lineItem) {
                        if (lineItem.type == "kw"){
                          billingRate = parseFloat(lineItem.billingRate);
                        }
                        if (lineItem.type == "kwh" ){
                            avgRate = parseFloat(lineItem.billingRate);
                      
                        }
                        if (lineItem.type =="tax") {
                        //value added tax percentage
                          taxPercent += parseFloat(lineItem.cost) / parseFloat(project.electricBillAnalysis.billAmount);
                        }    
                      });
                    }
                  } else {
                    savingsReports[0].reportData.lineItems.forEach(function(lineItem){
                      if (lineItem.type == "kw" && lineItem.tierHours != "0" && lineItem.tierHours != 0 && lineItem.tierHours != "''" && lineItem.tierHours != ''){
                        billingRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                      }
                      if (lineItem.type == "kwh" && lineItem.tierHours != "0" && lineItem.tierHours != "''" && lineItem.tierHours != '' && lineItem.tierHours != 0){
                          avgRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                    
                      }
                      if (lineItem.type =="tax") {
                      //value added tax percentage
                        taxPercent += parseFloat(lineItem.cost) / parseFloat(savingsReports[0].reportData.totalBill);
                      }
                    });

                  savingsReports.forEach(function(report){
                    kwhMultiplier += report.reportData.kwhMultiplier ? report.reportData.kwhMultiplier : 1;
                    kwMultiplier += report.reportData.kwMultiplier ? report.reportData.kwMultiplier : 1;
                    reportsPfc.year.push(parseInt(report.month.substring(0, 4)));
                    reportsPfc.month.push(parseInt(report.month.substring(5, 7))); //get the year from month field
                    reportsPfc.pfc.push(parseFloat(report.reportData.pfc * -1 * 0.3)); //change pfc to positive
                  });

                  kwhMultiplier = kwhMultiplier / savingsReports.length;
                  kwMultiplier = kwMultiplier / savingsReports.length;

                  if (parseInt(thisMonth) == reportsPfc.month[0]) {
                    monthPfc = reportsPfc.pfc[0];
                  } 

                  if (parseInt(lastMonth) == reportsPfc.month[1]){
                    lastMonthPfc = reportsPfc.pfc[1];
                  } 
                  for (var i = 0; i < reportsPfc.year.length; i++){
                    if (reportsPfc.year[i] == parseInt(currentYear)){
                      yearPfc += reportsPfc.pfc[i];
                    } else if (reportsPfc.year[i] == parseInt(lastYear)) {
                      lastYearPfc += reportsPfc.pfc[i];
                    } else {
                      projectPfc += reportsPfc.pfc[i];
                    } 
                  }
                  projectPfc += lastYearPfc;
                  projectPfc += yearPfc;
                }

                var SQL3 = 'SELECT avgKva, intervalStartTime ' 
                    + 'FROM meterdataaggregate WHERE project = ' + project.id + ' AND avgKva = ' + currentMonthPeak + ' and day >= \'' + monthStart + '\' AND day <= \'' + monthEnd + '\'';

                var TODAY_SQL = 'SELECT AVG(avgKva) as avgKva ' 
                    + 'FROM meterdataaggregate WHERE project = ' +  project.id  + ' AND day = ' + today ;

                var currentMonthPeakTime;

                sails.getDatastore().sendNativeQuery(SQL3).exec(function(err, res) {
                  if (err) { return nextProject();}  
                  sails.getDatastore().sendNativeQuery(TODAY_SQL).exec(function(err, today_res) {
                    if (err) { return nextProject(); } 

                    let todayKw; 
                    if (today_res.rows.length == 0) {
                      todayKw = 0;
                    } else {
                      todayKw = today_res.rows[0].avgKva;
                    }
		    console.log("todayKw:", todayKw);
       
                    if (res.rows.length != 0) {
                      currentMonthPeakTime = Moment.tz(new Moment(res.rows[0].intervalStartTime),project.timeZoneId).format('YYYY/MM/DD h:mm:ss a');
                    } else {
                      currentMonthPeakTime = "No data for this month, peak for last month";
                    }  
   

                    kwhSavings = project.kwhSavings / (1 - project.kwhSavings);
                    kwPeakSavings = project.kwPeakSavings / (1 - project.kwPeakSavings);
                    if (project.lastTotalPf == 0){
                      project.lastTotalPf = 1;
                    }
                    pfRatio = project.initialPf / project.lastTotalPf;
                    I2RLossRatio = ((pfRatio * pfRatio - 1) * -1) * (5 / 100);

                    //kva reduction * number of billing hours
                    

                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'week', description: 'weeklykwh', valueType: 'kwh', value: weekAvgKw * parseFloat(weekDiff) * kwhMultiplier}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error week kwh ');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'today', description: 'todaykwh', valueType: 'kwh', value: todayKw * dayDiff * kwhMultiplier}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error today kwh');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'month', description: '', valueType: 'avgKva', value: currentMonthAvgKw}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error month avgKva');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'month', description: '', valueType: 'kwh', value: currentMonthKwh * kwhMultiplier}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error month kwh');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'month', description: '', valueType: 'peak', value: currentMonthPeak, description: currentMonthPeakTime}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error month peak');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastMonth', description: '', valueType: 'kwh', value: lastMonthKwh * kwhMultiplier}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error lastmonth kwh');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastMonth', description: '', valueType: 'peak', value: lastMonthPeak}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error lastMonth peak');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastMonth', description: '', valueType: 'totalCost', value: lastMonthKwh / (1 - kwhSavings) * kwhMultiplier * project.kwhRate * (1 + project.taxRate) + ((lastMonthPeak * kwMultiplier) / (1 - kwPeakSavings) * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error lastMonth totalCost');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastMonth', description: '', valueType: 'totalSavings', value: lastMonthKwh * kwhMultiplier * project.kwhRate * kwhSavings * (1 + project.taxRate) + (lastMonthPeak * kwMultiplier * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error lastMonth totalSavings ');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'year', description: '', valueType: 'totalSavings', value: yearTotalKwh * kwhMultiplier  * project.kwhRate * kwhSavings * (1 + project.taxRate) + (yearTotalPeaks * kwMultiplier * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error year totalSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastYear', description: '', valueType: 'totalSavings', value: lastYearTotalKwh * kwhMultiplier * project.kwhRate * kwhSavings * (1 + project.taxRate) + (lastYearTotalPeaks * kwMultiplier * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error lastYear totalSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'totalSavings', value: projectTotalKwh * kwhMultiplier * project.kwhRate * kwhSavings * (1 + project.taxRate) + (projectTotalPeaks * kwMultiplier * kwPeakSavings * project.kwRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error allTime totalSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'today', description: '', valueType: 'I2RLossSavings', value: todayKw * dayDiff * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error today I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'week', description: '', valueType: 'I2RLossSavings', value: weekAvgKw * parseFloat(weekDiff) * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error week I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'month', description: '', valueType: 'I2RLossSavings', value: currentMonthKwh * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error month I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastMonth', description: '', valueType: 'I2RLossSavings', value: lastMonthKwh * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error lastMonth I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'year', description: '', valueType: 'I2RLossSavings', value: yearTotalKwh * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error year I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastYear', description: '', valueType: 'I2RLossSavings', value: lastYearTotalKwh * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error lastYear I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'I2RLossSavings', value: projectTotalKwh * kwhMultiplier * kwhSavings * I2RLossRatio * project.kwhRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error allTime I2RLossSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'year', description: '', valueType: 'carbonSavings', value: yearTotalKwh * kwhMultiplier * kwhSavings * (0.7054/1000) * project.carbonCreditRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error year carbonSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'carbonSavings', value: projectTotalKwh * kwhMultiplier * kwhSavings * (0.7054/1000) * project.carbonCreditRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error allTime carbonSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'carbonSavingsAmount', value: projectTotalKwh * kwhMultiplier * kwhSavings * (0.7054/1000)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error allTime carbonSavingsAmount');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'kwhSavingsAmount', value: projectTotalKwh * kwhMultiplier * kwhSavings}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error allTime kwhSavingsAmount');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'peakSavingsAmount', value: projectTotalPeaks * kwMultiplier * kwPeakSavings}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('upload savings detail for project error allTime peakSavingsAmount');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'peakSavings', value: projectTotalPeaks * kwPeakSavings * project.kwRate}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log(' upload savings detail for project error allTime peakSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'kwhSavings', value: projectTotalKwh * kwhMultiplier * project.kwhRate * kwhSavings * (1 + project.taxRate)}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error allTime kwhSavings');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'I2RLossSavingsAmount', value: projectTotalKwh * kwhMultiplier * kwhSavings * I2RLossRatio}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error allTime I2RLossSavingsAmount');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'month', description: '', valueType: 'pfc', value: monthPfc}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error month Pfc');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastMonth', description: '', valueType: 'pfc', value: lastMonthPfc}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error lastMonth Pfc');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'year', description: '', valueType: 'pfc', value: yearPfc}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error year pfc');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'lastYear', description: '', valueType: 'pfc', value: lastYearPfc}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error lastyear pfc');}
                    });
                    ReportData.create({type: 'project', typeId: project.id, project: project.id, period: 'allTime', description: '', valueType: 'pfc', value: projectPfc}).meta({fetch: true}).exec(function(err, updatedMeter){
                      if (err) {console.log('[' + Moment().format() + '] upload savings detail for project error allTime pfc');}
                    });

                    Project.update({id: project.id }).set({ 
                      kwRate: billingRate, 
                      kwhRate: avgRate, 
                      taxRate: project.taxRate, 
                      multiplier: kwhMultiplier,
                    }).meta({fetch: true}).exec(function(err, updatedProject){
                      if (err) {console.log('upload savings detail for project error ' + project.id)}
                      console.log('uploaded savings detail for project ' + project.id);  
                      return nextProject();
                    });
                  });
                });
              });
            });
          }); 
        }); 
      }); 
        
    }, function(err) {
      if (err) {return res.serverError(err);}
      return res.ok();
    });
  });
};

