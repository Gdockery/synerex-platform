/**
 * MeterAlert.js
 *
 * @description :: A single meter alert, part of a meter alert group.
 */

module.exports = {

  attributes: {

    // The meter that this meter alert represents.
    meter: {
      model: 'Meter',
      required: true
    },

    // The meter alert group that this alert is part of.
    group: {
      model: 'MeterAlertGroup',
      required: true
    },

    // If nonzero, the time after which, if this meter is still outside
    // the parameters specified for this meter alert group (i.e. reporting
    // power consumption above the threshold, or offline for too long a time),
    // then an alert event should be recorded and notifications possibly sent.
    triggerNotificationOn: {
      type: 'number',
      defaultsTo: 0
    },

    // The time that emails were last sent regarding this alert.  Emails should
    // not be sent more than once per alert per day.
    lastNotificationsSent: {
      type: 'number',
      defaultsTo: 0
    },

  },

};

