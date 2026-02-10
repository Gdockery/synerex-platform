module.exports = {


  friendlyName: 'Get current savings',


  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },
    meters: {
      description: 'string  of meterIds to calculate savings',
      example: "1,2,3", //using strings since http.get does not allow arrays
      required: true
    }
  },


  exits: {

    success: {
      outputExample: {
        chartData: {
          kwCurrent: [1,2,3],
          kwBefore: [1,2,3],
          chartLabel: ['1:30 AM', '1:31 AM'],
          hasMeterAggregate: true,

        },
        
      }
    },

    notFound: { statusCode: 404 }

  },


  fn: function (inputs, exits) {
    var req = this.req;
    var sails = req._sails;

    var Moment = require('moment-timezone');

    Project.findOne({ id: inputs.project }).exec(function(err, project) {
      if (err) { return exits.error(err); }


      var now = Moment.tz(new Moment(), project.timeZoneId);
      var dayStart = Moment(now).startOf('day').format('YYYY-MM-DD');

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: inputs.project} )) {
        return exits.unauthorized();
      }
      // Get the project record.
      var meterIds = inputs.meters.split(',');
      var meterIdsIn = '(' + meterIds.join() + ')';

      // Use project.kwhSavings instead of test results
      var kwPercentSaved = parseFloat(project.kwhSavings) || 0;

      var SQL2 = 'SELECT intervalStartTime, ' 
                 + 'SUM(avgKw) as avgKw, ' 
                + 'intervalId, day FROM permeterdataaggregate '  
                + 'WHERE meter IN ' + meterIdsIn
                + ' AND day = \'' + dayStart + '\' GROUP BY intervalId, intervalStartTime ASC';
      
      sails.getDatastore().sendNativeQuery(SQL2).exec(function(err, meterAggregate) {
        if (err) { return exits.error(err); }
        
          //get line chart data
          var kwDataCurrent;
          var kwDataBefore = [];
          var timeLabel = [];
          var kwData =[];

         
          kwDataCurrent = _.pluck(meterAggregate.rows, 'avgKw');
          kwDataCurrent.forEach(function(kw){
            kwData.push(_.round(kw, 2));
            kwDataBefore.push(_.round(kw * (1 + kwPercentSaved), 2));
          });
          var timestamps = _.pluck(meterAggregate.rows, 'intervalStartTime');
            
          timestamps.forEach(function(timestamp){
            var time = Moment.tz(new Moment(timestamp),project.timeZoneId).format('h:mm a');
            timeLabel.push(time);
          });

                                
          let chart = {
            kwCurrent: kwData,
            kwBefore: kwDataBefore,
            chartLabel: timeLabel,
          };
        
          return exits.success({
            chartData: chart
          });                           
        });

    });
  }

};
