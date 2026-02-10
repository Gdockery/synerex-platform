module.exports = {


  friendlyName: 'Schedule switch, recurring schedule until end date',


  description: 'Schedule a new event for one or more switches.',


  inputs: {

    project: {
      description: 'The ID of the project to list repeater alerts for.',
      example: 123,
      required: true
    },

    switch: {
      description: 'IDs of switches to schedule this command on.',
      example: 431,
      
    },

  },


  exits: {

    unauthorized: {
      statusCode: 404
    },

    success: {
      outputExample: {
        meta: {
        },
        response: {
          hasSchedule: true,
          details: {},
          
        }
      }
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;
    var Moment = require('moment-timezone');
    var project = _.find(req.user.projects, {id: inputs.project} );


      // Create the switch command record.
    Schedule.find({switch: inputs.switch, isDeleted: false, isCompleted: false}).limit(1).exec(function(err, schedule) {
    if (err) { return exits.error(err); }
      let hasSchedule = true;
      let schDetail = [];
      let details = {};
      if (schedule.length == 0) {
        hasSchedule = false;
      } else {
        hasSchedule = true;
         schedule[0].scheduleDetail.forEach(function(scheduleDetail) {
          //get switch command startAt
            let onTimeArr = scheduleDetail.onTime.split(':'); // split it at the colons
            let offTimeArr = scheduleDetail.offTime.split(':');
            let onTime = Moment.tz(new Moment(), project.timeZoneId).startOf('day').add(parseInt(onTimeArr[0]), 'hours').add(parseInt(onTimeArr[1]), 'minutes');
            let offTime = Moment.tz(new Moment(), project.timeZoneId).startOf('day').add(parseInt(offTimeArr[0]), 'hours').add(parseInt(offTimeArr[1]), 'minutes');
            schDetail.push({onTime: onTime.valueOf(), offTime: offTime.valueOf()});

          });
 
        details.startDate = schedule[0].startDate;
        details.endDate = schedule[0].endDate;
        details.scheduleDetail = schDetail;
        details.scheduleId = schedule[0].id;
        details.daysOfWeek = schedule[0].daysOfWeek;
      }
    
           
      return exits.success({
        meta: {},
        response: {
          hasSchedule: hasSchedule,
          details: details,
        },
      });
    });
    
  }


};
