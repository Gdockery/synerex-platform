module.exports = {


  friendlyName: 'List',


  description: 'List users.',


  inputs: {

    // Filter constraints:
    email: { description: 'Filter constraint.', type: 'string' },
    fullName: { description: 'Filter constraint.', type: 'string' },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      id: 183,
      email: 'xjones@xecoenergy.com',
      fullName: 'Xander Jones',
      lastActiveAt: 19238724223,
      role: 3,
      roleFriendlyName: 'Synerex Admin',
      client: { id: 123, name: 'Foo' },
      projects: [
        { id: 987, name: 'Foo' },
      ]
    }),

    badRequest: { statusCode: 400 }

  },


  fn: function (inputs, exits) {
    var req = this.req;

    // Check `orderBy`
    if (inputs.orderBy && !_.contains(['fullName', 'email', 'lastActiveAt', 'role'], inputs.orderBy)) {
      return exits.badRequest('Cannot sort by that (`'+inputs.orderBy+'`)');
    }

    var whereClause = {
      and: [
        { isDeleted: false }
      ]
    };

    // This isn't a perfect name split (consider `van der Henst` and `de Silva`, for example)
    // However, it's good enough for our purposes, because it's consistent across the app.
    // > https://tex.stackexchange.com/questions/204697/how-to-correctly-typeset-an-authors-two-word-last-name-in-bibtex
    if (inputs.fullName) {
      var namePieces = _.trim(inputs.fullName).split(/\s+/);
      var conjunct;
      if (namePieces.length < 2) {
        conjunct = {
          or: [
            { firstName: {contains:namePieces[0]} },
            { lastName: {contains:namePieces[0]} },
          ]
        };
      }
      else {
        conjunct = {
          firstName: {endsWith:namePieces.slice(0,namePieces.length-1).join(' ')},
          lastName: {startsWith:_.last(namePieces)}
        };
      }
      whereClause.and.push(conjunct);
    }

    if (inputs.email) {
      whereClause.and.push({ email: {contains:_.trim(inputs.email)} });
    }


    sails.helpers.web.findAndFormatRecords({
      model: User,
      selectClause: ['id', 'role', 'firstName', 'lastName', 'email', 'lastActiveAt'],
      whereClause: whereClause,
      populates: {
        client: {},
        projects: {
          select: ['id', 'name'],
          where: { isDeleted: false }
        },
      },
      sortClause: (inputs.orderBy||'role') + ' ' + (inputs.orderDirection||'ASC'),
      pageSize: inputs.pageSize,
      page: inputs.page,
    }).exec({
      error: function (err) {
        return exits.error(err);
      },
      badRequest: function(err){
        return exits.badRequest(err);
      },
      success: function(report) {
        // Set up `fullName`.
        var hostname = req.hostname || req.get('host') || '';
        var brandName = sails.config.whitelabel ? sails.config.whitelabel.getBrandName(hostname) : 'Synerex';
        report.response = _.map(report.response, function(record){
          record.roleFriendlyName = _.startCase(
            _.camelCase(
              _.invert(sails.config.constants.USER_ROLES)[record.role+'']
            )
          );
          // Role 8 (XECO_ADMIN) displays as Synerex Admin
          if (record.roleFriendlyName === 'Xeco Admin') {
            record.roleFriendlyName = 'Synerex Admin';
          }
          record.fullName = record.firstName + ' ' + record.lastName;
          delete record.firstName;
          delete record.lastName;
          return record;
        });

        return exits.success(report);
      }
    });

  }


};
