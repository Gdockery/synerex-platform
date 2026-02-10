module.exports = {


  friendlyName: 'Accept invite',


  description: 'Accept an invite by choosing a password and optionally uploading a profile image.',


  inputs: {

    token: {
      example: 'vt8qeSpSG9+HVXyhoRlecw==',
      required: true
    },

    password: {
      description: 'Raw password, in plain text.',
      type: 'string',
      required: true
    }

  },


  exits: {
    notFound: { statusCode: 404 }
  },


  fn: function (inputs, exits) {

    var stdlib = require('sails-stdlib');


    var req = this.req;

    sails.log.info('accept-invite: Received request, token:', inputs.token ? inputs.token.substring(0, 10) + '...' : 'missing', 'password length:', inputs.password ? inputs.password.length : 0);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // FUTURE: handle profile image
    // ```
    // this.req.file('avatarSrc').upload({ });
    // ```
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    User.getDatastore().transaction(function (db, proceed) {
      User.findOne({ resetPasswordToken: inputs.token })
      .usingConnection(db)
      .exec(function(err, user) {
        if (err) { 
          sails.log.error('accept-invite: Error finding user:', err);
          return proceed(err); 
        }
        if (!user) { 
          sails.log.warn('accept-invite: No user found for token:', inputs.token ? inputs.token.substring(0, 10) + '...' : 'missing');
          return proceed(flaverr('notFound', new Error('...'))); 
        }

        sails.log.info('accept-invite: Found user:', user.email, 'id:', user.id);

        // Track as logged in
        req.session.userId = user.id;
        sails.log.info('accept-invite: Set session.userId to:', user.id);

        // Hash new password
        var bcrypt = require('bcryptjs');
        bcrypt.hash(inputs.password, 8, function(err, hashedPassword) {
          if (err){ 
            sails.log.error('accept-invite: Error hashing password:', err);
            return proceed(err); 
          }

          sails.log.info('accept-invite: Password hashed, updating user record');

          // Update user record
          // > (note that we regenerate reset password token here so that the same
          // > invite link can't be used over and over again like 6 months later)
          User.update({ id: user.id })
          .usingConnection(db)
          .set({
            hashedPassword: hashedPassword,
            resetPasswordToken: sails.helpers.web.user.getNewToken().execSync()
          })
          .exec(function(err) {
            if (err) { 
              sails.log.error('accept-invite: Error updating user:', err);
              return proceed(err); 
            }
            sails.log.info('accept-invite: User updated successfully, userId:', user.id);
            return proceed();
          });

        });

      });
    }).exec(function(err) {
      if (err && err.code === 'notFound') { 
        sails.log.warn('accept-invite: User not found');
        return exits.notFound(); 
      }
      if (err) { 
        sails.log.error('accept-invite: Transaction error:', err);
        return exits.error(err); 
      }
      sails.log.info('accept-invite: Successfully completed, session.userId should be:', req.session.userId);
      // Save session explicitly to ensure it's persisted
      req.session.save(function(err) {
        if (err) {
          sails.log.error('accept-invite: Error saving session:', err);
        } else {
          sails.log.info('accept-invite: Session saved successfully');
        }
      });
      return exits.success();
    });


  }


};
