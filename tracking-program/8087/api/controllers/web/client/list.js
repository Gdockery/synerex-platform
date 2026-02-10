module.exports = {


  friendlyName: 'List',


  description: 'List clients.',


  inputs: {

    // Filter constraints:
    name: { type: 'string' },
    contactName: { type: 'string' },
    country: { type: 'string' }, 
    createdBy: { type: 'string' },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      id: 183,
      name: 'ACME Inc.',
      contactName: 'John Doe',
      country: 'United States',
      // numAlerts: 4,
      // lastSavingsReportCreatedAt: 1928732323,
    }),

    badRequest: { statusCode: 400 }

  },


  fn: function (inputs, exits) {

    // Check `orderBy`
    if (inputs.orderBy && !_.contains(['name', 'contactName', 'country'], inputs.orderBy)) {
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
    if (inputs.contactName){
      whereClause.and.push({ contactName: {contains:_.trim(inputs.contactName)} });
    }
    if (inputs.country){
      whereClause.and.push({ country: {contains:_.trim(inputs.country)} });
    }

    if (inputs.createdBy){
      whereClause.and.push({ createdBy: inputs.createdBy});
    }

    sails.helpers.web.findAndFormatRecords({
      model: Client,
      selectClause: ['id', 'name', 'contactName', 'country'],
      whereClause: whereClause,
      populates: {},
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

        // FUTURE: compute & attach these as well:
        // numAlerts
        // lastSavingsReportCreatedAt

        return exits.success(report);
      }
    });

  }


};
