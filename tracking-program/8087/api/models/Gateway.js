/**
 * Gateway.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // Serial number of the network device (e.g. Pi-board) being used as a gateway.
    deviceId: {
      type: 'string',
      required: true,
      custom: function(val) {
        return val.trim().toUpperCase().match(/^([A-F0-9]{2}:){5}[A-F0-9]{2}$/);
      }
    },

    // MAC address of the this gateway's mesh node (e.g. the Pi-board's wireless controller MAC address).
    meshId: {
      type: 'string'
    },

    meshIp: {
      type: 'string',
      allowNull: true,
    },

    // Nickname for this gateway, e.g. "BLDG #1 Gateway".
    name: {
      type: 'string',
      required: true
    },

    // The current (acknowledged) software version on the gatewaty.
    softwareVersion: {
      type: 'string'
    },

    // The project that this gateway is attached to.
    project: {
      model: 'project',
      required: true
    },

    // Time when the gateway last communicated with the server.
    lastCommunicatedAt: {
      type: 'number'
    },

    // Whether or not this gateway has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    tests: {
      collection: 'test',
      via: 'gateways'
    }


  },

  beforeCreate: trimDeviceId,
  beforeUpdate: trimDeviceId

};

function trimDeviceId(vals, cb) {
  if (vals.deviceId) {
    vals.deviceId = vals.deviceId.trim().toUpperCase();
  }
  return cb(null, vals);
}
