// api/helpers/pdf/cost-savings-data-mapper.js
module.exports = {
  friendlyName: 'Map energy savings data',
  description: 'Maps data into PDF generator structure.',
  extendedDescription: '',

  inputs: {
    project: {
      description: 'Project ID.',
      example: 123,
      required: true
    }
  },

  exits: {
    success: {
      outputExample: '==='
    }
  },

  fn: async function (inputs, exits) {
    var Moment = require('moment-timezone');
    var log = sails.log;

    try {
      // Fetch Xeco data
      var xecos = await Xeco.find();
      var xeco = xecos[0];

      // Fetch project data with client
      var project = await Project.findOne({ id: inputs.project }).populate('client');
      if (!project) {
        throw new Error('Project not found');
      }

      // Fetch savings reports
      //var savingsReports = await SavingsReport.find({ project: 1902938 }).sort('month ASC');
      var savingsReports = await SavingsReport.find({ project: inputs.project }).sort('month ASC');

      // Fetch meters
      var meters = await Meter.find({ project: project.id, isDeleted: false, isReporting: true, isMain: true }).select(['id']);
      var meterIds = _.pluck(meters, 'id');
      var metersString = meterIds.toString();

      // Execute native SQL query for meter data
      var SQL2 = 'SELECT YEAR(day) as year, ' +
                 'MONTH(day) as month, ' +
                 'AVG(avgKva) as avgKva, ' +
                 'MAX(avgKva) as peak FROM meterdataaggregate WHERE project = ' +
                 project.id +
                 ' GROUP BY year ASC, month ASC';

      var meterResults = await sails.getDatastore().sendNativeQuery(SQL2);

      // Process meter results and savings reports
      var allReports = [];
      var rows = meterResults.rows;
      for (var i = 0; i < rows.length; i++) {
        var result = rows[i];
        var reportMonth = result.year + '-' + result.month;
        var reportExist = null;
        for (var j = 0; j < savingsReports.length; j++) {
          if (savingsReports[j].month === reportMonth) {
            reportExist = savingsReports[j];
            break;
          }
        }

        if (!reportExist) {
          var usageKWH = result.avgKva * (Moment(new Date(reportMonth)).endOf('month').valueOf() - Moment(new Date(reportMonth)).startOf('month').valueOf()) / 3600000;
          var data = {
            reportData: {
              lineItems: null,
              total: ((usageKWH * project.kwhRate) + (result.peak * project.kwRate)) *project.multiplier ,
              totalBeforeXeco: ((usageKWH * (1 + project.kwhSavings) * project.kwhRate) + (result.peak * (1 + project.kwPeakSavings) * project.kwRate))*project.multiplier,
              usageKWH: usageKWH*project.multiplier,
              kwPeak: _.round(result.peak*project.multiplier),
              kwhSavings: project.kwhSavings * 100,
              kwPeakSavings: project.kwPeakSavings * 100,
              totalBill: ((usageKWH * project.kwhRate) + (result.peak * project.kwRate))*project.multiplier,
              pfc: 0,
              kwhMultiplier: project.multiplier,
              kwMultiplier: project.peakMultiplier
            },
            month: reportMonth,
            fromDate: Moment(new Date(reportMonth)).startOf('month').valueOf(),
            toDate: Moment(new Date(reportMonth)).endOf('month').valueOf(),
            project: project.id
          };
          allReports.push(data);
        } else {
          allReports.push(reportExist);
        }
      }

      log.debug("done with array report");

      // Fetch report data
      var reportData = await ReportData.find({ project: project.id });
      var projectPfcTotal = 0;
      var projectTotalPeaks = 0;
      var projectTotalKwh = 0;
      for (var k = 0; k < reportData.length; k++) {
        if (reportData[k].period === 'allTime' && reportData[k].valueType === 'pfc' && reportData[k].type === 'project') {
          projectPfcTotal = reportData[k].value;
        }
        if (reportData[k].period === 'month' && reportData[k].valueType === 'peak' && reportData[k].type === 'project') {
          projectTotalPeaks = reportData[k].value;
        }
        if (reportData[k].period === 'allTime' && reportData[k].valueType === 'kwhSavingsAmount' && reportData[k].type === 'project') {
          projectTotalKwh = reportData[k].value;
        }
      }

      var billingRate = project.kwRate;
      var avgRate = project.kwhRate;
      var totalAllTimeSaving = _.round((parseFloat(project.kwhSavings) * projectTotalKwh * avgRate +
                                      (parseFloat(project.kwhSavings) * projectTotalKwh * avgRate * parseFloat(project.salesTax) / 100) +
                                      (projectTotalPeaks * parseFloat(project.kwPeakSavings) * billingRate) +
                                      projectPfcTotal*project.multiplier), 2);

      var moment = require('moment');
      var now = Moment.tz(new Moment(), project.timeZoneId);
      var calculator = require('../../services/utilities/bill-analytic-calculations.js');
      var calculatedData = calculator.calculate(project);
      var pfRatio = project.initialPf / project.lastTotalPf;
      var pfConstant = (pfRatio * pfRatio - 1) * -1 * (5 / 100);
      var savingsReportCalculator = require('../../services/utilities/savings-report-calculations');

      var availableCapacityTotal = 0;
      var availableKvaCapacityTotal = 0;
      var billWithoutXecoTotal = 0;
      var totalBillTotal = 0;
      var kwhReductionTotal = 0;
      var kwhSavingsDolTotal = 0;
      var kwPeakSavingsTotal = 0;
      var kwPeakSavingsDolTotal = 0;
      var powerLossKwhTotal = 0;
      var powerLossSavingsTotal = 0;
      var powerFactorLossSavingsTotal = 0;
      var totalSavingsTotal = 0;
      var co2ValueTotal = 0;
      var totalSavingsPercentTotal = 0;
      var co2ReductionTotal = 0;
      var projectMonths = Moment(now).diff(Moment(project.startDate), 'months', true);

      var savingsReportsCalculations = [];
      for (var m = 0; m < allReports.length; m++) {
        var report = allReports[m];
        var calculations = savingsReportCalculator.calculateReport(project, report, pfConstant);
        savingsReportsCalculations.push(calculations);
        availableCapacityTotal += calculations.availableCapacityValue;
        availableKvaCapacityTotal += calculations.availableKvaCapacityValue;
        billWithoutXecoTotal += calculations.billWithoutXecoValue;
        totalBillTotal += calculations.totalBillValue;
        kwhReductionTotal += calculations.kwhReductionValue;
        kwhSavingsDolTotal += calculations.kwhSavingsDolValue;
        kwPeakSavingsTotal += calculations.kwPeakSavingsValue;
        kwPeakSavingsDolTotal += calculations.kwPeakSavingsDolValue;
        powerLossKwhTotal += calculations.powerLossKwhValue;
        powerLossSavingsTotal += calculations.powerLossSavingsValue;
        powerFactorLossSavingsTotal += calculations.powerFactorLossSavingsValue;
        totalSavingsTotal += calculations.totalSavingsValue;
        co2ValueTotal += calculations.co2ValueValue;
        totalSavingsPercentTotal += calculations.totalSavingsPercent;
        co2ReductionTotal += calculations.co2ReductionValue;
      }

      var currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: project.currencyCode,
        minimumFractionDigits: 2
      });

      var numberFormatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });

      var data = {
        clientName: project.client.legalName,
        clientAddress: project.client.address,
        clientCityStateZip: project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
        statementDate: moment().format('MMMM DD, YYYY'),
        electricCompany: project.electricBillAnalysis.electricCompanyName,
        tariff: project.electricBillAnalysis.tariff,
        meterNo: project.electricBillAnalysis.meterNumber,
        acctNo: project.electricBillAnalysis.accountNumber,
        projROI: _.round(project.totalCost / project.electricBillAnalysis.totalSavings),
        avgBillPerMonth: currencyFormatter.format(totalBillTotal / allReports.length),
        powerFactor: _.round((1 + project.pfSavings) * project.initialPf),
        projectCost: currencyFormatter.format(project.totalCost),
        savingsPerMonth: currencyFormatter.format((totalSavingsTotal) / allReports.length),
        meterEquipment: 'DENTELITE proXCMeter / DataLogger',
        facilityLocation: project.location,
        accuracy: '0.2% (<0.1% typical) ANSI C12.20-2010 Class 0.2',
        integrationPeriod: '1 Sec.Cycle (Avg.15-MinutekWIntervals)',
        reports: allReports,
        reportsCalculations: savingsReportsCalculations,
        averageRecommendedTransformerAvailability: _.round(availableCapacityTotal / savingsReportsCalculations.length),
        totalAvailableKvaCapacity: _.round(availableKvaCapacityTotal / savingsReportsCalculations.length),
        totals: {
          billWithoutXeco: currencyFormatter.format(billWithoutXecoTotal),
          currentBill: currencyFormatter.format(totalBillTotal),
          kwhReduction: _.round(kwhReductionTotal, 2),
          kwhSavingsDol: currencyFormatter.format(kwhSavingsDolTotal),
          kwPeakSavings: _.round(kwPeakSavingsTotal, 2),
          kwPeakSavingsDol: currencyFormatter.format(kwPeakSavingsDolTotal),
          powerLossKwh: _.round(powerLossKwhTotal, 2),
          powerLossSavings: currencyFormatter.format(powerLossSavingsTotal),
          powerFactorLossSavings: currencyFormatter.format(powerFactorLossSavingsTotal),
          carbonCreditTradingValue: currencyFormatter.format(co2ValueTotal),
          savingsToDate: currencyFormatter.format(totalSavingsTotal),
          percentageSavingsToDate: _.round((totalSavingsPercentTotal / savingsReportsCalculations.length), 2),
          co2Reduction: _.round(co2ReductionTotal, 2)
        },
        accumulatedSavingsReport: {
          totals: {
            billWithoutXeco: '$0.00',
            currentBill: '$0.00',
            kwhReduction: '0.00',
            kwhSavingsDol: '$0.00',
            kwPeakSavings: '0.00',
            kwPeakSavingsDol: '$0.00',
            powerLossKwh: '7.00',
            powerLossSavings: '$8.00',
            powerFactorLossSavings: '$8.50',
            carbonCreditTradingValue: '$0.00',
            savingsToDate: '$0.00',
            percentageSavingsToDate: '0'
          },
          months: [
            {
              month: 'Jan-00',
              billWithoutXeco: '$1.00',
              currentBill: '$2.00',
              kwhReduction: '3.00',
              kwhSavingsDol: '$4.00',
              kwPeakSavings: '5.00',
              kwPeakSavingsDol: '$6.00',
              powerLossKwh: '7.00',
              powerLossSavings: '$8.00',
              powerFactorLossSavings: '$8.50',
              totalSavings: '$9.00',
              totalSavingsPercent: '15',
              co2Reduction: '10.00',
              co2Rate: '$11.00',
              co2Value: '$120.00'
            },
            {
              month: 'Feb-00',
              billWithoutXeco: '$1.00',
              currentBill: '$2.00',
              kwhReduction: '3.00',
              kwhSavingsDol: '$4.00',
              kwPeakSavings: '5.00',
              kwPeakSavingsDol: '$6.00',
              powerLossKwh: '7.00',
              powerLossSavings: '$8.00',
              powerFactorLossSavings: '$8.50',
              totalSavings: '$9.00',
              totalSavingsPercent: '0',
              co2Reduction: '10.00',
              co2Rate: '$11.00',
              co2Value: '$120.00'
            }
          ]
        },
        performanceStatistics: {
          averageRecommendedTransformerAvailability: '0.00',
          totalAvailableKvaCapacity: '0',
          months: [
            {
              billCycle: 'Jan-00',
              kvaUsed: '0 kVA',
              kwPeak: '0 KW',
              availableCapacity: '0.00 kVA',
              availableKvaCapacity: '0',
              btuReduction: '0.00 Btu',
              thermsReduction: '0.00 thm',
              horsepowerReduction: '0.00 hp'
            }
          ]
        }
      };

      log.debug('returning data');
      return exits.success(data);
    } catch (err) {
      log.error('Error in costSavingsDataMapper:', err);
      return exits.error(err);
    }
  }
};
