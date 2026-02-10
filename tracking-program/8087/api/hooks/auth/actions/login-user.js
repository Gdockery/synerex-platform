module.exports = {


  friendlyName: 'Login',


  description: 'Log in to Xeco.',


  inputs: {

    email: {
      description: 'The email to try in this attempt.',
      example: 'john.doe@xeco.com',
      required: true
    },

    password: {
      description: 'The unencrypted password to try in this attempt.',
      example: 'abc123',
      required: true
    }

  },


  exits: {

    success: {
      statusCode: 200,
      description: 'The requesting user agent has been successfully logged in.'
    },

    notFound: {
      statusCode: 404,
      description: 'The provided username/email and password combination does not match any user in the database.'
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    var bcrypt = require('bcryptjs');


    //  ╔═╗╦╔╗╔╔╦╗  ┬ ┬┌─┐┌─┐┬─┐
    //  ╠╣ ║║║║ ║║  │ │└─┐├┤ ├┬┘
    //  ╚  ╩╝╚╝═╩╝  └─┘└─┘└─┘┴└─
    // Look by either username or email
    User.findOne({email: inputs.email, isDeleted: false})
    .exec(function(err, user) {
      if(err) {
        return exits.error(err);
      }

      // If there was no user return the notFound exit
      if(!user) {
        return exits.notFound();
      }


      //  ╔═╗╦ ╦╔═╗╔═╗╦╔═  ┌─┐┌─┐┌─┐┌─┐┬ ┬┌─┐┬─┐┌┬┐
      //  ║  ╠═╣║╣ ║  ╠╩╗  ├─┘├─┤└─┐└─┐││││ │├┬┘ ││
      //  ╚═╝╩ ╩╚═╝╚═╝╩ ╩  ┴  ┴ ┴└─┘└─┘└┴┘└─┘┴└──┴┘
      bcrypt.compare(inputs.password, user.hashedPassword, function(err, res) {
        if(err) {
          return exits.error(err);
        }

        // If the password doesn't match, return the notFound exit
        if(!res) {
          return exits.notFound();
        }

        //  ╦  ╔═╗╔═╗╦╔╗╔
        //  ║  ║ ║║ ╦║║║║
        //  ╩═╝╚═╝╚═╝╩╝╚╝
        req.session.userId = user.id;

        //  ╦═╗╔═╗╔╦╗╦ ╦╦═╗╔╗╔  ┬─┐┌─┐┌─┐┌─┐┌─┐┌┐┌┌─┐┌─┐
        //  ╠╦╝║╣  ║ ║ ║╠╦╝║║║  ├┬┘├┤ └─┐├─┘│ ││││└─┐├┤
        //  ╩╚═╚═╝ ╩ ╚═╝╩╚═╝╚╝  ┴└─└─┘└─┘┴  └─┘┘└┘└─┘└─┘
        return exits.success();
      });
    });

  }

};
