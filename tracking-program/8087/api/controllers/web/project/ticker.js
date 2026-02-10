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
        project: 3,
        kwhSavings: 100,
        peakSavings: 100,
        carbonSavings: 100,
        I2RLossSavings: 100,   
        peakSavingsAmount: 100,
        kwhSavingsAmount: 100,
        carbonSavingsAmount: 100,
        I2RLossSavingsAmount: 100, 
        projectSavings: 100,
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
      sails.log.info('Socket subscribed to project acwp `'+inputs.project+'`');
    }

    // Load recent cached meter data from Project
    Project.findOne({ id: inputs.project }).exec((err, project)=>{
      if (err) { return exits.error(err); }
      if (project.selectedTest == null) { return exits.error(err); }
      ReportData.find({project: project.id, type: 'project', period: 'allTime'}).exec(function(err, reportData) {  

        return exits.success({
          project: project.id,
          kwhSavings: reportData.find(item => item.valueType == 'kwhSavingsAmount' ).value,
          peakSavings: reportData.find(item => item.valueType == 'peakSavingsAmount' ).value,
          carbonSavings: reportData.find(item => item.valueType == 'carbonSavingsAmount' ).value,
          I2RLossSavings:  reportData.find(item => item.valueType == 'I2RLossSavingsAmount' ).value,
          peakSavingsAmount: reportData.find(item => item.valueType == 'peakSavings' ).value + reportData.find(item => item.valueType == 'pfc' ).value,
          kwhSavingsAmount: reportData.find(item => item.valueType == 'kwhSavings' ).value,
          carbonSavingsAmount: reportData.find(item => item.valueType == 'carbonSavings' ).value,
          I2RLossSavingsAmount:  reportData.find(item => item.valueType == 'I2RLossSavings' ).value,
          projectSavings: reportData.find(item => item.valueType == 'totalSavings' ).value + reportData.find(item => item.valueType == 'pfc' ).value + reportData.find(item => item.valueType == 'I2RLossSavings' ).value + reportData.find(item => item.valueType == 'carbonSavings' ).value, 
        });
      });
    });
    //</ User.find().exec(O) >

  }


};
