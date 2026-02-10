module.exports = {


  friendlyName: 'Get current savings',


  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    meters: {
      description: 'string  of meterIds to calculate savings',
      example: "1,2,3", //using strings since http.get does not allow arrays
      required: true
    },

    showI2RLoss: {
      description: 'string  of meterIds to calculate savings',
      example: true, //using strings since http.get does not allow arrays
    }
  },


  exits: {

    success: {
      outputExample: {
        response: {
          todayKwh: 500,
          hours: "11",
          minutes: "35",
          todayAvgKw: 500,
          testid: 100,
          kwPeakPercentSaving: 0.445,
          beforeKva: 500,
          beforeKwh: 500,
          beforeKwp: 500,
          kwpDiff: 500,
          todayPeakKwSaving: 700.45,
          kwhDiff: 500,
          billingRate: 11.35,
          avgRate: 2.34,
          todayKwhSaving: 2000,
          totalWeekSaving: 2000,
          totalMonthSaving: 2000,
          totalLastMonthSaving: 2000,
          totalYearSaving: 2000,
          totalLastYearSaving: 2000,
          totalAllTimeSaving: 500000,
          todayCapacityValue: 100,
          todayBtu: 100,
          todayThermsReduction: 100,
          todayHorsepowerReduction: 100,
          electricSupplier: "P&G",
          tariff: "some tariff",
          kwSupplied: 200,
          kwSupplyReduction: 22.33,
          kwhSupplyReduction: 22.33,
          currentMonthKwh: 12345.32,
          currentBillCost: 18222.22,
          daysOfMonthRecorded: 16,
          estimatedMonthKwh: 13445,
          estimatedMonthKwPeak: 400,
          estimatedUtilityBill: 5000,
          estimatedBeforeUtilityBill: 7000, 
          lastMonthBudget: 2000,
          lastMonthAvgDailyKwhCost: 22.33,
          currentMonthAvgDailyKwhCost: 23.22,
          monthPeakTime: '2018-09-10 9:12 am',
          monthPeakKw: 500,
          projectMonths: 10.6,
          beforePf: 99.2,
          afterPf: 89.2,
          remainingROI: 15,
          balance: 1000,
          altEnergy: 20,
          hasAltEnergy: false,
        },
        
      }
    },

    unauthorized: {
      statusCode: 404
    },
    invalidRowIds: {
      statusCode: 400,
      description: 'One or more of the provided row IDs are not valid for the given test.'
    }

  },


  fn: function (inputs, exits) {
    var Moment = require('moment-timezone');
    var req = this.req;
    var sails = req._sails;
    var current = (new Date()).getTime();
    // Make sure that the logged-in user has access to this project.
    if ( !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }
    // Get the project record.
    Project.findOne({ id: inputs.project }).exec(function(err, project) {
      if (err) { return exits.error(err); }
      if (!project) { return exits.error(new Error('Project not found')); }
      
      ReportData.find({project: project.id}).exec(function(err, reportData) {
        if (err) { return exits.error(err); }
        
        // Ensure all required ReportData entries exist
        sails.helpers.web.project.ensureReportData({project: project.id}).exec(function(err) {
          if (err) {
            sails.log.warn('Failed to ensure ReportData entries:', err);
            // Continue anyway - we'll use defaults for missing values
          }
          
          // Re-fetch reportData in case new entries were created
          var needsRefresh = reportData.length === 0 || !reportData.find(function(item) {
            return item.period == 'month' && item.valueType == 'pfc' && item.type == 'project';
          });
          
          if (needsRefresh) {
            ReportData.find({project: project.id}).exec(function(err, refreshedData) {
              if (err) { return exits.error(err); }
              processWithReportData(refreshedData || reportData);
            });
          } else {
            processWithReportData(reportData);
          }
        });
        
        function processWithReportData(reportData) {
        Meter.find({isDeleted: false, isMain: true, project: project.id, isReporting: true}).exec(function(err, meters) { 
          if (err) { return exits.error(err); }
          
          try {
          let selected;
          let type;
          if (inputs.meters.split(",").length == 1 && meters.length != 1) { // if single meter is selected
            var selectedMeter = meters.find(mtr => {
              return mtr.id == inputs.meters.split(",")[0];
            });
            if (selectedMeter) {
              selected = selectedMeter;
              type = 'meter';
            } else {
              // Meter not found, fall back to project
              selected = project;
              type = 'project';
            }
            //afterPf = meter.kw / meter.kva;
          } else { //all meters are selected
            selected = project;
            type = 'project';
          }
          
          // Safety check - ensure selected is defined
          if (!selected) {
            return exits.error(new Error('Unable to determine selected meter or project'));
          } 

          console.log("get-current-savings.js - type", type);
	  let i = 0;
          let now = Moment.tz(new Moment(), project.timeZoneId);
          let daysInMonth = Moment(now).daysInMonth();
          console.log("c",i);
	  i = i + 1;
          let hoursInLastMonth =  Moment(now).subtract(1, 'month').daysInMonth() * 24;
          console.log("c",i);
	  i = i + 1;
          let projectMonths = Moment(now).diff(Moment(project.startDate), 'months', true);
          console.log("c",i);
	  i = i + 1;
          let daysOfMonthRecorded = Moment.duration(now.diff(Moment(now).startOf('month'))).asDays();
          console.log("c",i);
	  i = i + 1;
          let daysInLastMonth =  Moment(now).subtract(1, 'month').daysInMonth();
          console.log("c",i);
	  i = i + 1;
          // Helper function to safely get reportData value
          function getReportValue(period, valueType, type) {
            var item = reportData.find(item => item.period == period && item.valueType == valueType && item.type == type);
            return item ? item.value : 0;
          }
          
          let monthPfc = getReportValue('month', 'pfc', 'project');
          console.log("monthPfc",monthPfc);
          let billingRate = project.kwRate;
          let avgRate = project.kwhRate;
          let lastMonthPfc = getReportValue('lastMonth', 'pfc', 'project');
          console.log("monthPfc",lastMonthPfc);
          let yearPfc = getReportValue('year', 'pfc', 'project');
          let lastYearPfc = getReportValue('lastYear', 'pfc', 'project');
          let projectPfc = getReportValue('allTime', 'pfc', 'project');
          let I2RLoss = inputs.showI2RLoss ? 1 : 0;
          console.log("gcs2");
          let hours = Moment(now).format('HH');
          let minutes = Moment(now).format('mm');
          let hoursToday = parseFloat(Moment(now).format('HH.mm').toString());
          let altEnergyRatio = parseFloat(project.reportFields.altEnergyRatio) / 100;
          let projectBeforePf = project.initialPf ? project.initialPf : 100;
          let monthSavings = getReportValue('month', 'kwh', type) * avgRate * (project.kwhSavings * (1 - project.kwhSavings)) * (1 + project.taxRate) 
                          + (getReportValue('month', 'peak', type) * billingRate *  (project.kwPeakSavings * (1 - project.kwPeakSavings)));
	  console.log("monthlySavings before multiplier",monthSavings);
	  monthSavings = monthSavings * project.multiplier;
	  console.log("monthlySavings after multiplier",monthSavings);
          let todayAvgKw = type == 'project' ? selected.avg15MinuteKva : selected.lastTotalKva;
	  console.log("todayAvgKw",todayAvgKw);
          // Check if electricBillAnalysis exists before accessing its properties
          let totalKwh = project.electricBillAnalysis && project.electricBillAnalysis.totalKwh ? parseFloat(project.electricBillAnalysis.totalKwh) : 0;
          let kwPeak = project.electricBillAnalysis && project.electricBillAnalysis.kwPeak ? parseFloat(project.electricBillAnalysis.kwPeak) : 0;
          let estimatedMonthlySavings = (_.round(totalKwh * avgRate * project.kwhSavings * (1 + project.taxRate) * project.multiplier + (kwPeak * billingRate * project.kwPeakSavings) * project.multiplier
                                    + lastMonthPfc, 2) + getReportValue('lastMonth', 'I2RLossSavings', type)) * (1 - altEnergyRatio) * project.multiplier;
          console.log("gcs3");
          let totalSavingsToDate = getReportValue('allTime', 'totalSavings', type) * project.multiplier + projectPfc 
                                + (getReportValue('allTime', 'I2RLossSavings', type) * I2RLoss) * (1 - altEnergyRatio) * project.multiplier;
	  let equipmentCost = 0;
	  if (!(typeof project.equipmentInfo.total === "undefined")) {
		console.log("equipmentInfo is not undefined");
          	equipmentCost = parseFloat(project.equipmentInfo.total.total) - totalSavingsToDate;
	  }
          let balance = equipmentCost;
          console.log("gcs3after");
          let monthPeakValue = getReportValue('month', 'peak', type);
          let beforeKwpBase = (monthPeakValue * project.multiplier * project.kwPeakSavings + monthPeakValue) * project.multiplier;
          console.log("gcs3");
          let todayKwhValue = getReportValue('today', 'kwh', type);
          let beforeKwhBase = (todayKwhValue * project.kwhSavings * project.multiplier + todayKwhValue) * project.multiplier;
          let todayKwh = todayKwhValue * project.multiplier;
          let todayI2RLoss = getReportValue('today', 'I2RLossSavings', type) * project.multiplier;
          let weekI2RLoss = getReportValue('week', 'I2RLossSavings', type) * project.multiplier;
          let weekKwh = getReportValue('week', 'kwh', type) * project.multiplier;
          let monthKwh = getReportValue('month', 'kwh', type) * project.multiplier;
          let avgKva = (monthKwh / daysOfMonthRecorded) / 24; //reportData.find(item => item.period == 'month' && item.valueType == 'avgKva' && item.type == type).value * project.multiplier;
          console.log("monthKwh, avgKva",monthKwh, avgKva);
          let monthPeak = monthPeakValue * project.multiplier;
          let peakTimeItem = reportData.find(item => item.period == 'month' && item.valueType == 'peak' && item.type == type);
          let peakTime = peakTimeItem ? peakTimeItem.description : '';
          let monthI2RLoss = getReportValue('month', 'I2RLossSavings', type) * project.multiplier;
          let lastMonthKwh = getReportValue('lastMonth', 'kwh', type) * project.multiplier;
          let lastMonthPeak = getReportValue('lastMonth', 'peak', type) * project.multiplier;
          let lastMonthSavings = getReportValue('lastMonth', 'totalSavings', type) * project.multiplier;
          let lastMonthCost = getReportValue('lastMonth', 'totalCost', type) * project.multiplier;
          let lastMonthI2RLoss = getReportValue('lastMonth', 'I2RLossSavings', type) * project.multiplier;
          let yearSavings = getReportValue('year', 'totalSavings', type) * project.multiplier;
          let yearI2RLoss = getReportValue('year', 'I2RLossSavings', type) * project.multiplier;
          let lastYearSavings = getReportValue('lastYear', 'totalSavings', type) * project.multiplier;
          let lastYearI2RLoss = getReportValue('lastYear', 'I2RLossSavings', type) * project.multiplier;
          console.log("lastMonthAvgDailyKwhCost:", lastMonthCost, project.kwRate, lastMonthPeak, 1+project.taxRate,  daysInLastMonth, 2);

          let data = {
            todayKwh: _.round(todayKwh),
            hours: hours,
            minutes: minutes,
            todayAvgKw: _.round(todayAvgKw, 2),
            kwPeakPercentSaving: project.kwPeakSavings,
            beforeKva: _.round(1/(1 - project.kwhSavings) * todayAvgKw, 2),
            beforeKwh: _.round(beforeKwhBase , 2),
            monthPeakKw: _.round(monthPeak, 2),
            beforeKwp: _.round(beforeKwpBase, 2),
            kwpDiff:  _.round(beforeKwpBase - monthPeak, 2),
            todayPeakKwSaving: project.kwPeakSavings * monthPeak * billingRate,
            kwhDiff: _.round(beforeKwhBase - todayKwh, 2), 
            billingRate: _.round(billingRate, 2),
            avgRate: _.round(avgRate, 5),
            todayKwhSaving: _.round(todayKwh * avgRate * (project.kwhSavings * (1 - project.kwhSavings)) * (1 + project.taxRate)* (1 - altEnergyRatio) + (todayI2RLoss * I2RLoss), 2) ,
            totalWeekSaving: _.round(weekKwh * avgRate * (project.kwhSavings * (1 - project.kwhSavings)) * (1 + project.taxRate) * (1 - altEnergyRatio) + (weekI2RLoss * I2RLoss), 2),
            totalMonthSaving: _.round(monthSavings + monthPfc + (monthI2RLoss * I2RLoss) * (1 - altEnergyRatio), 2),
            totalLastMonthSaving: _.round(lastMonthSavings + lastMonthPfc + (lastMonthI2RLoss * I2RLoss), 2) * (1 - altEnergyRatio),
            totalYearSaving: _.round(yearSavings + yearPfc + (yearI2RLoss * I2RLoss), 2) * (1 - altEnergyRatio),
            totalLastYearSaving: _.round(lastYearSavings + lastYearPfc + (lastYearI2RLoss * I2RLoss), 2) * (1 - altEnergyRatio),
            totalAllTimeSaving: totalSavingsToDate,
            todayCapacityValue: _.round(monthPeak - (todayAvgKw * project.multiplier)),
            todayBtu: _.round((monthPeak - (todayAvgKw * project.multiplier)) * 1000), 
            todayThermsReduction: _.round((monthPeak - (todayAvgKw * project.multiplier)) / 29.2243243),
            todayHorsepowerReduction: _.round((monthPeak - (todayAvgKw * project.multiplier)) / 0.746),
            // NOTE: electricCompanyName is in project.electricBillAnalysis.electricCompanyName (JSON field)
            // If electricBillAnalysis is null, use empty string as fallback
            electricSupplier: project.electricBillAnalysis && project.electricBillAnalysis.electricCompanyName ? project.electricBillAnalysis.electricCompanyName : '',
            tariff: project.electricBillAnalysis && project.electricBillAnalysis.tariff ? project.electricBillAnalysis.tariff : '', 
            kwSupplied: _.round(monthPeak),
            kwSupplyReduction: _.round(project.kwPeakSavings * 100, 2),
            kwhSupplyReduction: _.round(project.kwhSavings * 100, 2),
            currentMonthKwh: monthKwh,
            currentBillCost: _.round((monthKwh * avgRate) * (1 + project.taxRate) + (monthPeak * billingRate), 2),
            daysOfMonthRecorded: _.round(daysOfMonthRecorded, 1),
            estimatedMonthKwh: _.round(avgKva * daysInMonth * 24, 2),
            estimatedMonthKwPeak: _.round(monthPeak),
            estimatedUtilityBill: _.round(avgKva * daysInMonth * 24 * avgRate * (1 + project.taxRate) + (monthPeak * billingRate), 2),
            estimatedBeforeUtilityBill: _.round((((monthKwh / (1 - project.kwhSavings)) * avgRate * (1 + project.taxRate)) + ((monthPeak / (1 - project.kwPeakSavings)) * billingRate)), 2),
            lastMonthBudget:  _.round(lastMonthCost, 2),
            lastMonthAvgDailyKwhCost: _.round((lastMonthCost-(project.kwRate*lastMonthPeak*(1+project.taxRate))) / daysInLastMonth, 2),
            currentMonthAvgDailyKwhCost: _.round(avgKva * 24 * avgRate*(1+project.taxRate), 2),
            monthPeakTime: peakTime,
            projectMonths: projectMonths,
            beforePf: _.round(projectBeforePf, 2),
            afterPf: selected.lastTotalPf,
            remainingROI: balance / estimatedMonthlySavings,
            balance: balance,
            altEnergy: altEnergyRatio * 100,
            hasAltEnergy: project.reportFields.altEnergy ? true : false,
          };

          return exits.success({
            response: data,
          });
          } catch (e) {
            return exits.error(e);
          }                    
        }); // end Meter.find
        } // end processWithReportData
      });

    });
  }
}
