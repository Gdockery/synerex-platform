module.exports = {


  friendlyName: 'Remove test',


  description: 'Remove a test.',


  inputs: {
    id: {
      description: 'The ID of the test to remove.',
      example: 123
    }
  },


  exits: {

    unauthorized: {
      statusCode: 404,
      outputExample: ''
    },
    notFound: {
      statusCode: 404,
      outputExample: ''
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    // Get a reference to the datastore.
    var datastore = sails.getDatastore('default');

    Test.findOne({id: inputs.id}).exec(function(err, test) {
      if (err) { return exits.error(err); }
      if (!test) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: test.project} )) {
        return exits.unauthorized();
      }

      let project = _.find(req.user.projects, {id: test.project} );

      datastore.transaction(function(db, proceed) {
        Test.update({id: inputs.id}, {isDeleted: true})
        .usingConnection(db)
        .exec(function(err) {
          if (err) { return proceed(err); }
          SwitchCommand.update({id: test.switchCommand}, {isCancelled: true})
          .usingConnection(db)
          .exec(proceed);
        });
      }, function (err) {
        if (err) { return exits.error(err); }

        if (project.gwControl) {
          // Cancel the schedule on the gateways involved
          sails.helpers.devices.cancelGatewaySchedule({
            projectSlug: project.slug,
            scheduleId: 't-' + test.id
          }).exec(function(err) {
            if (err) { return exits.error(err); }
            return exits.success();
          });
        } else {
          // Cancel the schedule on the switches
          sails.helpers.devices.cancelSwitchSchedule({
            projectSlug: project.slug,
            scheduleId: 't-' + test.id
          }).exec(function(err) {
            if (err) { return exits.error(err); }
            return exits.success();
          });
        }
      });

    });

  }

};