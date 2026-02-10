module.exports = {


  friendlyName: 'Cancel switch schedule',

  description: 'Given a switch schedule ID, find and cancel all the assocatiated commands on all the associated switches.',


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

    (function getSwitches(proceed) {

      var entityType;
      var entityId;

      [entityType, entityId] = inputs.scheduleId.split('-');
      if (entityType === 't') {
        // Find the related test.
        Test.findOne({id: entityId}).exec(function(err, test) {
          if (err) { return proceed(test); }
          if (!test) { return proceed(new Error('Could not find test `' + entityId + '` when cancelling switch schedule `' + inputs.scheduleId + '`.')); }

	 // Find all the switches in this test project.
          Switch.find({project: test.project, isDeleted: false}).exec(proceed);
        });

        return;
      }

      else if (entityType === 'x') {
        SwitchCommand.findOne({id: entityId}).populate('switches').exec(function(err, switchCommand) {
          if (err) { return proceed(err); }
          return proceed(undefined, switchCommand.switches);
        });
        return;
      }

      else {
        return proceed(new Error('Could not parse schedule `' + inputs.scheduleId + '` (acceptable types are `t` and `x`).'));
      }

    })
    (function (err, switches) {
      if (err) { return exits.error(err);}

      // Loop through and cancel all the switch commands.
      // We do this at one second intervals to avoid overloading the mesh,
      // which means we have to do it outside the regular web response
      // flow so that the user doesn't have to wait for it.
      async.eachSeries(switches, function(switchDevice, nextSwitch) {

        setTimeout(function() {

          require('../../services/IotCommand');

          let iotCommand = new IotCommand(sails.config.iotProtocol, sails.config);

          var topic = 'xeco/' + inputs.projectSlug + '/sensors/' + switchDevice.meshId + '/cancelcontrol';
          var payload = {
            schedule: inputs.scheduleId
          };

          iotCommand.publish({
            topic: topic,
            payload: JSON.stringify(payload)
          }, nextSwitch);

        }, 50);

      }, function(err) {
        if(err) {
          return exits.error("error in cancel switch command: " + err);
        }
      });

      // Return immediately (don't wait for all the commands to go out).
      return exits.success();

    });

  }


};
