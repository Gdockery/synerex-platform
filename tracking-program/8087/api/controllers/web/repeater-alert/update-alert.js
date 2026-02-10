module.exports = {


  friendlyName: 'Update alert',


  description: 'Update an existing repeater alert group.',


  inputs: {

    id: {
      description: 'The ID of the repeater alert group to update.',
      example: 123,
      required: true
    },

    repeaters: {
      description: 'IDs of repeaters to add to the alert.',
      extendedDescription: 'This list, if provided, will completely replace the previous list of repeaters attached to this alert.',
      example: [1]
    },

    users: {
      description: 'IDs of users to add to the alert.',
      extendedDescription: 'This list, if provided, will completely replace the previous list of users attached to this alert.',
      example: [1],
    }

  },


  exits: {

    badDeviceIds: {
      description: 'One or more of the provided repeater IDs were invalid for the specified project.',
      statusCode: 400
    },

    badUserIds: {
      description: 'One or more of the provided user IDs were invalid for the specified project.',
      statusCode: 400
    },

    unauthorized: {
      statusCode: 404
    },

    notFound: {
      statusCode: 404
    },

    success: {
      outputExample: {
        meta: {},
        response: {
          alertType: 1,
          threshold: 255,
          devices: [{
            id: 123,
            name: 'Repeater #1'
          }],
          users: [{
            id: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acmeinc.com'
          }]
        }
      }
    },

  },


  fn: function (inputs, exits) {
    var req = this.req;

    sails.helpers.web.alerts.updateAlert(_.extend({ deviceType: 'repeater', devices: inputs.repeaters, user: req.user }, _.omit(inputs, 'repeaters'))).exec({
      badDeviceIds: exits.badDeviceIds,
      badUserIds: exits.badUserIds,
      unauthorized: exits.unauthorized,
      notFound: exits.notFound,
      error: exits.error,
      success: function() {
        sails.helpers.web.alerts.getAlertDetails({ deviceType: 'repeater', user: req.user, id: inputs.id }).exec(exits);
      }
    });

  }

};
