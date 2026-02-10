module.exports = {


  friendlyName: 'List events',


  description: 'List the scheduled switch events for a project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
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
      startDate: '2020-01-20',
      endDate: '2020-01-20',
      switches: [1, 2, 3],
      scheduleDetail: [],
      daysOfWeek: [],
    }),

    badRequest: { statusCode: 400 },

    unauthorized: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    // Make sure that the logged-in user has access to this project.
    if (!_.any(this.req.user.projects, {id: inputs.project})) {
      return exits.unauthorized();
    }

    var whereClause = { project: inputs.project, isCompleted: false, isDeleted: false, deviceType: inputs.deviceType};


    sails.helpers.web.findAndFormatRecords({
      model: Schedule,
      selectClause: [
        'id',
        'startDate',
        'endDate',
        'switches',
        'scheduleDetail',
        'daysOfWeek',
      ],
      whereClause: whereClause,
      sortClause: (inputs.orderBy||'startDate') + ' ' + (inputs.orderDirection||'DESC'),
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
        let details = [];
        let days = [];
        report.response = _.map(report.response, function (record) {
	  details = [];
	  days = [];
          record.scheduleDetail.forEach(function(detail){
            details.push("From: " + detail.offTime + " - To: " + detail.onTime + ", ");
          });
          record.daysOfWeek.forEach(function(day) {
            if (day == 1) {
              days.push("Mon");
            } else if (day == 2) {
              days.push("Tue");
            } else if (day == 3) {
              days.push("Wed");
            } else if ( day == 4) {
              days.push("Thu");
            } else if (day == 5) {
              days.push("Fri");
            } else if (day == 6) {
              days.push("Sat") 
            } else if (day == 0) {
              days.push("Sun");
            }
          });
          record.daysOfWeek = days;
          console.log("days :" + days);
          record.scheduleDetail = details;
          console.log("details :" + details);
          return record;
        });

        return exits.success(report);
      }
    });

  }


};
