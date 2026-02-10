/**
 * RepeaterAlertEvent.js
 *
 * @description :: An instance of a repeater alert "going off", i.e. being triggered.
 */

module.exports = {

  attributes: {

    // The repeater that this event pertains to.
    repeater: {
      model: 'Repeater'
    },

    // The repeater alert group that the event's alert is part of.
    alertGroup: {
      model: 'RepeaterAlertGroup'
    },

    // The project that this repeater alert event belongs to.
    project: {
      model: 'Project',
      required: true
    }

  },

};

