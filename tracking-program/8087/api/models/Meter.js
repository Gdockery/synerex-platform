/**
 * Meter.js
 *
 * @description :: A power meter with a mesh unit attached.
 */

module.exports = {

  attributes: {

    // Human-readable name (label) for the meter.
    name: {
      type: 'string',
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

    // Serial # of the meter.
    meterSerialNumber: {
      type: 'string'
    },

    gateway: {
      type: 'string',
      allowNull: true,
    },

    lastTimestamp: {
      type: 'number',
      allowNull: true
    },

    // The project that this meter belongs to.
    project: {
      model: 'project'
    },

    // The last time that data was received from this meter.
    lastCommunicatedAt: {
      type: 'number'
    },

    // The last time that data was received from the mesh that this meter is on.
    meshLastCommunicatedAt: {
      type: 'number'
    },

    // Whether or not this meter has been deleted from the system.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    isReporting: {
      type: 'boolean',
      defaultsTo: true
    },

    //  ┬─┐┌─┐┌─┐┌─┐┌┐┌┌┬┐  ┌─┐┌─┐┬ ┬┌─┐┬─┐  ┬─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐┌─┐
    //  ├┬┘├┤ │  ├┤ │││ │   ├─┘│ ││││├┤ ├┬┘  ├┬┘├┤ ├─┤ │││││││ ┬└─┐
    //  ┴└─└─┘└─┘└─┘┘└┘ ┴   ┴  └─┘└┴┘└─┘┴└─  ┴└─└─┘┴ ┴─┴┘┴┘└┘└─┘└─┘
    lastL1Volt: {
      type: 'number'
    },

    lastL1Amp: {
      type: 'number'
    },

    lastL1Kw: {
      type: 'number'
    },

    lastL1Kva: {
      type: 'number'
    },

    lastL1Pf: {
      type: 'number'
    },

    lastL1Kvar: {
      type: 'number'
    },

    lastL2Volt: {
      type: 'number'
    },

    lastL2Amp: {
      type: 'number'
    },

    lastL2Kw: {
      type: 'number'
    },

    lastL2Kva: {
      type: 'number'
    },

    lastL2Pf: {
      type: 'number'
    },

    lastL2Kvar: {
      type: 'number'
    },

    lastL3Volt: {
      type: 'number'
    },

    lastL3Amp: {
      type: 'number'
    },

    lastL3Kw: {
      type: 'number'
    },

    lastL3Kva: {
      type: 'number'
    },

    lastL3Pf: {
      type: 'number'
    },

    lastL3Kvar: {
      type: 'number'
    },

    lastTotalVolt: {
      type: 'number'
    },

    lastTotalAmp: {
      type: 'number'
    },

    lastTotalKw: {
      type: 'number'
    },

    lastTotalKva: {
      type: 'number'
    },

    lastTotalPf: {
      type: 'number'
    },

    lastTotalKvar: {
      type: 'number'
    },

    lastTotalTHD: {
      type: 'number',
      allowNull: true
    },

    peakTime: {
      type: 'string',
      allowNull: true,
    },

    isSub: {
      type: 'number',
      allowNull: true,
    },

    isMain: {
      type: 'number',
      allowNull: true,
    },

    isFilter: {
      type: 'number',
      allowNull: true,
    },

    multiplier: {
      type: 'number',
      allowNull: true,
    },

    lastOutputAmp: {
      type: 'number',
      allowNull: true,
    },


    monthKwh: {type: 'number', defaultsTo: 0},
    weekKwh: {type: 'number', defaultsTo: 0},
    todayKwh: {type: 'number', defaultsTo: 0},
    lastMonthKwh: {type: 'number', defaultsTo: 0},
    lastKwh: {type: 'number', defaultsTo: 0},
    avg15MinuteKva: { type: 'number' , defaultsTo: 0},
    monthPeak: { type: 'number' , defaultsTo: 0},

    lastMonthPeak: { type: 'number' , defaultsTo: 0},
    lastMonthSavings: { type: 'number' , defaultsTo: 0},
    lastMonthBudget: { type: 'number' , defaultsTo: 0},
    yearSavings: { type: 'number' , defaultsTo: 0},
    lastYearSavings: { type: 'number' , defaultsTo: 0},

    lastMonthSavings: { type: 'number' , defaultsTo: 0},
    lastMonthBudget: { type: 'number' , defaultsTo: 0},
    yearSavings: { type: 'number' , defaultsTo: 0},

    projectSavings: { type: 'number' , defaultsTo: 0},
    monthI2RLoss: { type: 'number' , defaultsTo: 0},
    lastMonthI2RLoss: { type: 'number' , defaultsTo: 0},
    yearI2RLoss: { type: 'number' , defaultsTo: 0},
    lastYearI2RLoss: { type: 'number' , defaultsTo: 0},
    projectI2RLoss: { type: 'number' , defaultsTo: 0},
    todayI2RLoss: { type: 'number' , defaultsTo: 0},
    weekI2RLoss: { type: 'number' , defaultsTo: 0},
    kwhSavings: { type: 'number' , defaultsTo: 0},
    kwPeakSavings: { type: 'number' , defaultsTo: 0},

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
