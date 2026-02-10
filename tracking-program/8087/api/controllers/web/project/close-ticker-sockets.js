module.exports = {
  inputs: {

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

  },


  exits: {

    unauthorized: {
      statusCode: 404
    }

  },


  fn: function (inputs, exits) {

    var req = this.req;

    // Make sure that the logged-in user has access to this project.
    if (!_.find(req.user.projects, {id: inputs.project})) {
      return exits.unauthorized();
    }

    // If this is a socket VR, then also subscribe to the project, in case this socket
    // hasn't done so already (it's ok -- it's idempotent)
    //
    // Relevant docs:
    // • http://next.sailsjs.com/documentation/reference/web-sockets/resourceful-pub-sub/get-room-name
    // • https://sailsjs.com/docs/reference/web-sockets/sails-sockets/join
    if (req.isSocket) {
      sails.sockets.leave(req, Project.getRoomName(inputs.project));
      sails.log.info('Socket unsubscribed to project `'+inputs.project+'`');
    }

    return exits.success();


  }


};
