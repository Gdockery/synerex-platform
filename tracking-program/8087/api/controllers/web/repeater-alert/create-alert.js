module.exports = {


  friendlyName: 'Create alert',


  description: 'Create a new repeater alert group.',


  inputs: {

    project: {
      description: 'The ID of the project to create the alert group for.',
      example: 123,
      required: true
    },

    alertType: {
      description: 'The type of alert that this group represents.',
      example: 1,
      required: true
    },

    threshold: {
      description: 'The alert threshold.',
      extendedDescription: 'Must be a positive integer. For `GATEWAY_ERROR` alerts, the amount of time that the repeater must be offline before triggering an alert.',
      example: 200,
      required: true
    },

    repeaters: {
      description: 'IDs of repeaters to add to the alert.',
      extendedDescription: 'Must contain at least one repeater ID.',
      example: [1],
      required: true
    },

    users: {
      description: 'IDs of users to add to the alert.',
      example: [1]
    }

  },


  exits: {

    badAlertType: {
      description: 'The given `alertType` value was invalid.',
      statusCode: 400,
      outputExample: ''
    },

    badAlertParameters: {
      description: 'The `threshold` value was invalid for the specified alert type.',
      statusCode: 400
    },

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

    success: {
      outputExample: {
        meta: {},
        response: {
          id: 123,
          alertType: 1,
          threshold: 255,
          deviceCount: 3,
          users: [{
            id: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acmeinc.com'
          }]
        }
      }
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    sails.helpers.web.alerts.createAlert(_.extend({ deviceType: 'repeater', devices: inputs.repeaters }, _.omit(inputs, 'repeaters'))).exec(exits);

  }

};
