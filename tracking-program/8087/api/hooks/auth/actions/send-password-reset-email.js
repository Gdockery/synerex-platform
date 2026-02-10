module.exports = {

  machine: {


    friendlyName: 'Send password reset email',


    description: 'Generate a password token, save it in the database, and then send it to the supposed user\'s email address.',


    extendedDescription: 'This endpoint should be IP rate-limited for security reasons.',


    inputs: {

      email: {
        description: 'The email address of the alleged user who wants to recover their password.',
        example: 'particlebanana@treeline.io',
        required: true
      }

    },


    exits: {

      success: {
        statusCode: 200,
        description: 'The email address matched a user in the database, and an email was probably sent.'
      },

      notFound: {
        statusCode: 404,
        description: 'The provided email address does not match a known user in the database.',
        extendedDescription: 'Since the signup endpoint needs the ability to let the requesting user know that an email address is already in use, '+
        'we\'ll already have to do IP limiting.  So there\'s point in preventing folks from having access to this information.'
      }

    },


    fn: function(inputs, exits) {
      var querystring = require('querystring');
      //  ╔═╗╦╔╗╔╔╦╗  ┬ ┬┌─┐┌─┐┬─┐
      //  ╠╣ ║║║║ ║║  │ │└─┐├┤ ├┬┘
      //  ╚  ╩╝╚╝═╩╝  └─┘└─┘└─┘┴└─
      User.findOne({
        email: inputs.email
      })
      .exec(function(err, user) {
        if(err) {
          return exits.error(err);
        }

        if(!user) {
          return exits.success();
        }


        //  ╔═╗╔═╗╔╗╔╔═╗╦═╗╔═╗╔╦╗╔═╗  ┬─┐┌─┐┌─┐┌─┐┌┬┐  ┌┬┐┌─┐┬┌─┌─┐┌┐┌
        //  ║ ╦║╣ ║║║║╣ ╠╦╝╠═╣ ║ ║╣   ├┬┘├┤ └─┐├┤  │    │ │ │├┴┐├┤ │││
        //  ╚═╝╚═╝╝╚╝╚═╝╩╚═╩ ╩ ╩ ╚═╝  ┴└─└─┘└─┘└─┘ ┴    ┴ └─┘┴ ┴└─┘┘└┘
        //
        // https://github.com/substack/node-password-reset/blob/master/index.js
        var buf = new Buffer(16);
        for(var i = 0; i < buf.length; i++) {
          buf[i] = Math.floor(Math.random() * 256);
        }

        var token = buf.toString('base64');
        // e.g. "vt8qeSpSG9+HVXyhoRlecw=="

        //  ╔═╗╔╦╗╔═╗╦═╗╔═╗  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┬┌─┌─┐┌┐┌
        //  ╚═╗ ║ ║ ║╠╦╝║╣    │ ├─┤├┤    │ │ │├┴┐├┤ │││
        //  ╚═╝ ╩ ╚═╝╩╚═╚═╝   ┴ ┴ ┴└─┘   ┴ └─┘┴ ┴└─┘┘└┘
        //  ┌─┐┌┐┌  ┌┬┐┬ ┬┌─┐  ┬ ┬┌─┐┌─┐┬─┐  ┬─┐┌─┐┌─┐┌─┐┬─┐┌┬┐
        //  │ ││││   │ ├─┤├┤   │ │└─┐├┤ ├┬┘  ├┬┘├┤ │  │ │├┬┘ ││
        //  └─┘┘└┘   ┴ ┴ ┴└─┘  └─┘└─┘└─┘┴└─  ┴└─└─┘└─┘└─┘┴└──┴┘
        //
        // This allows us to look up the user when the link from the email
        // is clicked.
        User.update({
          id: user.id
        })
        .set({ resetPasswordToken: token })
        .exec(function(err) {
          if(err) {
            return exits.error(err);
          }

          // In development, log the token link to the console.
          if (sails.config.environment === 'development') {
            console.log('-#-#-#-#-#-#-#-#-#-# RESET PASSWORD LINK -#-#-#-#-#-#-#-#-#-#-#-#');
            console.log('');
            console.log(process.env.TRACKING_BASE_URL + '/reset-password?t=' + encodeURIComponent(token));
            console.log('');
            console.log('-#-#-#-#-#-#-#-#-#-# RESET PASSWORD LINK -#-#-#-#-#-#-#-#-#-#-#-#');
          }

          //  ╔═╗╔═╗╔╗╔╔╦╗  ┬─┐┌─┐┌─┐┌─┐┌┬┐  ┌─┐┌┬┐┌─┐┬┬
          //  ╚═╗║╣ ║║║ ║║  ├┬┘├┤ └─┐├┤  │   ├┤ │││├─┤││
          //  ╚═╝╚═╝╝╚╝═╩╝  ┴└─└─┘└─┘└─┘ ┴   └─┘┴ ┴┴ ┴┴┴─┘

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
          var link = protocol + '://' + emailHost + '/reset-password?' + querystring.stringify({t: token});

          sails.helpers.sendTemplateEmail({
            to: [user.email],
            subject: 'Reset ' + (sails.config.whitelabel ? sails.config.whitelabel.getBrandName(req.hostname || req.get('host') || '') : 'Xeco') + ' Energy password',
            template: 'reset-password',
            templateData: {
              link: link,
              user: user
            }
          }).exec(function(err) {
            if (err) {
              return exits.error(err);
            }
            return exits.success();
          });

        });

      });

    }

  }

};
