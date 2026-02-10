module.exports = {


  friendlyName: 'Get aggregate meter data for period',


  inputs: {

    project: {
      description: 'The ID of the project to aggregate meter data for.',
      example: 123,
      required: true
    },

    switch: {
      description: 'The ID of the meter to aggregate meter data for.',
      example: 1,
      required: true,
    },

  },


  exits: {

    success: {
      outputExample: {
        totalKwh: 200,
        totalCost: 100,
        scheduler: {},
        monthCost: 100,
        yearCost: 100,
      }
    },

    notFound: {
      statusCode: 404
    },


  },


  fn: function(inputs, exits) {

    var Moment = require('moment-timezone');

    var now = (new Date()).getTime();

    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error("error in finding project"); }
      if (!project) { return exits.notFound(); }
      Switch.findOne({id: inputs.switch}).exec(function(err, scheduler){
        var startTime = (new Moment(now)).tz(project.timeZoneId).startOf('month');
        var endTime = (new Moment(now)).tz(project.timeZoneId).endOf('day');
        var startDay = startTime.format('YYYY-MM-DD');
        var endDay = endTime.format('YYYY-MM-DD');
        let thisMonth = Moment(now).format('MM').toString();
        let lastMonth =  Moment(now).subtract(1, 'month').format('MM').toString();
        let currentYear = Moment(now).format('YYYY').toString();
        let lastYear =  Moment(now).subtract(1, 'year').format('YYYY').toString();

        let projectTotalPeaks = 0;
        let yearTotalPeaks = 0;
        let currentMonthKwh = 0;
        let remainingPeaks = 0;
        let allKwPeaks = [];
        let lastYearTotalPeaks = 0; 
        let yearTotalKwh = 0;
        let lastYearTotalKwh = 0;
        let lastMonthAvgKw = 0;
        let lastMonthKwh = 0;
        let remainingKwh = 0;
        let totalKwh = 0;
        let currentMonthPeak = 0;
        let lastMonthPeak = 0;
        let currentMonthAvgKw = 0;
        let projectTotalKwh = 0;

        console.log("here");

        var SQL = 'SELECT YEAR(day) as year, ' 
                + 'MONTH(day) as month, ' 
                + 'AVG(totalKva) as avgKva, ' 
                + 'MAX(totalKva) as peak FROM equipmentdata ' 
                + 'WHERE switch = ' + inputs.switch 
                + ' GROUP BY year DESC, month DESC';
    

          const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
          const sum = arr => arr.reduce((a, b) => a + b, 0);
                
          sails.getDatastore().sendNativeQuery(SQL).exec(function(err, results) {
            if (err) { return exits.error(err); }
          //get line chart data
            
            if (results.rows.length == 0){
              console.log("No data in data for switch:  ", inputs.switch);
            } else {
              allKwPeaks.push(_.pluck(results.rows, 'year'));
              allKwPeaks.push(_.pluck(results.rows, 'month'));
              allKwPeaks.push(_.pluck(results.rows, 'peak'));
              allKwPeaks.push(_.pluck(results.rows, 'avgKva'));

              
              var hoursInMonth = 0;
              for (var i = 0; i < allKwPeaks[0].length; i++){ //without current month
                //get number of hours in month

                if (parseInt(allKwPeaks[1][i]) == 2){
                  hoursInMonth = 28 * 24;
                } else if (parseInt(allKwPeaks[1][i]) == 4 || parseInt(allKwPeaks[1][i]) == 6 || parseInt(allKwPeaks[1][i]) == 9 || parseInt(allKwPeaks[1][i]) == 11){
                  hoursInMonth = 30 * 24;
                }else {
                  hoursInMonth = 31 * 24;
                }

                //get last month kwh and last month
                if (allKwPeaks[1][i] == parseInt(thisMonth)) {
                  currentMonthKwh = allKwPeaks[3][i] * hoursInMonth;
                  currentMonthAvgKw = allKwPeaks[3][i];
                  currentMonthPeak = allKwPeaks[2][i]; 

                } else if (allKwPeaks[1][i] == parseInt(lastMonth)) {
                  lastMonthAvgKw = allKwPeaks[3][i];
                  lastMonthPeak = allKwPeaks[2][i];
                  lastMonthKwh = allKwPeaks[3][i] * hoursInMonth;
                } 

                if (parseInt(allKwPeaks[0][i]) == parseInt(currentYear)) {
                    yearTotalPeaks += allKwPeaks[2][i]; 
                    yearTotalKwh += allKwPeaks[3][i] * hoursInMonth;
                } else if (parseInt(allKwPeaks[0][i]) == parseInt(lastYear)) {
                    lastYearTotalPeaks += allKwPeaks[2][i];
                    lastYearTotalKwh += allKwPeaks[3][i] * hoursInMonth;
                } else {
                    remainingPeaks += allKwPeaks[2][i];
                    remainingKwh += allKwPeaks[3][i] * hoursInMonth;
                }
              }
               
              projectTotalPeaks = yearTotalPeaks + lastYearTotalPeaks + remainingPeaks;
              projectTotalKwh = yearTotalKwh + lastYearTotalKwh + remainingKwh;
            }

            var output = {          
              totalKwh: projectTotalKwh,
              totalCost: projectTotalKwh * project.kwhRate,
              scheduler: {
                ampLoad: scheduler.ampLoad,
                voltage: scheduler.voltage,
                pf: scheduler.pf,
                OriginalHours: scheduler.originalHours,
                hasSchedule: scheduler.hasSchedule,   
              },
              monthCost: _.round(lastMonthKwh * project.kwhRate, 2),
              yearCost: _.round(yearTotalKwh * project.kwhRate, 2),

            };


            console.log(output);


          return exits.success(output);
        });
      });
    });
  }
};
