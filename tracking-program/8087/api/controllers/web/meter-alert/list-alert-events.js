module.exports = {


  friendlyName: 'List project meter alert events',


  description: 'List the recent meter alert events for a project.',


  inputs: {
    project: {
      description: 'The ID of the project to pull recent meter alert event data for.',
      example: 123,
      required: true
    },

    page: {
      description: 'Page number to retrieve.',
      example: 1,
      defaultsTo: 1
    },

  },


  exits: {
    success: {
      outputExample: {
        meta: {
          page: 1,
          total: 55
        },
        response: [{
          id: 123,
          createdAt: 12345,
          alert: {
            id: 123,
            alertType: 1,
            threshold: 123,
            delay: 123
          },
          device: {
            id: 123,
            name: 'Some meter'
          }
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

    sails.helpers.web.alerts.listAlertEvents(_.extend({ deviceType: 'meter' }, inputs)).exec(exits);

  }


};
