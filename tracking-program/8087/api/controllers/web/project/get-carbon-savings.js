module.exports = {


  friendlyName: 'Get current savings',


  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {
      outputExample: {
        response: {
  
        },
        
      }
    },

    notFound: { statusCode: 404 }

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
        ReportData.find({ project: inputs.project, type: 'project' }).exec(function(err, reportData) {
        if (err) { return exits.error(err); }
        var now = Moment.tz(new Moment(), project.timeZoneId);
        var kvaPercentSaved = parseFloat(project.kwhSavings);
        let todayKwh = reportData.find(item => item.period == 'today' && item.valueType == 'kwh').value; 
        let hours = Moment(now).format('HH');
        let minutes = Moment(now).format('mm');         
        let weekKwh = reportData.find(item => item.period == 'week' && item.valueType == 'kwh').value;
        let monthKwh = reportData.find(item => item.period == 'month' && item.valueType == 'kwh').value;
        let carbonRatio = (0.7054/1000);
        let projectCarbonSavings = reportData.find(item => item.period == 'allTime' && item.valueType == 'carbonSavingsAmount').value;

        let data = {
          co2Today: _.round(carbonRatio * todayKwh, 2),
          co2TodayBefore: _.round(carbonRatio * todayKwh * (1 / (1 - kvaPercentSaved)),2),
          co2TodayDiff: _.round(carbonRatio * todayKwh * kvaPercentSaved, 2),
          carbonCreditRate: project.carbonCreditRate,
          ccValueToday: _.round(carbonRatio * todayKwh * kvaPercentSaved * project.carbonCreditRate, 2),
          hours: hours,
          minutes: minutes,
          ccValueWeek: _.round(carbonRatio * weekKwh * kvaPercentSaved * project.carbonCreditRate, 2),
          ccValueMonth: _.round(carbonRatio * monthKwh * kvaPercentSaved * project.carbonCreditRate, 2),
          ccValueYear: _.round(reportData.find(item => item.period == 'year' && item.valueType == 'carbonSavings').value, 2),
          ccValueProject: _.round(reportData.find(item => item.period == 'allTime' && item.valueType == 'carbonSavings').value, 2),
          //CO2 in metric tonnes
          passengerVehicles: _.round(projectCarbonSavings / 5.1, 2),
          gallonsOfGasoline: _.round(projectCarbonSavings  / 0.00892, 2),
          barrelsOfOil: _.round(projectCarbonSavings / 0.43, 2),
          tankerTrucksGasoline: _.round(projectCarbonSavings / 75.82, 2),
          homesForOneYear: _.round(projectCarbonSavings / 8.02, 2),
          treeSeedlings: _.round(projectCarbonSavings /  0.039, 2),
          acresOfPine: _.round(projectCarbonSavings / 4.69, 2),
          propaneCylinders: _.round(projectCarbonSavings / 0.024, 2),
          railcarsOfCoal: _.round(projectCarbonSavings / 183.65, 2),
          tonsOfWaste: _.round(projectCarbonSavings / 2.87, 2),
          milesDriven: _.round(projectCarbonSavings / 1.824, 2),
          incandescentToLed: _.round(projectCarbonSavings / 0.0249, 2),
        };
	console.log(data);
      
        return exits.success({
          response: data,
        });                    
      });
    });
  }
};
