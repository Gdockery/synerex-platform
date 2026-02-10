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
          dailyBeforeKwh: 123,
          dailyAfterKwh: 123,
          dailyKwhSaving: 123,
          dailySaving: 100,
          weeklySaving: 200,
          monthlySaving: 300,
          yearlySaving: 400,
          allTimeSaving: 500,
          kwhRate: '$2.07896',
        },
      }
    },

    unauthorized: {
      statusCode: 404
    },

  },


  fn: function (inputs, exits) {

    var Moment = require('moment-timezone');
    Project.findOne({ id: inputs.project }).exec(function(err, project) {
      if (err) { return exits.error(err); }

      var now = Moment.tz(new Moment(), project.timeZoneId);
      var projectMonths = Moment(now).diff(Moment(project.startDate), 'months', true);

      var avgRate = parseFloat(project.kwhRate);
      console.log("gaes2 avgRate set to project.kwhRate" );

      var dailySaving = 0;
      var dailyBeforeKwh = 0;
      var dailyAfterKwh = 0;
      var dailyKwhSaving = 0;
      var weeklySaving = 0;
      var monthlySaving = 0;
      var yearlySaving = 0;
      var allTimeSaving = 0;
      var scheduler;
      var hoursOff;
      var x;

      Schedule.find({isCompleted: 0, isDeleted: 0, project: inputs.project}).exec(function(err, schedules) {
        if (schedules.length == 0) { }
     
        var schedulersIds = [];
        schedules.forEach(function(schedule){
          schedulersIds.concat(schedule.switches);
        });

        Switch.find({id: schedulersIds, deviceType: 2, isDeleted: 0, project: inputs.project}).exec(function(err, schedulers){
          if (err) { return exits.error(err); }
          if(schedulers.length != 0) {

          
            schedules.forEach(function(schedule) {

              hoursOff = parseFloat(schedule.totalHoursOff);
              scheduler = schedulers.filter(sch => sch.id == schedule.switch)[0];
              x = ((scheduler.voltage * scheduler.ampLoad) / 1000) * scheduler.pf;
              hoursOff = parseFloat(schedule.totalHoursOff);
      
              dailyBeforeKwh += x * scheduler.originalHours;
              dailyAfterKwh += x * (scheduler.originalHours - hoursOff);
              dailyKwhSaving += x * hoursOff;
              dailySaving += x * hoursOff * avgRate;
              weeklySaving += x * hoursOff * schedule.daysOfWeek.length * avgRate;
              monthlySaving += x * hoursOff * schedule.daysOfWeek.length * 4 * avgRate;
              if (projectMonths >= 12) {
                yearlySaving += x * hoursOff * schedule.daysOfWeek.length * 4 * avgRate * 12;
              } else {
                yearlySaving += x * hoursOff * schedule.daysOfWeek.length * 4 * avgRate * projectMonths;
              }
              allTimeSaving += x * hoursOff * schedule.daysOfWeek.length * 4 * avgRate * projectMonths;
            });
          }
          
          var currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: project.currencyCode,
            minimumFractionDigits: 2,
          });

          var kwhRateFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: project.currencyCode,
            minimumFractionDigits: 5,
          });

          let data = {
            dailyBeforeKwh: dailyBeforeKwh,
            dailyAfterKwh: dailyAfterKwh,
            dailyKwhSaving: dailyKwhSaving,
            dailySaving: dailySaving,
            weeklySaving: weeklySaving,
            monthlySaving: monthlySaving,
            yearlySaving: yearlySaving,
            allTimeSaving: allTimeSaving,
          };

        return exits.success({
          response: data,
        }); 
       });                  
      });
    });
  }
};
