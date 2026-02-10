
module.exports = {
  friendlyName: 'Get logged in user details',

  description: 'Get the full details of the currently logged-in user.',

  inputs: {},

  exits: {
    success: {
      outputExample: {
        meta: {},
        response: {
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@acmeinc.com',
          defaultProject: {
            id: 1,
            name: 'some project'
          },
          lastActiveAt: 150000,
        }
      }
    }
  },

  fn: function (inputs, exits) {
    var req = this.req;

    // 🚀 Debug Logs
    sails.log.info('Incoming request to /api/account');
    sails.log.info('Request Headers:', req.headers);

    // Check if the user session exists
    if (!req.user) {
      sails.log.warn('User session not found. Possible reasons:');
      sails.log.warn('- Token may be missing or invalid');
      sails.log.warn('- Session expired');
      sails.log.warn('- Request did not include Authorization header');

      return exits.success({
        error: 'User session not found. Ensure you are logged in.'
      });
    }

    sails.log.info('Me session:', req.me);
    sails.log.info('User session:', req.user);

    return exits.success({
      meta: {},
      response: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        defaultProject: _.find(req.user.projects, { id: req.user.defaultProject }),
        lastActiveAt: req.user.lastActiveAt,
      }
    });
  }
};
/*module.exports = {


  friendlyName: 'Get logged in user details',


  description: 'Get the full details of the currently logged-in user.',


  inputs: {

  },


  exits: {
    success: {
      outputExample: {
        meta: {},
        response: {
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doc@acmeinc.com',
          defaultProject: {
            id: 1,
            name: 'some project'
          },
          lastActiveAt: 150000,
        }
      }
    }
  },


  fn: function (inputs, exits) {
    var req = this.req;
    console.log('Me session:', req.me);
    console.log('User session:', req.user);

    return exits.success({
      meta: {},
      response: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        defaultProject: _.find(req.user.projects, {id: req.user.defaultProject}),
        lastActiveAt: req.user.lastActiveAt,
      }
    });

  }


};*/
