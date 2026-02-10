module.exports = {

  friendlyName: 'Process status message',

  description: 'The status message allows discovery of a node\'s mesh MAC address (aka mesh ID), so that it can be associated with its serial number.',

  inputs: {

    projectSlug: {
      description: 'The slug of the project for which this message was intended.',
      example: 'abc123'
    },

    meshId: {
      description: 'The mesh MAC address of the node sending its status.',
      example: 'AA:BB:CC:DD:EE:FF'
    },

    payload: {
      example: {}
    }

  },

  fn: function(inputs, exits) {

    var now = new Date().getTime();

    var deviceId = inputs.payload.serial;

    var meshId = inputs.meshId;
    var meshIp = inputs.payload.meshIP;

    var softwareVersion = inputs.payload.version;

    var switchState = inputs.payload.switch && parseInt(inputs.payload.switch.status);
    switchState = !!(switchState || 0);

    // Ignore status payloads without serial numbers.
    if (!deviceId) {
      sails.log.error('No `serial` property in status message payload! (payload: ' + JSON.stringify(inputs.payload) + ')');
      return exits.success();
    }

    async.auto({

      // Try to find an existing board with the given serial.
      // This will be the case if the mesh ID changes, or if a switch status changes.
      existingPiBoard: function(cb) {
        PiBoard.findOne({ deviceId: deviceId }).exec(cb);
      },

      // If there's no existing board, create one.
      newPiBoard: ['existingPiBoard', function(results, cb) {
        if (results.existingPiBoard) { return cb(); }
        PiBoard.create({
          deviceId: deviceId,
          meshId: meshId,
          switchState: switchState,
          softwareVersion: softwareVersion,
          lastCommunicatedAt: now
        }).meta({fetch: true}).exec(cb);
      }],

      // If there is an existing board, update it.
      updatedPiBoard: ['existingPiBoard', function(results, cb) {
        if (!results.existingPiBoard) { return cb(); }
        PiBoard.update({ deviceId: deviceId }, {
          meshId: meshId,
          softwareVersion: softwareVersion,
          switchState: switchState,
          lastCommunicatedAt: now
        }).meta({fetch: true}).exec(function(err, rows) {
          if (err) { return cb(err); }
          return cb(undefined, rows[0]);
        });
      }]

    }, function(err, results) {

      if (err) { return exits.error(err); }

      // Update any associated components.
      async.parallel([

        function updateMeters(cb) {
          Meter.update({ deviceId: deviceId }, { meshId: meshId, meshLastCommunicatedAt: now, meshIp: meshIp}).exec(cb);
        },

        function updateSwitches(cb) {
          Switch.update({ deviceId: deviceId }, { meshId: meshId, meshLastCommunicatedAt: now, lastCommunicatedAt: now, meshIp: meshIp}).exec(cb);
        },

        function updateRepeaters(cb) {
          Repeater.update({ deviceId: deviceId }, { meshId: meshId, lastCommunicatedAt: now, meshIp: meshIp}).exec(cb);
        },

        function updateGateways(cb) {
          Gateway.update({ deviceId: deviceId }, { meshId: meshId, lastCommunicatedAt: now, softwareVersion: softwareVersion, meshIp: meshIp}).exec(cb);
        }

      ], function(err) {

        if (err) { return exits.error(err); }
        return exits.success();

      });

    });

  }

};
