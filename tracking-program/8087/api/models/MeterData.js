/**
 * MeterData.js
 *
 * @description :: A set of data points for a power meter at a specific time.
 */

module.exports = {

  attributes: {

    // The power meter that reported the data.
    meter: {
      model: 'Meter',
    },

    // MAC address of the mesh note that reported the data.
    // Useful mainly for cases where the meter starts sending data before
    // being entered into the portal.
    meshId: {
      type: 'string'
    },

    // The time that the data was recorded by the meter.
    recordedAt: {
      type: 'number',
      required: true
    },

    // The day that the data was recorded, e.g. 2017-05-01.
    // Useful for doing aggregations.
    day: {
      type: 'string',
      required: true
    },

    // The minute of the hour that the data was recorded, 0 - 59.
    // Useful for doing aggregations.
    minute: {
      type: 'number',
      required: true
    },

    // The 15 minute interval during which this data was recorded, including time zone offset.
    // Example: '0/-6:00', '25/+2:00', '95/-5:00'.
    // Useful for doing aggregations.
    intervalId: {
      type: 'string',
      required: true
    },

    // Whether this record represents a "known read", requested directly from the meter.
    knownRead: {
      type: 'boolean',
      allowNull: true,
      defaultsTo: false
    },

    //  ┌─┐┌─┐┬ ┬┌─┐┬─┐  ┬─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐┌─┐
    //  ├─┘│ ││││├┤ ├┬┘  ├┬┘├┤ ├─┤ │││││││ ┬└─┐
    //  ┴  └─┘└┴┘└─┘┴└─  ┴└─└─┘┴ ┴─┴┘┴┘└┘└─┘└─┘
    l1Volt: {
      type: 'number'
    },

    l1Amp: {
      type: 'number'
    },

    l1Kw: {
      type: 'number'
    },

    l1Kva: {
      type: 'number'
    },

    l1Pf: {
      type: 'number'
    },

    l1THD: {
      type: 'number',
      allowNull: true,
    },

    l1Kvar: {
      type: 'number'
    },

    l2Volt: {
      type: 'number'
    },

    l2Amp: {
      type: 'number'
    },

    l2Kw: {
      type: 'number'
    },

    l2Kva: {
      type: 'number'
    },

    l2Pf: {
      type: 'number'
    },

    l2THD: {
      type: 'number',
      allowNull: true,
    },


    l2Kvar: {
      type: 'number'
    },

    l3Volt: {
      type: 'number'
    },

    l3Amp: {
      type: 'number'
    },

    l3Kw: {
      type: 'number'
    },

    l3Kva: {
      type: 'number'
    },

    l3Pf: {
      type: 'number'
    },

    l3THD: {
      type: 'number',
      allowNull: true,
    },

    l3Kvar: {
      type: 'number'
    },

    totalVolt: {
      type: 'number'
    },

    totalAmp: {
      type: 'number'
    },

    totalKw: {
      type: 'number'
    },

    totalKva: {
      type: 'number'
    },

    totalPf: {
      type: 'number'
    },

    totalKvar: {
      type: 'number'
    },

    totalTHD: {
      type: 'number',
      allowNull: true,
    },

    outputAmp: {
      type: 'number',
      allowNull: true,
    },

    // The raw data from the meter.
    // This contains all 210 registers read from the meter.
    rawData: {
      type: 'json'
    }

  },

};

