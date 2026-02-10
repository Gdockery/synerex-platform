module.exports = {


  friendlyName: 'Map Lost savings potential',


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

  fn: function(inputs, exits) {
    var Moment = require('moment-timezone');
 
    var req = this.req; 
   
    Project.findOne({id: inputs.project}).populate('client').populate('xecoManager').exec(function (err, pr) {
      if (err) {return exits.error(err);} 
      Project.find({client: pr.client.id}).exec(function (err, projects) {
        if (err) {return exits.error(err);} 
        let moment = require('moment');
        var now = Moment.tz(new Moment(), pr.timeZoneId);
      
        var currencyFormatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: pr.currencyCode,
          minimumFractionDigits: 2,
        });

        var numberFormatter = new Intl.NumberFormat('en-US', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        let calculator = require('../../services/utilities/bill-analytic-calculations.js');

        projects = projects.filter(project => project.electricBillAnalysis != null);

        let totalLostSavings = 0;

        projects.forEach(function(project) {
          let calculatedData = calculator.calculate(project);
          project.baselineSavingsPercent = ((project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) * 100).toFixed(2);
          project.baselineROI = _.round(project.equipmentInfo.total.total / project.electricBillAnalysis.totalSavings);
          project.daysLost = now.diff(moment(project.electricBillAnalysis.billDate), 'days');
          project.reportDate = moment(project.electricBillAnalysis.billDate).format('MMMM DD, YYYY')
          project.monthlySavings = currencyFormatter.format(project.electricBillAnalysis.totalSavings);
          project.dailySavings = currencyFormatter.format(project.electricBillAnalysis.totalSavings / project.electricBillAnalysis.daysBilled);
          project.yearlySavings = currencyFormatter.format(project.electricBillAnalysis.totalSavings * 12);
          project.facilityLocation = project.location;
          project.kwhConsumed = numberFormatter.format(project.electricBillAnalysis.totalKwh);
          project.co2Reduction = _.round(calculatedData.co2Reduction * 12, 2);
          project.co2Savings = currencyFormatter.format(calculatedData.co2Reduction * project.baselineSavingsPercent / 100 * 12);
          project.lostSavings = currencyFormatter.format(project.daysLost * project.electricBillAnalysis.totalSavings / project.electricBillAnalysis.daysBilled);
          totalLostSavings += project.daysLost * project.electricBillAnalysis.totalSavings / project.electricBillAnalysis.daysBilled;
        });

        
        let data = {
          clientName: pr.client.legalName,
          clientAddress: pr.client.address,
          clientCityStateZip: pr.client.city + ', ' + pr.client.state + ' ' + pr.client.zip,
          repName: pr.xecoManager.firstName + ' ' + pr.xecoManager.lastName || '',
          repPhone: pr.xecoManager.phone,
          repEmail: pr.xecoManager.email,
          statementDate: moment().format('MMMM DD, YYYY'),
          electricCompany: pr.electricBillAnalysis.electricCompanyName,
          tariff: pr.electricBillAnalysis.tariff,
          meterNo: pr.electricBillAnalysis.meterNumber,
          acctNo: pr.electricBillAnalysis.accountNumber,
          meterEquipment: 'DENTELITE proXCMeter / DataLogger',
          accuracy: '0.2% (<0.1% typical) ANSI C12.20-2010 Class 0.2',
          integrationPeriod: '1 Sec.Cycle (Avg.15-MinutekWIntervals)',
          projects: projects,
          totalLostSavings: currencyFormatter.format(totalLostSavings),
        };

        console.log("done with mapper, generate report");

                     
        //let stream = sails.services.pdfservice.generateLsPotential(data);
        //stream.end();
        return exits.success(data);
      });
    });
  }
};
