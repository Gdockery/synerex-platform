module.exports = {


  friendlyName: 'Schedule switch, recurring schedule until end date',


  description: 'Schedule a new event for one or more switches.',


  inputs: {

    project: {
      description: 'The ID of the project to list repeater alerts for.',
      example: 123,
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
      example: [{'offTime': '07:45','onTime': '08:35'}],
      required: true
    },

    switches: {
      description: 'IDs of switches to schedule this command on.',
      example: [1,2,3],
      required: true
    },

    daysOfWeek: {
      description: 'array of 1-7 with 1 for Monday ... 7 for Sunday',
      example: [1,2,3,4,5],
      required: true
    },

    totalHoursOff: {
      description: ['total hours off from 12:00am to 11:59PM in a day'],
      example: 6.5,
      required: true
    },

    deviceType: {
      description: 'device type 1 is switches, 2 is equipment schedulers',
      example: 1,
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
    console.log("in scheduler");
    var req = this.req;
    var Moment = require('moment-timezone');
    var project = _.find(req.user.projects, {id: inputs.project} );
      // Create the switch command record.
    Schedule.create({
      startDate: inputs.startDate,
      endDate: inputs.endDate,
      scheduleDetail: inputs.scheduleDetail,
      isDeleted: false,
      project: project.id,
      switches: inputs.switches,
      isCompleted: false,
      daysOfWeek: inputs.daysOfWeek,
      totalHoursOff: inputs.totalHoursOff,
      deviceType: inputs.deviceType,
    }).meta({fetch: true}).exec(function(err, schedule) {
      if (err) { return exits.error(err); }

 
        //console.log("switch updated", updatswitch);

        // Send the command record back through the "success" exit immediately, without
        // waiting for all the commands to go through.
        let startOfToday = Moment.tz(new Moment(), project.timeZoneId).startOf('day');
        let today = startOfToday.format('YYYY-MM-DD');
        let todayDayOfWeek = startOfToday.day();

        //is schedule is for this day of the week then schedule it for today
        console.log("schedule.daysOfWeek: " + schedule.daysOfWeek);
        console.log("todayDayOfWeek: " + todayDayOfWeek);
        //why doest this matter
        //if (schedule.daysOfWeek.includes(todayDayOfWeek) || schedule.daysOfWeek == todayDayOfWeek) {
        if (schedule.daysOfWeek.includes(todayDayOfWeek) || schedule.daysOfWeek === todayDayOfWeek) {

        // create switch command for each lineitem in schedule
          async.eachSeries(schedule.scheduleDetail, function(scheduleDetail, nextScheduleDetail) {
            //get switch command startAt
            let now = Moment.tz(new Moment(), project.timeZoneId)
            let offTimeArr = scheduleDetail.offTime.split(':'); // split it at the colons
            let onTimeArr = scheduleDetail.onTime.split(':');
            let offTime = Moment.tz(new Moment(), project.timeZoneId).startOf('day').add(parseInt(offTimeArr[0]), 'hours').add(parseInt(offTimeArr[1]), 'minutes');
            console.log("scheduling switch ", schedule.switches, " to turn off at ", offTime.format('YYYY-MM-DD hh:mm A'));
            let onTime = Moment.tz(new Moment(), project.timeZoneId).startOf('day').add(parseInt(onTimeArr[0]), 'hours').add(parseInt(onTimeArr[1]), 'minutes');
            console.log("scheduling switch ", schedule.switches, " to turn on at ", onTime.format('YYYY-MM-DD hh:mm A'));
            if (onTime.valueOf() < now.valueOf()) {
              return nextScheduleDetail();
            } else if (offTime.valueOf() < now.valueOf()) {
              SwitchCommand.create({
                project: schedule.project,
                commandType: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON,
                startAt: onTime.valueOf(),
                switches: inputs.switches,
                deviceType: inputs.deviceType, 
              }).meta({fetch: true}).exec(function(err, onSwitchCommand) {
                if (err) { console.log ("7error: " + err); return res.serverError(err); }

                async.eachSeries(inputs.switches, function(switchId, nextSwitch) {
                  Switch.update({id: switchId}).set({hasSchedule: true}).exec(function(err) {
                    if (err) { console.log ("8error: " + err); return exits.error(err); }
                  }); 

                  setTimeout(function() {
                    sails.helpers.devices.sendSwitchCommand({
                      projectSlug: project.slug,
                      time: onSwitchCommand.startAt,
                      command: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON,
                      switchId: switchId,
                      switchCommandId: onSwitchCommand.id,
                      scheduleId: 'x-' + onSwitchCommand.id
                    }).exec(nextSwitch);
                  }, 50);
                }, function(err) {
                  if (err) {
                        // TODO -- notify the front-end of any errors.
                    SwitchCommand.update({ id: onSwitchCommand.id }, { isCancelled: true }).exec(function() {
                      // Note that we don't handle db error here; we might as well still try and cancel
                      // the hardware commands.
                      sails.helpers.devices.cancelSwitchSchedule({
                        scheduleId: 'x-' + onSwitchCommand.id
                      }).exec(function noop() {
                        // TODO -- notify the front-end of any errors.
                      });
                    });
                  }
                  /*if (today < schedule.endDate) {
                    Schedule.update({id: schedule.id}).set({isCompleted: true}).meta({fetch: true}).exec(function(err) {
                      if (err) { return res.serverError(err);}
                    });
                  } */
                });
              });
              return nextScheduleDetail();
            } else {
              SwitchCommand.create({
                project: schedule.project,
                commandType: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF,
                startAt: offTime.valueOf(),
                switches: inputs.switches,
                deviceType: inputs.deviceType,
              }).meta({fetch: true}).exec(function(err, offSwitchCommand) {
                async.eachSeries(inputs.switches, function(switchId, nextSwitch) {
                  Switch.update({id: switchId}).set({hasSchedule: true}).exec(function(err) {
                    if (err) { return exits.error(err); }
                  });

                  if (today == schedule.endDate) {
                    Switch.update({id: switchId}).set({hasSchedule: false}).meta({fetch: true}).exec(function(err) {
                      if (err) { return res.serverError(err);}
                    });
                  } 

                  setTimeout(function() {
                    sails.helpers.devices.sendSwitchCommand({
                      projectSlug: project.slug,
                      time: offSwitchCommand.startAt,
                      command: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF,
                      switchId: switchId,
                      switchCommandId: offSwitchCommand.id,
                      scheduleId: 'x-' + offSwitchCommand.id
                    }).exec(nextSwitch);
                    console.log("(not today) scheduling switch ", switchId, " to turn off at ", offSwitchCommand.startAt);
                  }, 50);
                }, function(err) {
                  if (err) {
                        // TODO -- notify the front-end of any errors.
                    SwitchCommand.update({ id: offSwitchCommand.id }, { isCancelled: true }).exec(function() {
                      // Note that we don't handle db error here; we might as well still try and cancel
                      // the hardware commands.
                      sails.helpers.devices.cancelSwitchSchedule({
                        scheduleId: 'x-' + offSwitchCommand.id
                      }).exec(function noop() {
                        // TODO -- notify the front-end of any errors.
                        console.log ("hooo");
                      });
                    });
                  }
                });
              });

              SwitchCommand.create({
                project: schedule.project,
                commandType: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON,
                startAt: onTime.valueOf(),
                switches: inputs.switches,
                deviceType: inputs.deviceType, 
              }).meta({fetch: true}).exec(function(err, onSwitchCommand) {
                if (err) {  console.log ("1rror: " + err); return res.serverError(err); }

                async.eachSeries(inputs.switches, function(switchId, nextSwitch) {
                  Switch.update({id: switchId}).set({hasSchedule: true}).exec(function(err) {
                    if (err) { console.log ("2error: " + err); return exits.error(err); }
                  });

                  if (today == schedule.endDate) {
                    Switch.update({id: switchId}).set({hasSchedule: false}).meta({fetch: true}).exec(function(err) {
                      if (err) { console.log ("3error: " + err); return res.serverError(err);}
                    });
                  } 

                  setTimeout(function() {
                    sails.helpers.devices.sendSwitchCommand({
                      projectSlug: project.slug,
                      time: onSwitchCommand.startAt,
                      command: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_ON,
                      switchId: switchId,
                      switchCommandId: onSwitchCommand.id,
                      scheduleId: 'x-' + onSwitchCommand.id
                    }).exec(nextSwitch);
                    console.log("(not today) scheduling switch ", switchId, " to turn on at ", onSwitchCommand.startAt);
                  }, 50);
                }, function(err) {
                  if (err) {
                        // TODO -- notify the front-end of any errors.
                    SwitchCommand.update({ id: onSwitchCommand.id }, { isCancelled: true }).exec(function() {
                      // Note that we don't handle db error here; we might as well still try and cancel
                      // the hardware commands.
                      sails.helpers.devices.cancelSwitchSchedule({
                        scheduleId: 'x-' + onSwitchCommand.id
                      }).exec(function noop() {
                        console.log ("error: " + err);
                        // TODO -- notify the front-end of any errors.
                      });
                    });
                  }
                });
                
              });
              if (today >= schedule.endDate) {
                Schedule.update({id: schedule.id}).set({isCompleted: true}).meta({fetch: true}).exec(function(err) {
                  if (err) { 
                        console.log ("error: " + err);
                        return res.serverError(err);}
                });
              } 
              return nextScheduleDetail();
            }
          });
        } 
        return exits.success({
          meta: {},
          response: _.extend(schedule, { switchCount: inputs.switches.length })
        });
    });
  }
}
