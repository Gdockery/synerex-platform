/**
 * MeterAlertEvent.js
 *
 * @description :: An instance of a meter alert "going off", i.e. being triggered.
 */

module.exports = {

  attributes: {

    // The meter that this event pertains to.
    meter: {
      model: 'Meter'
    },

    // The meter alert group that the event's alert is part of.
    alertGroup: {
      model: 'MeterAlertGroup'
    },

    // The project that this meter alert event belongs to.
    project: {
      model: 'Project',
      required: true
    }

  },

};

