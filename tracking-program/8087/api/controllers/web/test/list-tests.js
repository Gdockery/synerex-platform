module.exports = {


  friendlyName: 'List tests',


  description: 'List all scheduled tests for a project',


  inputs: {

    project: {
      description: 'The ID of the project to list users for.',
      example: 123,
      required: true
    },

    showCancelled: {
      description: 'Whether or not to show cancelled tests',
      example: true,
      defaultsTo: true
    }

  },

  exits: {

    success: {
      outputExample: {
        meta: {
          count: 12
        },
        response: [{
          id: 123,
          inProgress: true,
          completed: false,
          startAt: 12345,
          duration: 6,
          interval: 1,
          isDeleted: false,
          gateways: []
        }]
      }
    },

    unauthorized: {
      statusCode: 404
    }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    var now = (new Date()).getTime();

    // Start search criteria by only searching for tests in the specified project.
    var criteria = { project: inputs.project };

    // If specified, filter out cancelled tests.
    if (inputs.showCancelled === false) {
      criteria.isDeleted = false;
    }

    Test.find(criteria).populate('gateways').exec(function(err, tests) {
      if (err) { return exits.error(err);}
      return exits.success({
        meta: {
          count: tests.length
        },
        response: _.map(tests, function(test) {

          var testEndAt = test.startAt + (test.duration * 60 * 60 * 1000);
          test.inProgress = now >= test.startAt && now < testEndAt;
          test.completed = now > testEndAt;
          return test;

        })
      });

    });

  }


};
