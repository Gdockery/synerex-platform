module.exports = {

  friendlyName: 'Process beacon',

  inputs: {

    projectSlug: {
      description: 'The slug of the project for which this message was intended.',
      example: 'abc123'
    },

    deviceId: {
      description: 'The serial number of the gateway sending its status.',
      example: 'AA:BB:CC:DD:EE:FF'
    },

    payload: {
      example: {}
    }

  },

  fn: function(inputs, exits) {

    var now = new Date().getTime();

    // Look up the gateway with the given device ID and verify that it is current and belongs to the specified project.
    Gateway.find({ deviceId: inputs.deviceId, isDeleted: false }).populate('project').exec(function(err, gateways) {
      if (err) {
        return exits.error(err);
      }
      if (!gateways.length) {
        sails.log.error('Error trying to process beacon from gateway w/ device ID `' + inputs.deviceId + '`: could not find an active gateway with that device ID.');
        return exits.success();
      }
      if (gateways.length > 1) {
        sails.log.error('Warning: when trying to process beacon from gateway w/ device ID `' + inputs.deviceId + '`, multiple gateways were found.  Using the first...');
      }
      if (gateways[0].project.slug !== inputs.projectSlug) {
        sails.log.error('Error trying to process beacon from gateway w/ device ID `' + inputs.deviceId + '`: project slug in topic (`' + inputs.projectSlug + '`) does not match that of gateways\'s project (`' + gateways[0].project.slug + '`).');
        return exits.success();
      }

      var gateway = gateways[0];

      // Update the Gateway sending this heartbeat, if we can find it by its mesh ID...
      Gateway.update({ deviceId: inputs.deviceId }, { lastCommunicatedAt: now, softwareVersion: inputs.payload.version }).exec(function(err) {
        if (err) { return exits.error(err); }

        // Loop through all of the mesh nodes in the payload and update anything attached to them.
        async.each(_.keys(inputs.payload.mesh), function(macAddress, nextMacAddress) {

          var lastSeen = inputs.payload.mesh[macAddress].lastSeen;
          var lastCommunicatedAt;

          // Handle last seen as a string.
          if (_.isString(lastSeen) && lastSeen.match(/\D/)) {
            lastCommunicatedAt = now - (parseFloat(lastSeen) * 1000);
          }
          // Handle last seen as a UNIX timestamp.
          else {
            lastCommunicatedAt = parseInt(lastSeen) * 1000;
          }

          // We don't know if the referenced mesh node refers to a repeater,
          // a switch, or a mesh node attached to a meter, so we'll try updating
          // all three.

          if (isNaN(lastCommunicatedAt)) {
            sails.log.error('Invalid lastSeen field in mqtt message');
            return nextMacAddress();
          }

          var updatedSomething = false;
          Repeater.update({ meshId: macAddress }, { lastCommunicatedAt: lastCommunicatedAt, gateway: gateway.name} )
          .meta({ fetch: true })
          .exec(function(err, records) {
            if (err) { return nextMacAddress(err); }
            // If the MAC address is for a repeater, it shouldn't also be a mesh node attached
            // to a switch or meter, so we can continue.
            if (records.length) { return nextMacAddress(); }

            Switch.update({ meshId: macAddress }, { meshLastCommunicatedAt: lastCommunicatedAt, gateway: gateway.name } )
            .meta({ fetch: true })
            .exec(function(err, records) {
              if (err) { return nextMacAddress(err); }

              // Even if we did update a switch, this mesh node might be attached to a meter, too, so we need to continue.
              if (records.length) { updatedSomething = true; }

              Meter.update({ meshId: macAddress }, { meshLastCommunicatedAt: lastCommunicatedAt, gateway: gateway.name} )
              .meta({ fetch: true })
              .exec(function(err, records) {
                if (err) { return nextMacAddress(err); }

                if (records.length) { updatedSomething = true; }

                if (!updatedSomething) {
                  sails.log.error('Could not find anything attached to mesh node with MAC address ' + macAddress + ' while processing gateway beacon message.');
                }

                return nextMacAddress();

              });

            });


          });

        }, function(err) {
          if (err) { return exits.error(err); }
          return exits.success();
        });

      });

    });

  }

};
