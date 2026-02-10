/**
 * RepeaterAlert.js
 *
 * @description :: A single repeater alert, part of a repeater alert group.
 */

module.exports = {

  attributes: {

    // The repeater that this repeater alert represents.
    repeater: {
      model: 'Repeater',
      required: true
    },

    // The repeater alert group that this alert is part of.
    group: {
      model: 'RepeaterAlertGroup',
      required: true
    },

    // If nonzero, the time after which, if this device is still outside
    // the parameters specified for this alert group (e.g. offline for too long a time),
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

