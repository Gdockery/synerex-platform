module.exports = {


  friendlyName: 'Send switch command',


  description: 'Send a command to a switch device.',


  inputs: {

    projectSlug: {
      description: 'The slug of the project that this schedule is for.',
      extendedDescription: 'Used for the MQTT topic.',
      example: 'abc123',
      required: true
    },

    switchId: {
      description: 'The ID of the switch to send a command to.',
      example: 123,
    },

    command: {
      description: 'The type of command to send.',
      extendedDescription: 'Use a value from the `sails.config.constants.SWITCH_COMMAND_TYPES` set.',
      example: 123
    },

    time: {
      description: 'The time that the command should be executed.',
      example: 123
    },

    switchCommandId: {
      description: 'The ID of the SwitchCommand record that this command is a part of.',
      example: '123'
    },

    scheduleId: {
      description: 'The schedule ID to tag the command with.',
      extendedDescription: 'This ID can be used to cancel the command (and all other commands in the schedule) later.',
      example: 't-123'
    }

  },

  exits: {

    notFound: {
      description: 'No switch with the given ID was found in the database.'
    }

  },

  fn: function (inputs, exits) {
    Switch.findOne({id: inputs.switchId}).exec(function(err, switchDevice) {
      if (err) { return exits.error(err); }
      if (!switchDevice) { return exits.notFound(); }

      require('../../services/IotCommand');

      let iotCommand = new IotCommand(sails.config.iotProtocol, sails.config);

      var topic = 'xeco/' + inputs.projectSlug + '/sensors/' + switchDevice.meshId + '/control';
      var payload = {
        id: inputs.switchCommandId,
        schedule: inputs.scheduleId,
        // Transform JS timestamp to Unix timestamp.
        time: _.round(inputs.time / 1000),
        command: inputs.command === sails.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF ? 'off' : 'on'
      };

      iotCommand.publish({
        topic: topic,
        payload: JSON.stringify(payload)
      }, function(err, data) {
        if (err) { return exits.error(err); }
        // All done.
        return exits.success();
      });
    });


  }


};
