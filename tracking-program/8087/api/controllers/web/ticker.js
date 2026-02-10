module.exports = {


  friendlyName: 'Get recent power quality',


  description: 'Get metrics describing the quality of power for a project, using the most recent reading across every meter.',


  inputs: {

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {
      // TODO: change to match the `meta` + `response` conventions throughout the rest of XECO
      outputExample: {
        kwPeak: {},
        kvaDemand: 0,
        ampLoad1: 0,
        ampLoad2: 0,
        ampLoad3: 0,
      }
    },

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
      sails.sockets.join(req, Project.getRoomName(inputs.project));
      sails.log.info('Socket subscribed to project acw `'+inputs.project+'`');
    }

    // Load recent cached meter data from Project
    Project.findOne({ id: inputs.project }).exec((err, project)=>{
      if (err) { return exits.error(err); }

      return exits.success({
        kwPeak: project.peakKw,
        kvaDemand: project.totalKva,
        ampLoad1: project.totalL1Amp,
        ampLoad2: project.totalL2Amp,
        ampLoad3: project.totalL2Amp,
      });

    });//</ User.find().exec() >

  }


};
