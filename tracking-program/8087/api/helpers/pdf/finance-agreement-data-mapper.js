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
    Xeco.find().exec(function(err, xecos) {
      if (err) { return exits.error(err); }
      let xeco = xecos[0];
      Project.findOne({
        id: inputs.project
      }).populate('client')
        .populate('xecoManager')
        .exec(function (err, project) {
          if (err) { return exits.error(err); }
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

          let downPayment = project.reportFields.downPaymentPercent / 100 * project.equipmentInfo.total.total;

          let financeCost = (project.equipmentInfo.total.total - downPayment) * (project.reportFields.interestRate / 100);

          let balance = (project.equipmentInfo.total.total - downPayment) + financeCost;

          let monthsToPay = _.round(balance / project.electricBillAnalysis.totalSavings, 2)
 
          let data = {
            projectCurrency: project.currencyCode,
            date: moment().format('MMMM DD, YYYY'),
            interestRate: project.reportFields.interestRate,
            downPaymentPercent: project.reportFields.downPaymentPercent,
            reportNumber: project.proposalNumber, 
            clientName: project.client.legalName,
            clientAddress: project.client.address,
            clientCity: project.client.city,
            clientState: project.client.state,
            clientZip: project.client.zip,
            clientAddressLine: project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
            clientAccount: project.electricBillAnalysis.accountNumber, // Electric company account number.
            clientSupplier: project.electricBillAnalysis.electricCompanyName,
            location: project.location,
            preparedFor: project.client.legalName + " \n" + project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
            estimatedSavingsPercent: ((project.electricBillAnalysis.totalSavings / project.equipmentInfo.total.total) * 100).toFixed(2),
            estimatedROI: _.round(project.equipmentInfo.total.total / project.electricBillAnalysis.totalSavings),
            reportDate: moment(project.electricBillAnalysis.billDate).format('MMMM DD, YYYY'),
          
            billAnalysis: {
              demand: numberFormatter.format(calculatedData.demandKwh),//I changed this from supply to demand cause previous field seems to be supply
              totalCost: currencyFormatter.format(project.equipmentInfo.total.total),
            },

            downPayment: currencyFormatter.format(downPayment),
            monthlyPayment: currencyFormatter.format(parseFloat(project.electricBillAnalysis.totalSavings)),
            totalFinancingCost: currencyFormatter.format(financeCost),
            totalProjectCost: currencyFormatter.format(project.equipmentInfo.total.total + financeCost),
            monthsToPay: monthsToPay,
          };

          //let stream = sails.services.pdfservice.generateFinanceAgreement(data);
          //stream.end();
          return exits.success(data);
        });
    });
  }

};
