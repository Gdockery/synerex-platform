/**
 * MeterDataAggregate.js
 *
 * @description :: A set of data points representing a single day's worth of meter readings for a project.
 */

module.exports = {

  attributes: {

    // The project that this data is for.
    project: {
      model: 'Project',
      required: true
    },

    // The day that the data is for, e.g. '2017-05-01'.
    day: {
      type: 'string',
      required: true
    },

    // The 15 minute interval during which this aggregate is for, including time zone offset.
    // Example: '0/-6:00', '25/+2:00', '95/-5:00'.
    // If blank, the aggregate is for the entire day.
    intervalId: {
      type: 'string',
    },

    // The number of samples included in this aggregate.
    numSamples: {
      type: 'number',
      required: true
    },

    // The timestamp marking the start of this interval period.
    intervalStartTime: {
      type: 'number'
    },

    // The timestamp marking the start of this interval period.
    intervalEndTime: {
      type: 'number'
    },

    //  ┌─┐┌─┐┬ ┬┌─┐┬─┐  ┬─┐┌─┐┌─┐┌┬┐┬┌┐┌┌─┐┌─┐
    //  ├─┘│ ││││├┤ ├┬┘  ├┬┘├┤ ├─┤ │││││││ ┬└─┐
    //  ┴  └─┘└┴┘└─┘┴└─  ┴└─└─┘┴ ┴─┴┘┴┘└┘└─┘└─┘

    // The AVERAGE of all voltage readings for the interval/day.
    avgVolt: {
      type: 'number'
    },

    // The AVERAGE of all amperage readings for the interval/day.
    avgAmp: {
      type: 'number'
    },

    // The AVG of all KW readings for the interval/day.
    avgKw: {
      type: 'number'
    },

    // The SUM of all Kva readings for the interval/day.
    avgKva: {
      type: 'number'
    },

    // The AVERAGE of all power factor readings for the interval/day.
    avgPf: {
      type: 'number'
    },

    // The AVERAGE of all Kvar readings for the interval/day.
    avgKvar: {
      type: 'number'
    },

    // The PEAK KVA reading across the entire day (only valid for daily rollup).
    peakKva: {
      type: 'number',
      allowNull: true
    },

    // The PEAK KW reading across the entire day (only valid for daily rollup).
    peakKw: {
      type: 'number',
      allowNull: true
    },

    multiplier: {
      type: 'number',
      allowNull: true
    }

  },

};

