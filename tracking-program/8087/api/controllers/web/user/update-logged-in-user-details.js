module.exports = {


  friendlyName: 'Update logged in user details',


  description: 'Update the details of the currently logged-in user',


  inputs: {

    firstName: {
      example: 'John',
      description: 'Value to set as the user\'s new first name.'
    },

    lastName: {
      example: 'Doe',
      description: 'Value to set as the user\'s new last name.'
    },

    email: {
      example: 'john.doe@acmeinc.com',
      description: 'Value to set as the user\'s new email address.'
    },

    password: {
      example: 'abc123',
      description: 'Value to set as the user\'s new password.'
    },

    logo: {
      example: "===",
      description: 'logo of user company'
    },

    defaultProject: {
      example: 1,
      description: 'ID of the project to set as the user\'s new default.'
    }

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
          }
        }
      }
    },

    emailInUse: {
      description: 'The email address provided is already in use by another user.',
      statusCode: 409
    },

    invalidEmail: {
      description: 'The email address provided was not valid.',
      statusCode: 400
    },

    invalidPassword: {
      description: 'The password provided was not valid.',
      statusCode: 400
    },

    invalidName: {
      description: 'The first or last name provided was not valid.',
      statusCode: 400
    },

    invalidProject: {
      description: 'The chosen default project is not valid for this user.',
      statusCode: 400
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    var bcrypt = require('bcryptjs');

    var updates = {};

    //  ╦╔╗╔╔═╗╦ ╦╔╦╗  ┬  ┬┌─┐┬  ┬┌┬┐┌─┐┌┬┐┬┌─┐┌┐┌┌─┐
    //  ║║║║╠═╝║ ║ ║   └┐┌┘├─┤│  │ ││├─┤ │ ││ ││││└─┐
    //  ╩╝╚╝╩  ╚═╝ ╩    └┘ ┴ ┴┴─┘┴─┴┘┴ ┴ ┴ ┴└─┘┘└┘└─┘

    // Validate first/last name.
    if (!_.isUndefined(inputs.firstName)) {
      if (inputs.firstName === '') {
        return exits.invalidName();
      }
      updates.firstName = inputs.firstName.trim();
    }

    if (!_.isUndefined(inputs.lastName)) {
      if (inputs.lastName === '') {
        return exits.invalidName();
      }
      updates.lastName = inputs.lastName.trim();
    }

    if (!_.isUndefined(inputs.defaultProject)) {
      if (!_.find(req.user.projects, {id: inputs.defaultProject})) {
        return exits.invalidProject();
      }
      updates.defaultProject = inputs.defaultProject;
    }

    async.auto({

      validateEmail: function(cb) {

        if (_.isUndefined(inputs.email)) { return cb(); }
        sails.helpers.web.user.validateEmailAddress({ string: inputs.email }).exec(function(err, email) {
          if (err) { return cb('invalidEmail'); }
          updates.email = email;
          return cb();
        });

      },

      validatePassword: function(cb) {

        if (_.isUndefined(inputs.password)) { return cb(); }
        // Strictly validate the password.
        // (Remember: it should have already been validated by front-end code)
        if (sails.helpers.web.auth && sails.helpers.web.auth.validateUserPassword) {
          sails.helpers.web.auth.validateUserPassword({
            string: inputs.password
          }).exec(function(err) {
            if (err) { return cb('invalidPassword');}

            bcrypt.hash(inputs.password, 8, function(err, encryptedPassword) {

              if (err) {
                return cb(new Error('Cannot encrypt password.  Details: '+err.stack));
              }

              updates.hashedPassword = encryptedPassword;

              return cb();

            });
          });
        }
      }

    }, function (err) {

      if (err && exits[err]) {
        return exits[err]();
      }

      if (err) {
        return exits.error(err);
      }

      if (!_.isUndefined(inputs.logo)) {
        updates.userCompanyLogo = inputs.logo;
        console.log(inputs.logo);
        console.log(updates.userCompanyLogo);
      }

      User.update({id: req.user.id}, updates)
      .meta({fetch: true})
      .exec(function(err, affectedUsers) {

        if (err) { return exits.error(err); }
        if (affectedUsers.length > 1) { return exits.error(new Error('More than one user affected while updating user ID #' + req.user.id + '!')); }

        return exits.success({
          meta: {},
          response: {
            id: affectedUsers[0].id,
            firstName: affectedUsers[0].firstName,
            lastName: affectedUsers[0].lastName,
            email: affectedUsers[0].email,
            logo: affectedUsers[0].logo,
            defaultProject: _.find(req.user.projects, {id: affectedUsers[0].defaultProject})
          }
        });

      });


    });


  }


};
