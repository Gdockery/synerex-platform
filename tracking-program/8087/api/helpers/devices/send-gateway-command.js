module.exports = {


  friendlyName: 'Send gateway command',


  description: 'Send a command to a gateway device.',


  inputs: {

    projectSlug: {
      description: 'The slug of the project that this schedule is for.',
      extendedDescription: 'Used for the MQTT topic.',
      example: 'abc123',
      required: true
    },

    gatewayId: {
      description: 'The device ID of the gateway to send a command to.',
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

    gatewayCommandId: {
      description: 'The ID of the GatewayCommand record that this command is a part of.',
      example: '123'
    },

    scheduleId: {
      description: 'The schedule ID to tag the command with.',
      extendedDescription: 'This ID can be used to cancel the command (and all other commands in the schedule) later.',
      example: 't-123'
    },

    duration: {
      description: 'Duration of the test in hours.',
      example: '2'
    }

  },

  exits: {

    notFound: {
      description: 'No gateways with the given ID was found in the database.'
    }

  },

  fn: function (inputs, exits) {

    Gateway.findOne({id: inputs.gatewayId}).exec(function(err, gatewayDevice) {
      if (err) { return exits.error(err); }
      if (!gatewayDevice) { return exits.notFound(); }

      require('../../services/IotCommand');

      let iotCommand = new IotCommand(sails.config.iotProtocol, sails.config);

      let topic = 'xeco/' + inputs.projectSlug + '/gateways/' + gatewayDevice.deviceId + '/control';
      let payload = {
        id: inputs.gatewayCommandId,
        schedule: inputs.scheduleId,
        // Transform JS timestamp to Unix timestamp.
        time: _.round(inputs.time / 1000),
        duration: inputs.duration
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
