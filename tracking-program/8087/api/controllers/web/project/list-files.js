module.exports = {
  friendlyName: 'List Files uploaded',

  description: 'List this project\'s savings reports.',

  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
    },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection
  },


  exits: {
    success: sails.config.constants.getPaginationSuccessExit({
      id: 2, 
      name: '2017-11',
      description: 'uploade file for project x',
      url: 'files/list-files',
    }),
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    var formatRecords;
    var Moment = require('moment-timezone');
    if (inputs.project) {
      var whereClause = {
        and: [{project: inputs.project}]
      };
  
      formatRecords = sails.helpers.web.findAndFormatRecords({
        model: File,
        selectClause: ['id', 'name', 'description', 'url'],
        whereClause: whereClause,
        sortClause: (inputs.orderBy||'createdAt') + ' ' + (inputs.orderDirection||'DESC'),
        pageSize: inputs.pageSize,
        page: inputs.page
      });
    } else {
      formatRecords = sails.helpers.web.findAndFormatRecords({
        model: File,
        selectClause: ['id', 'name', 'description', 'url'],
        sortClause: (inputs.orderBy||'createdAt') + ' ' + (inputs.orderDirection||'DESC'),
        pageSize: inputs.pageSize,
        page: inputs.page
      })
    }

    formatRecords.exec({
      error: function (err) {
        return exits.error(err);
      },
      badRequest: function(err){
        return exits.badRequest(err);
      },
      success: function(report) {
        const StorageService = require('../../../services/StorageService')

          report.response.forEach(row => {
            let filePath = 'bills/' + row.url;

            if(StorageService.existsSync(filePath)) {
              row.url = StorageService.webPath(filePath)
            }
          }); 
        return exits.success(report);
      }
    });
  }
};
