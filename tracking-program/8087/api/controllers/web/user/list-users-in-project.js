module.exports = {


  friendlyName: 'List users in project (unused?)',


  description: 'List project users',


  inputs: {

    project: {
      description: 'The ID of the project to list users for.',
      example: 123,
      required: true
    },

    page: {
      description: 'Page number to retrieve.',
      example: 1
    },

    lastName: {
      description: 'Value to filter the "last name" column by.',
      extendedDescription: 'This value will be matched using `like`.',
      example: 'Jones'
    },

    firstName: {
      description: 'Value to filter the "first name" column by.',
      extendedDescription: 'This value will be matched using `like`.',
      example: 'Joe'
    },

    email: {
      description: 'Value to filter the "email address" column by.',
      extendedDescription: 'This value will be matched using `like`.',
      example: 'gmail.com'
    },

    orderBy: {
      description: 'Column to sort results by.',
      example: 'lastName',
      defaultsTo: 'lastName'
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
          count: 12
        },
        response: [{
          id: 123,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@acmeinc.com'
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

    var where = {
      isDeleted: false
    };

    if (inputs.firstName) {
      where.firstName = { contains: inputs.firstName };
    }

    if (inputs.lastName) {
      where.lastName = { contains: inputs.lastName };
    }

    if (inputs.email) {
      where.email = { contains: inputs.email };
    }

    async.auto({

      count: function(cb) {
        Project.findOne({id: inputs.project}).populate('users', _.cloneDeep(where)).exec(function(err, project) {
          if (err) { return cb(err); }
          if (!project) { return cb(new Error('Project `' + inputs.project + '` not found!')); }
          return cb(undefined, project.users.length);
        });
      },

      rows: ['count', function(result, cb) {
        var query = Project.findOne({id: inputs.project});
        var populateCriteria = { where: _.cloneDeep(where) };
        if (inputs.page) {
          populateCriteria.skip = ((inputs.page - 1) * sails.config.constants.DEFAULT_PAGE_SIZE);
          populateCriteria.limit = sails.config.constants.DEFAULT_PAGE_SIZE;
        }

        populateCriteria.sort = [{[_.camelCase(inputs.orderBy)]: inputs.orderDirection}];
        query = query.populate('users', populateCriteria);
        query.exec(function(err, project) {
          if (err) { return cb(err); }
          return cb(undefined, project.users);
        });
      }]

    }, function (err, results) {

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
