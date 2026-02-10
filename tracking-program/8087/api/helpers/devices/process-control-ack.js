module.exports = {

  friendlyName: 'Process control ack',

  inputs: {

    projectSlug: {
      description: 'The slug of the project for which this message was intended.',
      example: 'abc123'
    },

    meshId: {
      example: 'ff:ff:ff:ff:ff:ff'
    },

    payload: {
      example: {}
    }

  },

  fn: function (inputs, exits, env) {

    var now = new Date().getTime();

    // Get the info for the sensor.
    var meshId = inputs.meshId;

    // Bail if no switch / schedule command ID was included in the payload.
    if (!inputs.payload.id) {
      return exits.error(new Error('Could not process acknowledgement for ' + meshId + '(no switch or schedule command provided in payload.)'));
    }

    // Look up the switch with the given mesh ID and verify that it is current and belongs to the specified project.
    Switch.find({ meshId: inputs.meshId, isDeleted: false }).populate('project').exec(function(err, switches) {
      if (err) {
        return exits.error(err);
      }
      if (!switches.length) {
        sails.log.error('Error trying to acknowledge ack for switch w/ mesh ID `' + inputs.meshId + '`: could not find an active switch with that mesh ID.');
        return exits.success();
      }
      if (switches.length > 1) {
        sails.log.error('Warning: when trying to acknowledge ack for switch w/ mesh ID `' + inputs.meshId + '`, multiple switches were found.  Using the first...');
      }
      if (switches[0].project.slug !== inputs.projectSlug) {
        sails.log.error('Error trying to acknowledge ack for switch w/ mesh ID `' + inputs.meshId + '`: project slug in topic (`' + inputs.projectSlug + '`) does not match that of switch\'s project (`' + switches[0].project.slug + '`).');
        return exits.success();
      }

      // Get the action indicated in the acknowledgement.
      var action = inputs.payload.action;

      // Determine the switch command or commands that this acknowledgement refers to.
      (function(proceed) {

        // Declare var to hold the query that we'll build to find all the relevant switch commands.
        var query;

        // For acks of adding or executing commands, the ID in the payload is the SwitchCommand record ID, so we can
        // just look up that command.
        if (action === 'added' || action === 'executed') {
          query = SwitchCommand.find({ id: inputs.payload.id }).populate('switches');
        }

        else {
          // Otherwise it's a cancellation, in which case the ID in the payload is the _schedule_ id.
          var entityType;
          var entityId;
          [entityType, entityId] = inputs.payload.id.split('-');

          // If the schedule ID starts with `x-`, it's a one-off command.
          if (inputs.payload.id[0] === 'x') {
            query = SwitchCommand.find({ id: entityId }).populate('switches');
          }

          // If the schedule ID starts with `t-`, it's for a test, so we'll find all schedule commands for that test.
          else {
            query = SwitchCommand.find({ test: entityId }).populate('switches');
          }

        }

        // Execute the query and proceed.
        query.exec(proceed);
        return;

      })
      // Update the appropriate array of switch IDs (i.e. acceptedBySwitchIds, cancelledBySwitchIds, etc.) in each command record.
      (function(err, switchCommands) {
        if (err) { return exits.error(err); }

        async.each(switchCommands, function(switchCommand, nextSwitchCommand) {

          SwitchCommand.lock(switchCommand.id).then(() => {

            SwitchCommand.find({id: switchCommand.id})
              .populate('switches')
              .exec((err, [switchCommand]) => {

                if (err) { return nextSwitchCommand(err); }

                // Find the given switch device in the set of switches attached to this command.
                var switchDevice = _.find(switchCommand.switches, { meshId: inputs.meshId });

                // If no such switch command is found, return an error.
                if (!switchDevice) {
                  env.sails.log.error('Could not process `' + action + '` ack: no switch found with mesh ID ' + inputs.meshId + '.\nFull payload: ' + JSON.stringify(inputs.payload));
                  return nextSwitchCommand();
                }

                var ackedSwithIdArray = action === 'added' ? 'acceptedBySwitchIds' : (action === 'executed' ? 'executedBySwitchIds' : 'cancelledBySwitchIds');
                var newArray = _.uniq((switchCommand[ackedSwithIdArray] || []).concat([switchDevice.id]));

                SwitchCommand.update({id: switchCommand.id}, {[ackedSwithIdArray]: newArray}).exec(function(err) {
                  SwitchCommand.unlock(switchCommand.id);
                  if (err) { return nextSwitchCommand(err); }

                  return nextSwitchCommand();

                });
                
              })

          })
          
        }, function doneUpdatingSwitchCommands(err) {
          if (err) { return exits.error(err); }
          return exits.success();
        });

      });

    });

  }

};
