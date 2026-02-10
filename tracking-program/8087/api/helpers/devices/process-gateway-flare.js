module.exports = {

  friendlyName: 'Process gateway flare',

  inputs: {

    deviceId: {
      description: 'The serial number of the gateway sending up a flare.',
      example: 'AA:BB:CC:DD:EE:FF'
    },

    payload: {
      example: {}
    }

  },

  fn: function(inputs, exits) {

    require('../../services/IotCommand');

    let iotCommand = new IotCommand(sails.config.iotProtocol, sails.config);

    var now = new Date().getTime();

    // Look up the gateway with the given device ID and verify that it is current and belongs to the specified project.
    Gateway.find({ deviceId: inputs.deviceId, isDeleted: false }).populate('project').exec(function(err, gateways) {
      if (err) {
        return exits.error(err);
      }
      if (!gateways.length) {
        sails.log.error('Error trying to process flare from gateway w/ device ID `' + inputs.deviceId + '`: could not find an active gateway with that device ID.');
        return exits.success();
      }
      if (gateways.length > 1) {
        sails.log.error('Warning: when trying to process flare from gateway w/ device ID `' + inputs.deviceId + '`, multiple gateways were found.  Using the first...');
      }

      var gateway = gateways[0];
      var topic = 'xeco/None/gateways/' + inputs.deviceId + '/control';
      var payload = {
        setProjectID: gateway.project.slug
      };

      iotCommand.publish({
        topic: topic,
        payload: JSON.stringify(payload)
      }, function(err) {
        if (err) {
          sails.log.error('Error trying to tell gateway `' + inputs.deviceId + '` about its project: ' + require('util').inspect(err, {depth: null}));
        }
        return exits.success();
      });

    });

  }

};
