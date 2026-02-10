module.exports = {


  friendlyName: 'Get monthly data',


  description: 'Given a date range, return the monthly rolled-up meter data for the given project in that range.',


  inputs: {

    project: {
      description: 'The ID of the project to list meters for.',
      example: 123,
      required: true
    },

    fromDate: {
      description: 'Start date for the report.',
      example: 12345,
      required: true
    },

    toDate: {
      description: 'End date for the report.',
      example: 12345,
      required: true
    }

  },


  exits: {
    success: {
      outputExample: {
        meta: {
          total: 2
        },
        response: [
          {
            date: '12/2017',
            kwh: 268.734,
            kwp: 123
          }
        ]
      }
    },

    unauthorized: {
      statusCode: 404
    },

    badDateParameters: {
      description: 'The `fromDate` or `toDate` value was invalid.',
      statusCode: 400
    },


  },


  fn: function (inputs, exits) {
    var req = this.req;

    var Moment = require('moment-timezone');

    var project = _.find(req.user.projects, {id: inputs.project} );

    // Make sure that the logged-in user has access to this project.
    if ( !project ) {
      return exits.unauthorized();
    }

    // Make sure that `toDate` > `fromDate`.
    if (inputs.toDate <= inputs.fromDate) {
      return exits.badDateParameters();
    }

    // Get start and end dates in YYYY-MM-DD format, same as the `day` column in the MeterDataAggregate table.
    var startDate = (new Moment(inputs.fromDate)).tz(project.timeZoneId).startOf('month').format('YYYY-MM-DD');
    var endDate = (new Moment(inputs.toDate)).tz(project.timeZoneId).endOf('month').format('YYYY-MM-DD');

    // Find all rolled-up days in the given period, grouped by year+month.
    var SQL = 'SELECT AVG(' + MeterDataAggregate.schema.avgKva.columnName
            + ') as avgKva, AVG(' + MeterDataAggregate.schema.avgKw.columnName
            + ') as avgKw, MAX(peakKw'
            + ') as peakKw, MAX(' + MeterDataAggregate.schema.peakKva.columnName
            + ') as peakKva, SUBSTRING(day, 1, 7) as month FROM ' + MeterDataAggregate.tableName
            + ' WHERE ' + MeterDataAggregate.schema.project.columnName + ' = ' + inputs.project + ' AND ' + MeterDataAggregate.schema.day.columnName + ' >= \'' + startDate + '\' AND ' + MeterDataAggregate.schema.day.columnName + ' <= \'' + endDate + '\' GROUP BY month ORDER BY month';
    console.log(SQL);
    sails.getDatastore().sendNativeQuery(SQL).exec(function(err, result) {
      if (err) { return exits.error(err); }
    
      // Marshal the data by calculating the KWH for each row.
      var data = _.map(result.rows, function(row) {
        // Get the duration for the month, in hours, and multiply that by the avgKva for the period.
        var duration = Moment(row.month).endOf('month').valueOf() - Moment(row.month).startOf('month').valueOf();
        console.log(Moment.duration(duration).asHours());
        var kwh = row.avgKva * Moment.duration(duration).asHours();
        return {
          date: row.month,
          kwh: kwh,
          kwp: row.peakKva
        };
      });

      console.log("get-monthly-data",data);
      return exits.success({
        meta: {
          total: data.length
        },
        response: data
      });
    });

  }


};
