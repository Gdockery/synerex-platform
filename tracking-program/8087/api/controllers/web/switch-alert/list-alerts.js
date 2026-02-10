module.exports = {


  friendlyName: 'List project switch alerts',


  description: 'List all the switch alert groups for a project.',


  inputs: {

    project: {
      description: 'The ID of the project to list switch alerts for.',
      example: 123,
      required: true
    },

  },


  exits: {
    success: {
      outputExample: {
        meta: {},
        response: [{
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
        }]
      }
    },
    unauthorized: {
      statusCode: 404
    }
  },

  fn: function (inputs, exits) {
    var req = this.req;

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    sails.helpers.web.alerts.listAlerts(_.extend({ deviceType: 'switch' }, inputs)).exec(exits);

  }


};
