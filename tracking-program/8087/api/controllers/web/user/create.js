module.exports = {


  friendlyName: 'Create',


  description: 'Create user.',


  inputs: {

    role: {
      description: 'The user\'s role identifier (see User model for breakdown of what each number means).',
      example: 8,
      required: true
    },

    fullName: {
      example: 'Robeña Johnson',
      required: true
    },

    email: {
      type: 'string',
      required: true
    },

    password: {
      type: 'string',
      defaultsTo: ''
    },

    client: {
      description: 'The client that this user represents.',
      extendedDescription: 'Only relevant if this user account is for a client stakeholder.',
      example: 138,
    },

    projects: {
      description: 'An array of project ids this user should have access to.',
      extendedDescription: 'Only relevant if this user account is for a client stakeholder or XECO manager (aka "XECO user").',
      example: [ 3 ]
    }

  },


  exits: {

    success: {
      outputDescription: 'A report containing the new user\'s ID and their token (if relevant).',
      outputExample: {
        meta: {},
        response: {
          uriEncodedToken: 'vt8qeSpSG9%2BHVXyhoRlecw%3D%3D',
          id: 123,
          reEnabledUser: false
        }
      },
      extendedDescription: 'If a password was specified, then `token` will be the empty string ("").'
    },

    badRequest: { statusCode: 400 },
    conflict: { statusCode: 409 }

  },


  fn: function (inputs, exits) {

    sails.helpers.web.user.parse({
      data: inputs
    }).exec({
      error: exits.error,
      badRequest: exits.badRequest,
      success: function(valuesToSet){

        User.findOne({
          email: valuesToSet.email,
          isDeleted: true
        })
        .exec(function(err, existingUser){
          if (err) { return exits.error(err); }

          if(existingUser) { // re-enable the user

            valuesToSet.isDeleted = false;

            User.update({
              id: existingUser.id
            })
            .set(valuesToSet)
            .meta({fetch:true})
            .exec(function(err, updatedRecords) {
              if (err) {
                return exits.error(err);
              }
    
              var reEnabledUser = updatedRecords[0];
              
              // Send invite email if no password was provided (user needs to set their own password)
              if (valuesToSet.resetPasswordToken && !valuesToSet.hashedPassword) {
                var querystring = require('querystring');
                // Get emailHost from config, with fallback to portal.xecoenergy.com
                var emailHost = (sails.config.email && sails.config.email.emailHost) || 'portal.xecoenergy.com';
                const localHostnames = (process.env.LOCAL_HOSTNAMES || '')
                  .split(',')
                  .map((entry) => entry.trim())
                  .filter(Boolean);
                // Override local hostnames with portal.xecoenergy.com (server is on portal.xecoenergy.com even if env is "development")
                if (localHostnames.some((host) => emailHost.indexOf(host) !== -1)) {
                  emailHost = 'portal.xecoenergy.com';
                }
                var protocol = emailHost === 'portal.xecoenergy.com' ? 'https' : 'http';
                var link = protocol + '://' + emailHost + '/invite/accept?' + querystring.stringify({token: valuesToSet.resetPasswordToken});
                
                sails.log.info('Re-enabled user invite email link generated:', link);
                sails.log.info('Token being used:', valuesToSet.resetPasswordToken);
                
                sails.helpers.web.whitelabel.getBrandName({req: this.req}).exec(function(err, brandName) {
                  if (err) { brandName = 'Xeco'; }
                  sails.helpers.sendTemplateEmail({
                    to: [reEnabledUser.email],
                    subject: 'Welcome back to ' + brandName + ' Energy Portal',
                  template: 'invite-user',
                  templateData: {
                    link: link,
                    user: reEnabledUser
                  }
                }).exec(function(err) {
                  if (err) {
                    sails.log.error('Error sending invite email to ' + reEnabledUser.email + ': ' + require('util').inspect(err, {depth: null}));
                    // Don't fail the user re-enable if email fails, just log it
                  } else {
                    sails.log.info('Invite email sent to re-enabled user ' + reEnabledUser.email);
                  }
                });
                }); // Close getBrandName callback
              }
    
              return exits.success({
                response: {
                  uriEncodedToken: encodeURIComponent(valuesToSet.resetPasswordToken),
                  id: existingUser.id,
                  reEnabledUser: true
                }
              });
            });
    
          } else { // create the user

            User.create(valuesToSet)
            .meta({ fetch: true })
            .exec(function(err, newRecord) {
              if (err) {
                if (err.code === 'E_UNIQUE') { return exits.conflict(err); }
                else { return exits.error(err); }
              }
    
              // Send invite email if no password was provided (user needs to set their own password)
              if (valuesToSet.resetPasswordToken && !valuesToSet.hashedPassword) {
                var querystring = require('querystring');
                // Get emailHost from config, with fallback to portal.xecoenergy.com
                var emailHost = (sails.config.email && sails.config.email.emailHost) || 'portal.xecoenergy.com';
                const localHostnames = (process.env.LOCAL_HOSTNAMES || '')
                  .split(',')
                  .map((entry) => entry.trim())
                  .filter(Boolean);
                // Override local hostnames with portal.xecoenergy.com (server is on portal.xecoenergy.com even if env is "development")
                if (localHostnames.some((host) => emailHost.indexOf(host) !== -1)) {
                  emailHost = 'portal.xecoenergy.com';
                }
                var protocol = emailHost === 'portal.xecoenergy.com' ? 'https' : 'http';
                var link = protocol + '://' + emailHost + '/invite/accept?' + querystring.stringify({token: valuesToSet.resetPasswordToken});
                
                sails.log.info('New user invite email link generated:', link);
                sails.log.info('Token being used:', valuesToSet.resetPasswordToken);
                
                sails.helpers.web.whitelabel.getBrandName({req: this.req}).exec(function(err, brandName) {
                  if (err) { brandName = 'Xeco'; }
                  sails.helpers.sendTemplateEmail({
                    to: [newRecord.email],
                    subject: 'Welcome to ' + brandName + ' Energy Portal',
                    template: 'invite-user',
                    templateData: {
                      link: link,
                      user: newRecord
                    }
                  }).exec(function(err) {
                  if (err) {
                    sails.log.error('Error sending invite email to ' + newRecord.email + ': ' + require('util').inspect(err, {depth: null}));
                    // Don't fail the user creation if email fails, just log it
                  } else {
                    sails.log.info('Invite email sent to ' + newRecord.email);
                  }
                });
                });
              }
    
              return exits.success({
                response: {
                  uriEncodedToken: encodeURIComponent(valuesToSet.resetPasswordToken),
                  id: newRecord.id,
                  reEnabledUser: false
                }
              });
    
            });//</ User.create().exec() >
    
          }
        });
      }
    });//</ .parse() >

  }


};
