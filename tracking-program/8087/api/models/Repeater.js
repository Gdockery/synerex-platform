/**
 * Repeater.js
 *
 * @description :: A single repeater.
 */

module.exports = {

  attributes: {

    // The human-readable name (label) for this repeater.
    name: {
      type: 'string',
      required: true
    },

    // Serial number of the network device (e.g. Pi-board) being used as a repeater.
    deviceId: {
      type: 'string',
      required: true, 
      custom: function(val) {
        return val.trim().toUpperCase().match(/^([A-F0-9]{2}:){5}[A-F0-9]{2}$/);
      }
    },

    // MAC address of the this repeater's mesh node (e.g. the Pi-board's wireless controller MAC address).
    meshId: {
      type: 'string'
    },

    meshIp: {
      type: 'string',
      allowNull: true,
    },

    // The last time that data was received from this repeater.
    lastCommunicatedAt: {
      type: 'number'
    },

    gateway: {
      type: 'string',
      allowNull: true, 
    },

    // The project that this repeater belongs to.
    project: {
      model: 'project'
    },

    meshLastCommunicatedAt: {
      type: 'number'
    },

    // Whether or not this repeater has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
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
