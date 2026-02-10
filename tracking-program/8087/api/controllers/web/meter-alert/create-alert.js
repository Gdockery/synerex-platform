module.exports = {


  friendlyName: 'Create alert',


  description: 'Create a new meter alert group.',


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
      extendedDescription: 'If provided, must be a positive integer. For `HIGH_DEMAND` alerts, the power reading threshold above which the meter should be put in a warning state.  For `GATEWAY_ERROR` alerts, the amount of time that the meter must  be offline before triggering an alert.',
      example: 200
    },

    delay: {
      description: 'The alert delay.',
      extendedDescription: 'If provided, must be a positive integer. For `HIGH_DEMAND`, the duration that the meter must spend in the warning state (i.e. continuously reporting power usage above the `thresold` value) before triggering an alert.',
      example: 120
    },

    meters: {
      description: 'IDs of meters to add to the alert.',
      extendedDescription: 'Must contain at least one meter ID.',
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
      description: 'The `threshold` or `delay` values were invalid for the specified alert type.',
      statusCode: 400
    },

    badDeviceIds: {
      description: 'One or more of the provided meter IDs were invalid for the specified project.',
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
          delay: 10,
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

    sails.helpers.web.alerts.createAlert(_.extend({ deviceType: 'meter', devices: inputs.meters }, _.omit(inputs, 'meters'))).exec(exits);

  }

};
