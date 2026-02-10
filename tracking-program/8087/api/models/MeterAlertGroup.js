/**
 * MeterAlertGroup.js
 *
 * @description :: A set of meter alerts, grouped together by their alert triggering parameters.
 */

module.exports = {

  attributes: {

    // The type of meter alert.
    // Use the constants in the `sails.config.constants.METER_ALERT_TYPES` set.
    alertType: {
      type: 'number',
      required: true
    },

    // For `HIGH_DEMAND` alerts, the power reading threshold above
    // which the meter should be put in a warning state.
    //
    // For `GATEWAY_ERROR` alerts, the amount of time that the meter must
    // be offline before triggering an alert.
    threshold: {
      type: 'number',
      required: true
    },

    // For `HIGH_DEMAND`, the duration that the meter must spend
    // in the warning state (i.e. continuously reporting power usage above
    // the `thresold` value) before triggering an alert.
    delay: {
      type: 'number'
    },

    // Note to add to the alert.
    note: {
      type: 'string'
    },

    // The project that this meter alert group belongs to.
    project: {
      model: 'Project',
      required: true
    },

    // A collection of alert records for specific meters.
    alerts: {
      collection: 'MeterAlert',
      via: 'group'
    },

    // A collection of users to notify about alert events.
    users: {
      collection: 'User',
      via: 'meterAlertGroups'
    },

    // Whether or not this alert group has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

  },

};

