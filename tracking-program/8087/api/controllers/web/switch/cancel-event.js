module.exports = {


  friendlyName: 'Cancel event',


  description: 'Cancel a previously-scheduled event on or more switches.',


  inputs: {

    id: {
      description: 'The ID of the switch event to cancel.',
      example: 123,
      required: true
    }

  },


  exits: {

    unauthorized: {
      statusCode: 404
    },

    notFound: {
      statusCode: 404
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    SwitchCommand.findOne({ id: inputs.id }).populate('switches').populate('project').exec(function(err, switchCommand) {

      if (err) { return exits.error(err); }
      if (!switchCommand) { return exits.notFound();}

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: switchCommand.project.id} )) {
        return exits.unauthorized();
      }

      SwitchCommand.update({ id: inputs.id }, { isCancelled: true } ).exec(function(err) {
        if (err) { return exits.error(err); }

        // Cancel the commands on the switches.
        sails.helpers.devices.cancelSwitchSchedule({
          projectSlug: switchCommand.project.slug,
          scheduleId: 'x-' + switchCommand.id 
        }).exec(function(err) {
          if (err) { return exits.error(err); }
          return exits.success();
        });

      });

    });

  }


};
