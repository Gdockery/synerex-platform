module.exports = {


  friendlyName: 'List savings reports',


  description: 'List this project\'s savings reports.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    fromDate: {
      description: 'Start of range to retrieve CSRs for.',
      example: 12345,
    },

    toDate: {
      description: 'End of range to retrieve CSRs for.',
      example: 12345,
    },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      month: '2017-11',
      createdAt: 19223522332,
      reportData: {},
      billURL: ''
    }),

    badRequest: { statusCode: 400 }

  },


  fn: function (inputs, exits) {

    var Moment = require('moment-timezone');

    var whereClause = {
      and: [{project: inputs.project}]
    };

    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error(err); }
      if (!project) { return exits.badRequest(); }

      if (inputs.fromDate) {
        whereClause.and.push({ month: {'>=': Moment.tz(inputs.fromDate, project.timeZoneId).format('YYYY-MM')} });
      }

      if (inputs.toDate) {
        whereClause.and.push({ month: {'<=': Moment.tz(inputs.toDate, project.timeZoneId).format('YYYY-MM')} });
      }

      sails.helpers.web.findAndFormatRecords({
        model: SavingsReport,
        selectClause: ['month', 'createdAt', 'reportData'],
        whereClause: whereClause,
        sortClause: (inputs.orderBy||'createdAt') + ' ' + (inputs.orderDirection||'DESC'),
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
          const StorageService = require('../../../services/StorageService')

          report.response.forEach(row => {
            let billPath = 'bills/' + ['bill', inputs.project, row.month].join('-') + '.pdf';

            if(StorageService.existsSync(billPath)) {
              row.billURL = StorageService.webPath(billPath)
            }
          }); 
         
          return exits.success(report);
        }
      });
    });
  }
};
