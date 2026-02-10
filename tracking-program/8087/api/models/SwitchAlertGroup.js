/**
 * SwitchAlertGroup.js
 *
 * @description :: A set of switch alerts, grouped together by their alert triggering parameters.
 */

module.exports = {

  attributes: {

    // The type of switch alert.
    // Use the constants in `sails.config.constants.SWITCH_ALERT_TYPES`.
    alertType: {
      type: 'number',
      required: true
    },

    // For `GATEWAY_ERROR` alerts, the amount of time that the switch must
    // be offline before triggering an alert.
    threshold: {
      type: 'number',
      required: true
    },

    // Note to add to the alert.
    note: {
      type: 'string'
    },    

    // The project that this alert group belongs to.
    project: {
      model: 'Project',
      required: true
    },

    // A collection of alert records for specific devices.
    alerts: {
      collection: 'SwitchAlert',
      via: 'group'
    },

    // A collection of users to notify about alert events.
    users: {
      collection: 'User',
      via: 'switchAlertGroups'
    },

    // Whether or not this alert group has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },    

  },

};

