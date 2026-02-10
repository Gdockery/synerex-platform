module.exports = {


  friendlyName: 'List project repeaters',


  description: 'Get a filtered, paginated list of all repeaters in a project.',


  inputs: {

    page: {
      description: 'Page number to retrieve.',
      example: 1,
      defaultsTo: 1
    },

    project: {
      description: 'The ID of the project to list repeaters for.',
      example: 123,
      required: true
    },

    name: {
      description: 'Value to filter the "repeater name" column by.',
      extendedDescription: 'This value will be matched using `like`.',
      example: 'B1 Main'
    },

    orderBy: {
      description: 'Column to sort results by.',
      example: 'name',
      defaultsTo: 'name'
    },

    orderDirection: {
      description: 'Direction to sort the results.',
      example: 'ASC',
      defaultsTo: 'ASC'
    }

  },


  exits: {
    success: {
      outputExample: {
        meta: {
          page: 1,
          total: 33
        },
        response: [{
          id: 1,
          name: 'Repeater #1',
          lastCommunicatedAt: 12345,
          gateway: 'B8:27:EB',
        }]
      }    },
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

    var where = {
      project: inputs.project,
      isDeleted: false
    };

    if (inputs.name) {
      where.name = {contains: inputs.name};
    }

    // Get the SQL queries we need.
    async.auto({
      count: function(cb) {
        Repeater.count(where).exec(cb);
      },

      rows: function(cb) {
        var query = Repeater.find(where);
        if (inputs.orderBy) { query.sort([{[inputs.orderBy]: inputs.orderDirection}]); }
        if (inputs.page) { query = query.skip((inputs.page - 1) * 10); }
        query = query.limit(10);
        query.exec(cb);
      }

    }, function(err, results) {
      if (err) { return exits.error(err); }
      var output = {
        meta: {
          page: inputs.page,
          total: results.count
        },
        response: results.rows
      };
      return exits.success(output);
    });

  }

};
