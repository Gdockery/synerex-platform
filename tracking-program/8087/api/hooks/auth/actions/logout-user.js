module.exports = {


  friendlyName: 'Log out',


  description: 'Log out of Xeco.',


  inputs: {

  },


  exits: {

    success: {
      statusCode: 200,
      description: 'The requesting user agent has been successfully logged out.'
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    //  ╦ ╦╦╔═╗╔═╗  ┌─┐┌─┐┌─┐┌─┐┬┌─┐┌┐┌
    //  ║║║║╠═╝║╣   └─┐├┤ └─┐└─┐││ ││││
    //  ╚╩╝╩╩  ╚═╝  └─┘└─┘└─┘└─┘┴└─┘┘└┘
    delete req.session.userId;

    //  ╔═╗╔═╗╔╗╔╔╦╗  ┬─┐┌─┐┌─┐┌─┐┌─┐┌┐┌┌─┐┌─┐
    //  ╚═╗║╣ ║║║ ║║  ├┬┘├┤ └─┐├─┘│ ││││└─┐├┤
    //  ╚═╝╚═╝╝╚╝═╩╝  ┴└─└─┘└─┘┴  └─┘┘└┘└─┘└─┘
    return exits.success();

  }

};
