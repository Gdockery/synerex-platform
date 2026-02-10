module.exports = {

  friendlyName: 'Process software ack',

  inputs: {

    gatewayId: {
      description: 'The MAC address of the gateway acknowledging a software update.',
      example: 'AA:BB:CC:DD:EE:FF'
    },

    payload: {
      example: {}
    }

  },

  fn: function(inputs, exits) {

    // TODO -- implement.
    return exits.success();

  }

};
