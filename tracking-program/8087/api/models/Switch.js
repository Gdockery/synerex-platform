/**
 * Switch.js
 *
 * @description :: A single switch.
 */

module.exports = {

  attributes: {

    // The human-readable name for this switch.
    name: {
      type: 'string',
      required: true
    },

    // Identifier of the network device the meter is attached to (e.g. a Pi-board serial #).
    deviceId: {
      type: 'string',
      required: true,
      custom: function(val) {
        return val.trim().toUpperCase().match(/^([A-F0-9]{2}:){5}[A-F0-9]{2}$/);
      }
    },

    // MAC address of the mesh node that this meter is attached to.
    meshId: {
      type: 'string'
    },

    meshIp: {
      type: 'string',
      allowNull: true,
    },


    gateway: {
      type: 'string',
      allowNull: true, 
    },

    // The type of device that this switch is attached to.
    // Use a value from the `sails.config.constants.DEVICE_TYPES` set.
    deviceType: {
      type: 'number',
      required: true
    },

    ampLoad: {
      type: 'number',
      allowNull: true,
    },

    voltage: {
      type: 'number',
      allowNull: true,
    },

    pf: {
      type: 'number',
      allowNull: true,
    },

    originalHours: {
      type: 'number',
      allowNull: true,
    },

    // The last time that data was received from this switch.
    lastCommunicatedAt: {
      type: 'number'
    },

    // The last time that data was received from the mesh that this switch is on.
    meshLastCommunicatedAt: {
      type: 'number'
    },

    // The project that this repeater belongs to.
    project: {
      model: 'project'
    },

    // Whether or not this repeater has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    hasSchedule: {
      type: 'boolean',
      defaultsTo: false
    },


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
