/**
 * SwitchAlertEvent.js
 *
 * @description :: An instance of a switch alert "going off", i.e. being triggered.
 */

module.exports = {

  attributes: {

    // The switch that this event pertains to.
    switch: {
      model: 'Switch'
    },

    // The switch alert group that the event's alert is part of.
    alertGroup: {
      model: 'SwitchAlertGroup'
    },

    // The project that this switch alert event belongs to.
    project: {
      model: 'Project',
      required: true
    }

  },

};

