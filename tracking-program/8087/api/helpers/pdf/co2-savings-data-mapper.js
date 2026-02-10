module.exports = {


  friendlyName: 'Map bill analytic data',


  description: 'Maps data into PDF generator structure.',


  extendedDescription: '',


  inputs: {

    project: {
      description: 'Project ID.',
      example: 123,
      required: true
    },

  },

  exits: {

    success: {
      outputExample: '===',
    }

  },

  fn: function(inputs, exits) {
    Test.find({project: inputs.project})
      .sort('createdAt DESC')
      .limit(1)
      .exec(function(err, test) {
        if(!test[0].reportData) {return exits.error(new Error('There must be a completed test to generate a Co2 Savings report.'));}
        Xeco.find().exec(function (err, xecos) {
          if (err) {
            return exits.error(err);
          }
          let xeco = xecos[0];
          Project.findOne({
            id: inputs.project
          }).populate('client')
            .populate('xecoManager')
            .exec(function (err, project) {
              if (err) {
                return exits.error(err);
              }
              let _ = require('lodash');
              let moment = require('moment-timezone');
              let calculator = require('../../services/utilities/bill-analytic-calculations.js');
              let calculatedData = calculator.calculate(project);

              var currencyFormatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: project.currencyCode,
                minimumFractionDigits: 2,
              });

              var numberFormatter = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
              let testToDayRatio = 24 / (test[0].duration / 2);//Ratio of test to day.
              let kwhPerDayXecoOff = test[0].reportData.totals.xecoOff.kwh * testToDayRatio;
              let kwhPerDayXecoOn = test[0].reportData.totals.xecoOn.kwh * testToDayRatio;
              let kwhSavingsPerDay = kwhPerDayXecoOff - kwhPerDayXecoOn;
              let co2SavedPerDay = kwhSavingsPerDay * (0.7054/1000); //Numers taken from (PRINT) Final CO2 Report
              let co2SavedPerMonth = co2SavedPerDay * project.electricBillAnalysis.daysBilled;
              let co2SavedPerYear = co2SavedPerDay * project.electricBillAnalysis.daysBilled * 12;

              let data = {
                facilityLine1: project.name,
                facilityLine2: project.client.address,
                facilityLine3: project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
                reportDate: moment().format('MMMM DD, YYYY'),
                reportNumber: 'CBN-' + project.proposalNumber,
                location: project.location,
                circuitPortion: 'Switch Gear #01',
                projectManager: project.xecoManager.name || '',
                co2PerMonth: numberFormatter.format(co2SavedPerMonth),
                co2PerYear: numberFormatter.format(co2SavedPerYear),
                savingVehicle: numberFormatter.format(co2SavedPerYear * 5.1),
                savingGasoline: numberFormatter.format(co2SavedPerYear / 0.00892),
                savingBarrels: numberFormatter.format(co2SavedPerYear / 0.43),
                savingTankerTruck: numberFormatter.format(co2SavedPerYear / 75.82),
                savingsHomeElectricity: numberFormatter.format(co2SavedPerYear / 8.02),
                savingsHomeEnergy: numberFormatter.format(co2SavedPerYear / 11.55),
                savingsTreeSeedlings: numberFormatter.format(co2SavedPerYear / 0.039),
                savingsPineFirForest: numberFormatter.format(co2SavedPerYear / 4.69),
                savingsAcresDeforested: numberFormatter.format(co2SavedPerYear /100.94),
                savingsPropaneCylinders: numberFormatter.format(co2SavedPerYear /0.024),
                savingsRailcarsOfCoal: numberFormatter.format(co2SavedPerYear / 183.65),
                savingsFromRecycling: numberFormatter.format(co2SavedPerYear / 2.87),
                emissionsBeforeXeco: numberFormatter.format(kwhPerDayXecoOff * project.electricBillAnalysis.daysBilled * (0.7054/1000)),
                emissionsAfterXeco: numberFormatter.format(kwhPerDayXecoOn * project.electricBillAnalysis.daysBilled * (0.7054/1000))
              };

              //let stream = sails.services.pdfservice.generateCo2(data);
              //stream.end();
              return exits.success(data);
            });
        });
      });
  }

};
