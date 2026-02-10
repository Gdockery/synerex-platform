module.exports = {


  friendlyName: 'Remove switch schedule',


  description: 'Remove switch schedule.',


  inputs: {
    project: {
      description: 'project ID of the switch',
      example: 12,
    },

    id: {
      description: 'The ID of the switch delete',
      example: 123
    },
  },


  exits: {

    unauthorized: {
      statusCode: 404,
      outputExample: ''
    },
    notFound: {
      statusCode: 404,
      outputExample: ''
    }

  },


  fn: function (inputs, exits) {
      Schedule.findOne({id: inputs.id}).exec(function(err, schedule) {
        Project.findOne({id: schedule.project}).exec(function(err, project) {
          SwitchCommand.find({isCancelled: false}).populate('switches').exec(function(err, switchCommands) {
            if (err) { return exits.error(err); }
            if (!switchCommands) { return exits.notFound();}

            // Make sure that the logged-in user has access to this project.
            let scheduleCommands = switchCommands.filter(sc => { let commandSwitches = _.pluck(sc.switches, 'id');
              return commandSwitches.sort().toString() === schedule.switches.sort().toString()});

            async.each(scheduleCommands, (command, callback) => {
                sails.helpers.devices.cancelSwitchSchedule({
                  projectSlug: project.slug,
                  scheduleId: 'x-' + command.id
                }).exec(function (err) {

                  if (err) {return callback(err)}
                  SwitchCommand.destroy({id: command.id}).exec(err => { 
                    if (err) {return callback(err)}
                    return callback()
                  });
                })
            });

            Schedule.destroy({id: inputs.id}).exec(function(err) {
              if (err) { return exits.error(err); }
            });

            /*SwitchCommand.update({ id: inputs.id }, { isCancelled: true } ).exec(function(err) {
              if (err) { return exits.error(err); }

              // Cancel the commands on the switches.
              sails.helpers.devices.cancelSwitchSchedule({
                projectSlug: switchCommand.project.slug,
                scheduleId: 'x-' + switchCommand.id
              }).exec(function(err) {
                if (err) { return exits.error(err); }
                return exits.success();
              });

            });*/
    
          let switchesWithOtherCommands = [];
          let otherSwithCommands = switchCommands.filter(sc => { let sw = _.pluck(sc.switches, 'id'); return sw.sort().toString() !== schedule.switches.sort().toString()});
          console.log(otherSwithCommands);
          otherSwithCommands.forEach(function(otherSC){
            switchesWithOtherCommands.cat(_.pluck(otherSC.switches, 'id'));
          });
         
          schedule.switches.forEach(function(switchId) {
            if (!switchesWithOtherCommands.includes(switchId)){
              Switch.update({id: switchId}).set({hasSchedule: false}).exec(function(err) {

                if (err) { return exits.error(err); }
                console.log("updated switch: ", switchId, " to hasSchedule FALSE");
              });
            }
          });
          return exits.success({});
        });
      });
    });
  }
}