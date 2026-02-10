module.exports = {


  friendlyName: 'List project meters',


  description: 'List meters for a project.',

  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    name: {
      description: 'Value to filter the "meter name" column by.',
      extendedDescription: 'This value will be matched using `like`.',
      example: 'B1 Main'
    },

    hasSwitch: {
      description: 'Filter by whether or not the meter has a switch control attached.',
      example: true
    },

    xecoSwitchedOn: {
      description: 'Filter by whether or not the meter has its Xeco unit switched on.',
      example: true
    },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      id: 183,
      name: 'Meter #1'
    }),

    badRequest: { statusCode: 400 },

    unauthorized: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    // Make sure that the logged-in user has access to this project.
    if (!_.any(this.req.user.projects, {id: inputs.project})) {
      return exits.unauthorized();
    }

    sails.helpers.web.findAndFormatRecords({
      model: Meter,
      selectClause: ['id', 'name', 'gateway', 'meshIp'],
      whereClause: {
        project: inputs.project,
        name: !_.isUndefined(inputs.name) ? { contains: inputs.name } : undefined,
        hasSwitch: !_.isUndefined(inputs.hasSwitch) ? inputs.hasSwitch : undefined,
        xecoSwitchedOn: !_.isUndefined(inputs.xecoSwitchedOn) ? inputs.xecoSwitchedOn : undefined,
        isDeleted: false
      },
      sortClause: (inputs.orderBy||'name') + ' ' + (inputs.orderDirection||'ASC'),
      pageSize: inputs.pageSize,
      page: inputs.page
    }).exec({
      error: function (err) {
        return exits.error(err);
      },
      badRequest: function(err){
        return exits.badRequest(err);
      },
      success: function(report) {
        return exits.success(report);
      }
    });

  }

};
