module.exports = {


  friendlyName: 'Update',


  description: 'Update user.',


  inputs: {

    id: {
      description: 'The ID of the record to update.',
      example: 123,
      required: true
    },

    fullName: {
      example: 'Robeña Johnson'
    },

    email: {
      type: 'string'
    },

    password: {
      description: 'A new password (or set to empty string to invalidate this user\'s password).',
      type: 'string'
    },

    projects: {
      description: 'An array of project ids this user should have access to.',
      extendedDescription: 'Only relevant if this user account is for a client stakeholder or XECO manager (aka "XECO user").',
      example: [ 3 ]
    }
  },


  exits: {
    success: {
      outputDescription: 'A report containing the user\'s token (if relevant).',
      outputExample: {
        response: {
          uriEncodedToken: 'vt8qeSpSG9%2BHVXyhoRlecw%3D%3D'
        }
      },
      extendedDescription:
      'In most cases, `token` will be the empty string ("").  The only time that won\'t be the case '+
      'is if the password was set to "" (empty string).'
    },

    badRequest: { statusCode: 400 },
    notFound: { statusCode: 404 },
    conflict: { statusCode: 409 }
  },


  fn: function (inputs, exits) {

    sails.helpers.web.user.parse({
      data: _.omit(inputs, ['id'])
    }).exec({
      error: exits.error,
      badRequest: exits.badRequest,
      success: function(valuesToSet){

        if (valuesToSet.projects) {

          User.replaceCollection(inputs.id, 'projects', valuesToSet.projects).exec(function(err) {
            if (err) {
              return exits.error(err);
            }
            return exits.success();
          });

          return;

        }

        // Now update the user record.
        User.update({
          id: inputs.id,
          isDeleted: { '!=': true }
        })
        .set(valuesToSet)
        .meta({fetch:true})
        .exec(function(err, updatedRecords) {
          if (err) {
            if (err.code === 'E_UNIQUE') { return exits.conflict(err); }
            else { return exits.error(err); }
          }

          if (updatedRecords.length === 0) { return exits.notFound(); }
          if (updatedRecords.length > 1) {
            return exits.error(new Error(
              'Consistency violation: Only one record should have been updated.  '+
              '(But actually, it appears that '+updatedRecords.length+' records were updated!)'
            ));
          }

          return exits.success({
            response: {
              uriEncodedToken: encodeURIComponent(valuesToSet.resetPasswordToken || ''),
            }
          });

        });//</ User.update().exec() >
      }
    });//</ .parse() >

  }


};
