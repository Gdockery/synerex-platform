module.exports = {


  friendlyName: 'Cancel gateway schedule',


  description: 'Given a gateway schedule ID, find and cancel all the associated commands on all the associated gateways.',


  inputs: {

    projectSlug: {
      description: 'The slug of the project that this schedule is for.',
      extendedDescription: 'Used for the MQTT topic.',
      example: 'abc123',
      required: true
    },

    scheduleId: {
      description: 'The ID of the schedule to cancel.',
      example: 't-123'
    }
  },

  fn: function (inputs, exits) {

    require('../../services/IotCommand');

    let iotCommand = new IotCommand(sails.config.iotProtocol, sails.config);

    (function getGateways(proceed) {

      var entityType;
      var entityId;

      [entityType, entityId] = inputs.scheduleId.split('-');
      if (entityType === 't') {
        // Find the related test.
        Test.findOne({id: entityId}).populate('gateways').exec(function(err, test) {
          if (err) { return proceed(test); }
          if (!test) { return proceed(new Error('Could not find test `' + entityId + '` when cancelling gateway schedule `' + inputs.scheduleId + '`.')); }

          // Find all the gateways in this test project.
          return proceed(err, test.gateways);
        });

        return;
      }

      else if (entityType === 'x') {
        GatewayCommand.findOne({id: entityId}).populate('gateways').exec(function(err, gatewayCommand) {
          if (err) { return proceed(err); }
          return proceed(undefined, gatewayCommand.gateways);
        });
        return;
      }

      else {
        return proceed(new Error('Could not parse schedule `' + inputs.scheduleId + '` (acceptable types are `t` and `x`).'));
      }

    })
    (function (err, gateways) {
      if (err) { return exits.error(err);}

      // Loop through and cancel all the gateway commands.
      // We do this at one second intervals to avoid overloading the mesh,
      // which means we have to do it outside the regular web response
      // flow so that the user doesn't have to wait for it.
      async.eachSeries(gateways, function(gatewayDevice, nextGateway) {

        setTimeout(function() {

          var topic = 'xeco/' + inputs.projectSlug + '/gateways/' + gatewayDevice.deviceId + '/cancelcontrol';
          var payload = {
            schedule: inputs.scheduleId
          };

          iotCommand.publish({
            topic: topic,
            payload: JSON.stringify(payload)
          }, nextGateway);

        }, 1000);

      }, function(err) {
        // TODO -- notify front-end in case of error.
      });

      // Return immediately (don't wait for all the commands to go out).
      return exits.success();
    });
  }

};
