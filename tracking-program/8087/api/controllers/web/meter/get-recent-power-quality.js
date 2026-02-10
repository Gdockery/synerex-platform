module.exports = {


  friendlyName: 'Get recent power quality',


  description: 'Get metrics describing the quality of power for a project, using the most recent reading across every meter.',


  inputs: {

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

    meter: {
      description: 'The ID of the meter to pull recent meter data for.',
      example: 123,
      required: true
    }

  },


  exits: {

    success: {
      // TODO: change to match the `meta` + `response` conventions throughout the rest of XECO
      outputExample: {
        response: {
          ampLoad1: 0,
          ampLoad2: 0,
          ampLoad3: 0,
          powerFactor1: 0,
          powerFactor2: 0,
          powerFactor3: 0,
          kvar1: 0,
          kvar2: 0,
          kvar3: 0,
          voltage1: 0,
          voltage2: 0,
          voltage3: 0
        }
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
    /*if (req.isSocket) {
      sails.sockets.join(req, MeterData.getRoomName(inputs.project));
      sails.log.info('Socket subscribed to project `'+inputs.project+'`');
    }*/

    // Load recent cached meter data from Project

    MeterData.find({meter: inputs.meter}).sort('createdAt DESC').limit(1).exec(function(err, meterData) {
      
      let data = {
        ampLoad1: meterData[0].l1Amp,
        ampLoad2: meterData[0].l2Amp,
        ampLoad3: meterData[0].l3Amp,
        powerFactor1: meterData[0].l1Pf,
        powerFactor2: meterData[0].l2Pf,
        powerFactor3: meterData[0].l3Pf,
        kvar1: meterData[0].l1Kvar,
        kvar2: meterData[0].l2Kvar,
        kvar3: meterData[0].l3Kvar,
        voltage1: meterData[0].l1Volt,
        voltage2: meterData[0].l2Volt,
        voltage3: meterData[0].l3Volt
      };
      if (err) { return exits.error(err); }
      return exits.success({
        response: data
      });

    });//</ User.find().exec() >

  }


};
