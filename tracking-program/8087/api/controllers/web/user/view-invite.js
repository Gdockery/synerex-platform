module.exports = {


  friendlyName: 'View invite',


  description: 'Display invite page.',


  inputs: {

    token: {
      example: 'vt8qeSpSG9+HVXyhoRlecw==',
      required: true
    },

  },


  exits: {

    success: {
      viewTemplatePath: 'accept-invite',
      outputExample: {
        fullName: 'Mary Anne Van Buren',
        email: 'maryannvan@bur.en',
        token: 'vt8qeSpSG9+HVXyhoRlecw=='
      }
    },

    notFound: {
      statusCode: 404
    },

    badRequest: {
      statusCode: 400
    }

  },


  fn: function (inputs, exits) {

    // Get token from inputs (which should include query params) or fallback to req.query
    var req = this.req;
    var token = inputs.token || (req && req.query && req.query.token);
    
    sails.log.info('view-invite: token =', token, 'inputs.token =', inputs.token, 'req.query =', req.query);
    
    if (!token) {
      sails.log.warn('view-invite: No token provided');
      return exits.badRequest('Token parameter is required');
    }

    User.findOne({ resetPasswordToken: token }).exec(function(err, user) {
      if (err) { 
        sails.log.error('view-invite: Error finding user:', err);
        return exits.error(err); 
      }
      if (!user) { 
        sails.log.warn('view-invite: No user found for token:', token);
        return exits.notFound(); 
      }
      sails.log.info('view-invite: Found user:', user.email, 'for token');
      return exits.success({
        token: user.resetPasswordToken,
        email: user.email,
        fullName: user.firstName+' '+user.lastName
      });
    });

  }


};
