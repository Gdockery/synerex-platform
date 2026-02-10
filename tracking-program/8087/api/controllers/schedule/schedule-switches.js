module.exports = function (req, res) {
    log('initiate scheduling-------------------------------');
    var Moment = require('moment-timezone'); 
  
    //check if any switch schedule needs to be scheduled today / runs at 12:01am daiy
    Schedule.find({isDeleted: false, isCompleted: false}).exec(function(err, activeSchedules) {
    if (err) {return res.serverError(err);}
    if (activeSchedules.length == 0) {
      return res.ok("no active schedules to send"); 
    }
      // Create the switch command record for each active schedule. 
      async.eachSeries(activeSchedules, function(schedule, nextSchedule) {
        Project.findOne({ id: schedule.project }).exec(function(err, project) {
          if (err) { return res.serverError(err);}
          let startOfToday = Moment.tz(new Moment(), project.timeZoneId).startOf('day');
          let today = startOfToday.format('YYYY-MM-DD');
          let todayDayOfWeek = startOfToday.day();
          //is schedule is for this day of the week then schedule it for today
          if (schedule.daysOfWeek.includes(todayDayOfWeek)) {

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
                deviceType: schedule.deviceType, 
              }).meta({fetch: true}).exec(function(err, onSwitchCommand) {
                if (err) { return res.serverError(err); }

                async.eachSeries(inputs.switches, function(switchId, nextSwitch) {

                  if (today == schedule.endDate) {
                    Switch.update({id: switchId}).set({hasSchedule: false}).meta({fetch: true}).exec(function(err) {
                      if (err) { return res.serverError(err);}
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
                  console.log ('schedule-switches today: ' + today + ' schedule.endDate: ' + schedule.endDate);
                  if (today < schedule.endDate) {
                    Schedule.update({id: schedule.id}).set({isCompleted: true}).meta({fetch: true}).exec(function(err) {
                      if (err) { return res.serverError(err);}
                    });
                  } 
                });
              });
              return nextScheduleDetail();
            } else {
              SwitchCommand.create({
                project: schedule.project,
                commandType: sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF,
                startAt: offTime.valueOf(),
                switches: inputs.switches,
                deviceType: schedule.deviceType,
              }).meta({fetch: true}).exec(function(err, offSwitchCommand) {
                async.eachSeries(inputs.switches, function(switchId, nextSwitch) {

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
                deviceType: schedule.deviceType, 
              }).meta({fetch: true}).exec(function(err, onSwitchCommand) {
                if (err) { return res.serverError(err); }

                async.eachSeries(inputs.switches, function(switchId, nextSwitch) {

                  if (today == schedule.endDate) {
                    Switch.update({id: switchId}).set({hasSchedule: false}).meta({fetch: true}).exec(function(err) {
                      if (err) { return res.serverError(err);}
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
                });
                
              });
              if (today < schedule.endDate) {
                Schedule.update({id: schedule.id}).set({isCompleted: true}).meta({fetch: true}).exec(function(err) {
                  if (err) { return res.serverError(err);}
                });
              } 
              return nextScheduleDetail();
            }
          }, function(err, response) {

            return nextSchedule();

          });
        } else {
        return nextSchedule();
      }
      
      }); //find project
      
      

      }, function(err) {
        if (err) {console.log("failed to schedule switchcommands");}
            return res.ok("schedules sent ---------------------");
           
            
        });

  });
}

function log(...args) {
  console.log.apply(console, ['[schedule-switches]'].concat(args))
}
