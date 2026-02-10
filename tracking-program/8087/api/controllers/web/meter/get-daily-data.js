module.exports = {


  friendlyName: 'Get daily data',


  description: 'Given a date range, return the daily rolled-up meter data for the given project in that range.',


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
            date: '2017-06-07',
            kwh: 268.734,
            kvap: 410.66,
            kwp: 410.66,
	    multiplier: 1
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
    var SQL = 'SELECT ' + MeterDataAggregate.schema.avgKva.columnName + ', ' + MeterDataAggregate.schema.peakKva.columnName + ', peakKw, ' + MeterDataAggregate.schema.day.columnName + ' as day, multiplier FROM ' + MeterDataAggregate.tableName + ' WHERE ' + MeterDataAggregate.schema.project.columnName + '=' + inputs.project + ' AND ' + MeterDataAggregate.schema.intervalId.columnName + ' = \'\' AND day >= \'' + startDate + '\' AND day <= \'' + endDate + '\'';
	console.log(SQL);
    sails.getDatastore().sendNativeQuery(SQL).exec(function(err, result) {
      if (err) { return exits.error(err); }
    
      // Marshal the data by calculating the KWH for each row.
      var data = _.map(result.rows, function(row) {
        // Get the kwh for the day by multiplying the avgKva by 24 hours.
        var kwh = row.avgKva * 24;
        return {
          date: row.day,
          kwh: kwh,
          kvap: row.peakKva,
          kwp: row.peakKw,
          multiplier: row.multiplier,
        };
      });
      return exits.success({
        meta: {
          total: data.length
        },
        response: data
      });
    });

  }


};
