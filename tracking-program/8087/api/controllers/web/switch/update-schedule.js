module.exports = {


  friendlyName: 'Schedule switch, recurring schedule until end date',


  description: 'Schedule a new event for one or more switches.',


  inputs: {

    project: {
      description: 'The ID of the project to list repeater alerts for.',
      example: 123,
      required: true
    },

    schedule: {
      description: 'IDs of switches to schedule this command on.',
      example: 431,
      required: true
    },

    startDate: {
      description: 'The date to schedule the command for.',
      example: '2019-01-22',
      required: true
    },

    endDate: {
      description: 'The date for schedule to end',
      example: '2019-01-26',
      required: true
    },

    scheduleDetail: {
      description: 'On and off times for the schedule',
      example: [{'onTime': '08:35', 'offTime': '21:45'}],
      required: true
    },

    totalHoursOff: {
      description: 'total hours off from 12:00am to 11:59PM in a day',
      example: 6.5,
      required: true
    },

    switch: {
      description: 'IDs of switches to schedule this command on.',
      example: 431,
      required: true
    },

  },

  exits: {

    badCommandType: {
      description: 'The given `commandType` value was invalid.',
      statusCode: 400,
      outputExample: ''
    },

    badCommandParameters: {
      description: 'The `duration` or `interval` values were invalid for the specified command type.',
      statusCode: 400
    },

    badSwitchIds: {
      description: 'One or more of the provided switch IDs were invalid for the specified project.',
      statusCode: 400
    },

    switchScheduled: {
      description: 'One or more of the provided switch IDs is already scheduled. Each switch can only be on one schedule',
      statusCode: 400
    },

    unauthorized: {
      statusCode: 404
    },

    success: {
      outputExample: {
        meta: {
        },
        response: {
          id: 123,
          commandType: 1,
          startAt: 12345,
          switchCount: 3,
          acceptedSwitchCount: 2,
          isCancelled: false
        }
      }
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    var project = _.find(req.user.projects, {id: inputs.project} );
      // Create the switch command record.
     

    Schedule.update({id: inputs.schedule}).set({startDate: inputs.startDate, endDate: inputs.endDate, scheduleDetail: inputs.scheduleDetail, totalHoursOff: inputs.totalHoursOff}).meta({fetch: true}).exec(function(err, schedule) {
    if (err) { return exits.error(err); }
    //console.log("switch updated", updatswitch);

    // Send the command record back through the "success" exit immediately, without
    // waiting for all the commands to go through.
      return exits.success({
        meta: {},
        response: _.extend(schedule, { switchCount: inputs.switch.length })
      });
    });

     
    
  }


};
