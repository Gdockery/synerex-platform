module.exports = {


  friendlyName: 'List',


  description: 'List projects.',


  inputs: {

    // Filter constraints:
    name: { type: 'string' },
    client: { type: 'string' },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      id: 183,
      name: 'Toilet Paper Factory',
      slug: 'toilet-paper-factory',
      // numAlerts: 4,
      // lastSavingsReportCreatedAt: 1928732323,
      client: { id: 333, name: 'ACME' },
      xecoManager: { id: 444, fullName: 'Joan Price' }
    }),

    badRequest: { statusCode: 400 }

  },


  fn: function (inputs, exits) {

    // Check `orderBy`
    if (inputs.orderBy && !_.contains(['name'], inputs.orderBy)) {
      return exits.badRequest('Cannot sort by that (`'+inputs.orderBy+'`)');
    }

    var whereClause = {
      and: [
        { isDeleted: false }
      ]
    };
    if (inputs.name){
      whereClause.and.push({ name: {contains:_.trim(inputs.name)} });
    }
  
    if (inputs.client){
      whereClause.and.push({ client: inputs.client });
    }
    


    sails.helpers.web.findAndFormatRecords({
      model: Project,
      selectClause: ['id', 'name', 'slug', 'client', 'xecoManager'],
      whereClause: whereClause,
      populates: {
        xecoManager: true,
        client: true
      },
      sortClause: (inputs.orderBy||'name') + ' ' + (inputs.orderDirection||'ASC'),
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

        // Attach computed `fullName`
        _.each(report.response, function(project) {
          if (project.xecoManager) {
            project.xecoManager.fullName = project.xecoManager.firstName+' '+project.xecoManager.lastName;
          }
        });

        // FUTURE: compute & attach these as well:
        // numAlerts
        // lastSavingsReportCreatedAt
  
        return exits.success(report);
      }
    });

  }


};
