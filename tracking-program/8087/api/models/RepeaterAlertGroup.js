/**
 * RepeaterAlertGroup.js
 *
 * @description :: A set of repeater alerts, grouped together by their alert triggering parameters.
 */

module.exports = {

  attributes: {

    // The type of repeater alert.
    // Use the constants in the `sails.config.constants.REPEATER_ALERT_TYPES` set.
    alertType: {
      type: 'number',
      required: true
    },

    // For `GATEWAY_ERROR` alerts, the amount of time that the repeater must
    // be offline before triggering an alert.
    threshold: {
      type: 'number',
      required: true
    },

    // Note to add to the alert.
    note: {
      type: 'string'
    },    

    // The project that this repeater alert group belongs to.
    project: {
      model: 'Project',
      required: true
    },

    // A collection of alert records for specific repeaters.
    alerts: {
      collection: 'RepeaterAlert',
      via: 'group'
    },

    // A collection of users to notify about alert events.
    users: {
      collection: 'User',
      via: 'repeaterAlertGroups'
    },

    // Whether or not this alert group has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },    

  },

};

