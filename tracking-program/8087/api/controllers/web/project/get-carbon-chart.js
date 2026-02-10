module.exports = {


  friendlyName: 'Get current savings',


  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    }


  },


  exits: {

    success: {
      outputExample: {
        
        chartData: {
          carbonCurrent: [1,2,3],
          carbonBefore: [1,2,3],
          chartLabel: ['timeLabel', '02:00'],

        },
        
      }
    },

    notFound: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    var Moment = require('moment-timezone');

    var req = this.req;
    var sails = req._sails;
    var current = (new Date()).getTime();

    // Make sure that the logged-in user has access to this project.
    if ( !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    // Get the project record.
    Project.findOne({ id: inputs.project }).exec(function(err, project) {
      if (err) { return exits.error(err); }
      Meter.find({ project: project.id}).select(['id']).exec(function(err, meters) {
        if (err) { return exits.error(err); }
        var meterIds = _.pluck(meters, 'id');
        var meterInputs = meterIds.toString();
     
        var kwPercentSaved = parseFloat(project.kvaSavings);
       
        var now = Moment.tz(new Moment(), project.timeZoneId);
        var dayStart = Moment(now).startOf('day').format('YYYY-MM-DD');
        var today = '\'' + dayStart + '\'';
        MeterDataAggregate.find({project: project.id, day: dayStart}).select(['intervalStartTime', 'avgKw']).sort('intervalStartTime ASC').exec(function(err, meterAggregate) {
          if (err) { return exits.error(err); }

            //get line chart data
          var timeLabel = [];

          
          var kwCurrent = _.pluck(meterAggregate, 'avgKw');
        
          var timestamps = _.pluck(meterAggregate, 'intervalStartTime');

          carbonReduction = [];
          carbonReductionBefore = [];
          var count = 1;
          var hourAvgKwh = 0; //is the kwh 
          for (var i = 1; i + 1<= timestamps.length; i++){
            if (parseInt(Moment.tz(new Moment(timestamps[i]),project.timeZoneId).format('HH')) == parseInt(Moment.tz(new Moment(timestamps[i - 1]),project.timeZoneId).format('HH'))){
              //average the 2 kw if hours are equal
              if (i == 1){
                hourAvgKwh += kwCurrent[i - 1];
              } else {
                hourAvgKwh += kwCurrent[i];
                count += 1;
              }
            } else if (parseInt(Moment.tz(new Moment(timestamps[i]),project.timeZoneId).format('HH')) != parseInt(Moment.tz(new Moment(timestamps[i - 1]),project.timeZoneId).format('HH'))){
              carbonReduction.push(_.round((hourAvgKwh / count) * (0.7054/1000), 2));
              carbonReductionBefore.push(_.round((hourAvgKwh / count) * (0.7054/1000) * (1 + kwPercentSaved), 2));
              timeLabel.push(Moment.tz(new Moment(timestamps[i-1]),project.timeZoneId).format('HH:00 a'));
              count = 1;
              hourAvgKwh = kwCurrent[i];
            }

          }
        
          let chart = {
            carbonCurrent: carbonReduction,
            carbonBefore: carbonReductionBefore,
            chartLabel: timeLabel,
          };

            
    
          return exits.success({
            chartData: chart
          });                        
        });
      });
    });
  }
};
