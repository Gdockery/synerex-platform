module.exports = {


  friendlyName: 'List events',


  description: 'List the scheduled switch events for a project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    isCancelled: {
      description: 'Whether or not to filter by cancelled records.',
      example: true      
    },

    deviceType: {
      description: 'A filter constraint.',
      extendedDescription: 'This value will be matched exactly.',
      example: 2
    },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      id: 123,
      commandType: 1,
      startAt: 12345,
      duration: 600,
      interval: 60,
      switchCount: 3,
      acceptedSwitchCount: 2,
      cancelledSwitchCount: 0,
      isCancelled: false,
      deviceType: 1, 
    }),

    badRequest: { statusCode: 400 },

    unauthorized: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    // Make sure that the logged-in user has access to this project.
    if (!_.any(this.req.user.projects, {id: inputs.project})) {
      return exits.unauthorized();
    }

    var whereClause = { project: inputs.project, deviceType: inputs.deviceType};

    if (!_.isUndefined(inputs.isCancelled)) {
      whereClause['isCancelled'] = inputs.isCancelled;
    }

    sails.helpers.web.findAndFormatRecords({
      model: SwitchCommand,
      selectClause: [
        'id',
        'commandType',
        'startAt',
        'acceptedBySwitchIds',
        'cancelledBySwitchIds',
        'isCancelled',
        'deviceType'
      ],
      whereClause: whereClause,
      populates: {
        switches: true
      },
      sortClause: (inputs.orderBy||'startAt') + ' ' + (inputs.orderDirection||'DESC'),
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
        report.response = _.map(report.response, function (record) {
          record.switchCount = record.switches.length;
          record.acceptedSwitchCount = record.acceptedBySwitchIds.length;
          record.cancelledSwitchCount = record.cancelledBySwitchIds.length;
          return record;
        });
        return exits.success(report);
      }
    });

  }


};
