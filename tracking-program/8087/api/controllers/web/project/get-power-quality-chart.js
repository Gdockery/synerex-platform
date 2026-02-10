module.exports = {

  friendlyName: 'Get aggregate meter data for period',

  inputs: {

    project: {
      description: 'The ID of the project to aggregate meter data for.',
      example: 123,
      required: true
    },

    fromDate: {
      description: 'Start date for the aggregation.',
      extendedDescription: 'This is an inclusive range.  Regardless of the time of day that the timestamp represents, the range will extend from the beginning of the given day.',
      example: 12345,
    },

    toDate: {
      description: 'End date for the aggregation.',
      extendedDescription: 'This is an inclusive range.  Regardless of the time of day that the timestamp represents, the range will extend to the end of the given day (or to the current time, whichever is earlier).',
      example: 12345,
    },
 
    type: {
      description: 'specify which type data to display',
      extendedDescription: 'either kw kva kvar voltage or ampage',
      example: 'kw',
      required: true
    },

    period: {
      description: 'minutes or hour',
      extendedDescription: 'aggregate by minute or hour',
      example: 'hour',
      required: true
    },

    meter: {
      description: 'The ID of the meter to aggregate meter data for.',
      example: 123,
      required: true
    },

    equipment: {
      description: 'For equipment meters or circuit meters',
      example: true,
    },

  },


  exits: {

    success: {
      outputExample: {
        hours: "11",
        minutes: "35",
        p1Data: [1,2,3],
        p2Data: [1,2,3], 
        p3Data: [1,2,3],
        timeLabels: ['Nov-05 09:53', 'Nov-05 09:54'],
      }
    },

    notFound: {
      statusCode: 404
    },

    badDateParameters: {
      description: 'The `fromDate` or `toDate` value was invalid.',
      statusCode: 400
    }

  },


  fn: function(inputs, exits) {

    var Moment = require('moment-timezone');

    var now = (new Date()).getTime();


    inputs.fromDate = inputs.fromDate? inputs.fromDate : now;
    inputs.toDate = inputs.toDate ? inputs.toDate : now;

    // Validate that the "fromDate" is not in the future.
    if (inputs.fromDate > now) {
      return exits.badDateParameters();
    }

    // Validate that toDate > fromDate.
    if (inputs.fromDate > inputs.toDate) {
      return exits.badDateParameters();
    }

    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error("error in finding project"); }
      if (!project) { return exits.notFound(); }
      let currentTime = Moment.tz(new Moment(), project.timeZoneId);          
      var startTime = (new Moment(inputs.fromDate)).tz(project.timeZoneId).startOf('day');
      var endTime = (new Moment(inputs.toDate)).tz(project.timeZoneId).endOf('day');
      var startDay = startTime.format('YYYY-MM-DD');
      var endDay = endTime.format('YYYY-MM-DD');
      let hours = Moment(currentTime).format('HH');
      let minutes = Moment(currentTime).format('mm');

      var SQL = 'SELECT MAX(recordedAt) as recordedAt, avg(l1Kw) as l1Kw, avg(l2Kw) as l2Kw, avg(l3Kw) as l3Kw, avg(l1Kva) as l1Kva, avg(l2Kva) as l2Kva, avg(l3Kva) as l3Kva, avg(l1Volt) as l1Volt, avg(l2Volt) as l2Volt, ' +
       'avg(l3Volt) as l3Volt, avg(l1Amp) as l1Amp, avg(l2Amp) as l2Amp, avg(l3Amp) as l3Amp, avg(l1Kvar) as l1Kvar, avg(l2Kvar) as l2Kvar, avg(l3Kvar) as l3Kvar, avg(abs(l1Pf)) as l1Pf, avg(abs(l2Pf)) as l2Pf, avg(abs(l3Pf)) as l3Pf FROM ' + MeterData.tableName + ' WHERE ' + MeterData.schema.meter.columnName + ' = ' + inputs.meter
        + ' AND ' + MeterData.schema.day.columnName + ' >= \'' + startDay + '\' AND ' + MeterData.schema.day.columnName + ' <= \'' + endDay + '\'' + ' GROUP BY minute, intervalId, day ORDER BY recordedAt ASC';

      sails.getDatastore().sendNativeQuery(SQL).exec(function(err, results) {
        if (err) { return exits.error(err); }
      
      //get line chart data
        var timeLabel = [];
        var p1Data = [];
        var p2Data = []; 
        var p3Data = [];

        var phase1;
        var phase2;
        var phase3;


        let currentMinute = {totalVolt: 0, totalAmp: 0, totalKva: 0, totalKvar: 0, totalPf: 0, 
                  totalVoltTHD: 0, totalAmpTHD: 0};
        let voltTHD = 0;
        let ampTHD = 0;
        let danger = false;

        if (inputs.type == 'kw') {
          phase1 = 'l1Kw';
          phase2 = 'l2Kw';
          phase3 = 'l3Kw';
        } else if (inputs.type == 'kva') {
          phase1 = 'l1Kva';
          phase2 = 'l2Kva';
          phase3 = 'l3Kva';
        } else if (inputs.type == 'voltage') {
          phase1 = 'l1Volt';
          phase2 = 'l2Volt';
          phase3 = 'l3Volt';
        } else if (inputs.type == 'amperage') {
          phase1 = 'l1Amp';
          phase2 = 'l2Amp';
          phase3 = 'l3Amp';
        } else if (inputs.type == 'kvar') {
          phase1 = 'l1Kvar';
          phase2 = 'l2Kvar';
          phase3 = 'l3Kvar';
        } else if (inputs.type == 'pf') {
          phase1 = 'l1Pf';
          phase2 = 'l2Pf';
          phase3 = 'l3Pf';
        } else if (inputs.type == 'voltthd') {
          phase1 = 'l1VoltTHD';
          phase2 = 'l2VoltTHD';
          phase3 = 'l3VoltTHD';
        } else if (inputs.type == 'ampthd') {
          phase1 = 'l1AmpTHD';
          phase2 = 'l2AmpTHD';
          phase3 = 'l3AmpTHD';
        } 


        var p1Temp = _.pluck(results.rows, phase1);
        var p2Temp = _.pluck(results.rows, phase2);
        var p3Temp = _.pluck(results.rows, phase3);
        var timestamps = _.pluck(results.rows, 'recordedAt');

        if (inputs.period == 'hour') {

          var p1HourTotal = 0;
          var p2HourTotal = 0;
          var p3HourTotal = 0;
          var count = 1;
          for (var i = 1; i + 1<= timestamps.length; i++){
            if (parseInt(Moment.tz(new Moment(timestamps[i]),project.timeZoneId).format('HH')) == parseInt(Moment.tz(new Moment(timestamps[i - 1]),project.timeZoneId).format('HH'))){
              //average the 2 kw if hours are equal
              if (i == 1){
                p1HourTotal += p1Temp[i - 1];
                p2HourTotal += p2Temp[i - 1];
                p3HourTotal += p3Temp[i - 1];

              } else {
                p1HourTotal += p1Temp[i];
                p2HourTotal += p2Temp[i];
                p3HourTotal += p3Temp[i];
                count += 1;
              }
            } else if (parseInt(Moment.tz(new Moment(timestamps[i]),project.timeZoneId).format('HH')) != parseInt(Moment.tz(new Moment(timestamps[i - 1]),project.timeZoneId).format('HH'))){
              p1Data.push(_.round(p1HourTotal / count));
              p2Data.push(_.round(p2HourTotal / count));
              p3Data.push(_.round(p3HourTotal / count));
              timeLabel.push(Moment.tz(new Moment(timestamps[i-1]),project.timeZoneId).format('MMM-DD HH:00 a'));
              count = 1;
              p1HourTotal = p1Temp[i];
              p2HourTotal = p2Temp[i];
              p3HourTotal = p3Temp[i];
            }
          }
        } else if (inputs.period == 'minute') {

          timestamps.forEach(function(time){
            timeLabel.push(Moment.tz(new Moment(time),project.timeZoneId).format('MMM-DD HH:mm a'));
          });

          p1Data = _.pluck(results.rows, phase1);
          p2Data = _.pluck(results.rows, phase2);
          p3Data = _.pluck(results.rows, phase3);

        }
          var output = { 
            hours: hours,
            minutes: minutes,       
            p1Data: p1Data,
            p2Data: p2Data,
            p3Data: p3Data,
            timeLabels: timeLabel,
          };

          return exits.success(output);
        });
    });
 
  }
};
