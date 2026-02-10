module.exports = {


  friendlyName: 'Schedule event',


  description: 'Schedule a new event for one or more switches.',


  inputs: {

    project: {
      description: 'The ID of the project to list repeater alerts for.',
      example: 123,
      required: true
    },

    commandType: {
      description: 'The type of command to schedule.',
      extendedDescription: 'Use a value from the `sails.config.constants.SWITCH_COMMAND_TYPES` set.',
      example: 1,
      required: true
    },

    startAt: {
      description: 'The time to schedule the command for.',
      example: 12345,
      required: true
    },

    switches: {
      description: 'IDs of switches to schedule this command on.',
      example: [1],
      required: true
    },

    deviceType: {
      description: 'The type of command to schedule.',
      example: 1,
      required: true
    },

    test: {
      description: 'The type of command to schedule.',
      example: 1,
    }

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

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    // Make sure the command type is valid.
    if (!_.contains(_.values(sails.config.constants.SWITCH_COMMAND_TYPES), inputs.commandType)) {
      return exits.badCommandType();
    }

    // Make sure `switches` contains at least one device, and that all device IDs are positive integers.
    if (inputs.switches.length === 0 || _.any(inputs.switches, function(switchId) { return switchId === 0 || parseInt(switchId) !== switchId; })) {
      return exits.badSwitchIds();
    }

    var project = _.find(req.user.projects, {id: inputs.project} );

    Switch.find({id: inputs.switches, isDeleted: false}).exec(function(err, switches) {
      if (err) {return exits.error(err);}

      // If any of the switches could not be found, bail.
      if (switches.length !== inputs.switches.length) {
        return exits.error('badSwitchIds');
      }

      // If any of the switches are not attached to the given project, bail.
      if (_.any(switches, function(aSwitch) {
        return aSwitch.project !== inputs.project;
      })) {
        return exits.error('badSwitchIds');
      }
 
      // Create the switch command record.
      SwitchCommand.create({
        project: inputs.project,
        commandType: inputs.commandType,
        startAt: inputs.startAt, 
        switches: inputs.switches,
        deviceType: inputs.deviceType, 
        test: inputs.test ? inputs.test : null,
      }).meta({fetch: true}).exec(function(err, switchCommand) {
        if (err) { return exits.error(err); }

        // Send a control message to each switch.
        // Note that this is done at the rate of 1 message per second, which could potentially
        // delay the web response to an unacceptable extent.  Therefore, we send the control
        // messages outside of the response (see the immediate "return exit.success()" below),
        // and do our best to handle errors by cancelling the switch command.
        async.eachSeries(inputs.switches, function(switchId, nextSwitch) {
          // Wait 50ms, then send out the next switch control command.

          setTimeout(function() {
            sails.helpers.devices.sendSwitchCommand({
              projectSlug: project.slug,
              time: inputs.startAt,
              command: inputs.commandType,
              switchId: switchId,
              switchCommandId: switchCommand.id,
              scheduleId: 'x-' + switchCommand.id,
            }).exec(nextSwitch);
          }, 50);
          
        }, function(err) {
          // If an errors occurred, try to "cancel" the switch schedule by setting `isCancelled: true`
          // on its db record and then sending out cancelcontrol command to all the switches.
          if (err) {
            // TODO -- notify the front-end of any errors.
            SwitchCommand.update({ id: switchCommand.id }, { isCancelled: true }).exec(function() {
              // Note that we don't handle db error here; we might as well still try and cancel
              // the hardware commands.
              sails.helpers.devices.cancelSwitchSchedule({
                scheduleId: 'x-' + switchCommand.id,
              }).exec(function noop() {
                // TODO -- notify the front-end of any errors.
              });
            });
          }
        });

        // Send the command record back through the "success" exit immediately, without
        // waiting for all the commands to go through.
        return exits.success({
          meta: {},
          response: _.extend(switchCommand, { switchCount: inputs.switches.length })
        });
      });
    });
  }
};
