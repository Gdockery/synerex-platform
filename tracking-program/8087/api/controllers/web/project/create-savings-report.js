module.exports = {


  friendlyName: 'Create savings report',


  description: 'Create savings report for this project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    }, 

    // The first day of the billing cycle that this report represents, as a JS timestamp.
    fromDate: {
      type: 'number',
      required: true
    },

    // The last day of the billing cycle that this report represents, as a JS timestamp.
    // This is an inclusive range.
    toDate: {
      type: 'number',
      required: true
    },

    reportData: {
      description: 'Data for the new cost savings report.',
      example: {},
      required: true
    }

  },


  exits: {
    badRequest: { statusCode: 400 },
    conflict: { statusCode: 409 }
  },


  fn: function (inputs, exits) {

    var flaverr = require('flaverr');
    var Moment = require('moment-timezone');

    if (!_.isUndefined(inputs.reportData.project) || !_.isUndefined(inputs.reportData.fromDate) || !_.isUndefined(inputs.reportData.toDate)) {
      return exits.badRequest('`reportData` must not contain `project`, `fromDate` or `toDate` keys  (instead, specify `project`, `fromDate` and `toDate` as top-level request parameters)');
    }

    // Look up the project we're trying to create a savings report for.
    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error(err); }
      if (!project) { return exits.badRequest(); }

      // Determine which month this report represents, by checking the day of the "fromDate".
      // If it's <=15, use the month from the "fromDate", otherwise use the month from the "toDate".
      var month = (function() {
        var fromDateMoment = new Moment(inputs.fromDate).tz(project.timeZoneId);
        var month = fromDateMoment.month();
        var year = fromDateMoment.year();
        // If the "from" date is after the 15th of the month, increment month.
        // Note that using the Moment `.month()` method below means that if month === 12
        // then the year will automatically roll over (months in Moment are 0-based).
        if (fromDateMoment.date() > 15) {
          month++;
        }
        return (new Moment()).year(year).month(month).format('YYYY-MM');
      })();

      sails.getDatastore()
      .transaction(function (db, proceed){

        SavingsReport.findOne({
          project: inputs.project,
          month: month,
        }).usingConnection(db).exec(function(err, existingReport) {
          if (err) { return proceed(err); }

          if (existingReport) {
            return proceed(flaverr('E_CONFLICT', new Error('...')));
          }

          SavingsReport.create({
            project: inputs.project,
            month: month,
            fromDate: inputs.fromDate,
            // Make sure the "to" date is at the very end of the day, since this is an inclusive range.
            toDate: (new Moment(inputs.toDate)).endOf('day').valueOf(),
            reportData: inputs.reportData
          }).usingConnection(db).exec(function(err) {
            if (err) { return proceed(err); }

            return proceed();
          }); // </ SavingsReport.create >
        }); // </ SavingsReport.findOne >

      }).exec(function (err) {
        // Mimic the standard "bad request" error response for consistency:
        if (err && err.code === 'E_CONFLICT') {
          return exits.conflict({
            code: 'E_MISSING_OR_INVALID_PARAMS',
            message: 'The server could not fulfill this request due to a conflict in 1 parameter.',
            errors: [
              {
                code: 'E_CONFLICT',
                input: 'month',
                reason:
                  'An existing savings report with that month string (`'+month+'`) '+
                  'already exists for this project.  To replace it, please first delete the '+
                  'existing report and then try again.'
              },
            ]
          });
        }
        if (err) { return exits.error(err); }
        if (!inputs.reportData.lineItems) { return exits.success();}
        console.log("bill created!");
        let billingRate = 0, avgRate = 0, multiplier = 0, kwMultiplier;
       
        SavingsReport.find({project: inputs.project}).sort('createdAt DESC').exec(function(err, savingsReports) {
          if (err) { return exits.error("savingsReport in get-current-savings.js exited with error"); }
            //Find rates, avg rate and whether has power credit when there is X (specified in line items in savings report)  

            let reportsPfc = {year:[], month:[], pfc: []}; //pfc is 0 or negative
            let monthPfc = 0;
            let lastMonthPfc = 0;
            let yearPfc = 0;
            let lastYearPfc = 0;
            let projectPfc = 0;
            let taxPercent = 0;
            var now = Moment.tz(new Moment(), project.timeZoneId);
            let thisMonth = Moment(now).format('MM').toString();
            let lastMonth =  Moment(now).subtract(1, 'month').format('MM').toString();
            let currentYear = Moment(now).format('YYYY').toString();
            let lastYear =  Moment(now).subtract(1, 'year').format('YYYY').toString();
            
            if (savingsReports.length  == 0) {
            //if there is no new bills entered use the initial bill analytics
              project.electricBillAnalysis.lineItems.forEach(function(lineItem){
                if (lineItem.type == "kw" && lineItem.tierHours != "0" && lineItem.tierHours != 0 && lineItem.tierHours != "null" && lineItem.tierHours != null){
                  billingRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                }
                if (lineItem.type == "kwh" && lineItem.tierHours != "0" && lineItem.tierHours != "null" && lineItem.tierHours != null && lineItem.tierHours != 0){
                  avgRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                  console.log("csr avgRate set to not 0 sr=0" );
                }
                if (lineItem.type =="tax") {
                  //value added tax percentage
                  taxPercent += parseFloat(lineItem.cost) / parseFloat(project.electricBillAnalysis.billAmount);
                }
              });
            } else {
              savingsReports[0].reportData.lineItems.forEach(function(lineItem){
                if (lineItem.type == "kw" && lineItem.tierHours != "0" && lineItem.tierHours != 0 && lineItem.tierHours != "null" && lineItem.tierHours != null){
                  billingRate += parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                }
                if (lineItem.type == "kwh" && lineItem.tierHours != "0" && lineItem.tierHours != "null" && lineItem.tierHours != null && lineItem.tierHours != 0){
                    avgRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
                    console.log("csr avgRate set to not 0 sr!=0" );
                }
                if (lineItem.type =="tax") {
                  //value added tax percentage
                  taxPercent += parseFloat(lineItem.cost) / parseFloat(savingsReports[0].reportData.totalBill);
                }
              });

              savingsReports.forEach(function(report){
                multiplier += report.reportData.kwhMultiplier;
                kwMultiplier += report.reportData.kwMultiplier;
                reportsPfc.year.push(parseInt(report.month.substring(0, 4)));
                reportsPfc.month.push(parseInt(report.month.substring(5, 7))); //get the year from month field
                reportsPfc.pfc.push(parseFloat(report.reportData.pfc * -1 * 0.3)); //change pfc to positive
              });

              multiplier = multiplier / savingsReports.length;
              kwMultiplier = kwMultiplier / savingsReports.length

              if (parseInt(thisMonth) == reportsPfc.month[0]) {
                monthPfc = reportsPfc.pfc[0];
              } 

              if (parseInt(lastMonth) == reportsPfc.month[1]){
                lastMonthPfc = reportsPfc.pfc[1];
              } 
              for (var i = 0; i < reportsPfc.year.length; i++){
                if (reportsPfc.year[i] == parseInt(currentYear)){
                  yearPfc += reportsPfc.pfc[i];
                } else if (reportsPfc.year[i] == parseInt(lastYear)) {
                  lastYearPfc += reportsPfc.pfc[i];
                } else {
                  projectPfc += reportsPfc.pfc[i];
                }
              }
              projectPfc += lastYearPfc;
              projectPfc += yearPfc;
            }
            
            Project.update({ id: inputs.project})
            .set({kwRate: billingRate, kwhRate: avgRate, taxRate: taxPercent, multiplier: project.multiplier * multiplier, peakMultiplier: project.peakMultiplier * kwMultiplier}).exec(function(err) {
              if (err) { return exits.error(err); }
            });

            ReportData.update({ project: inputs.project, typeId: inputs.project, period: 'month', valueType: 'pfc'})
            .set({value: monthPfc}).exec(function(err) {
              if (err) { return exits.error(err); }
            });
            ReportData.update({ project: inputs.project, typeId: inputs.project, period: 'lastMonth', valueType: 'pfc'})
            .set({value: lastMonthPfc}).exec(function(err) {
              if (err) { return exits.error(err); }
            }); 
            ReportData.update({ project: inputs.project, typeId: inputs.project, period: 'year', valueType: 'pfc'})
            .set({value: yearPfc}).exec(function(err) {
              if (err) { return exits.error(err); }
            });
            ReportData.update({ project: inputs.project, typeId: inputs.project, period: 'lastYear', valueType: 'pfc'})
            .set({value: lastYearPfc}).exec(function(err) {
              if (err) { return exits.error(err); }
            });
            ReportData.update({ project: inputs.project, typeId: inputs.project, period: 'allTime', valueType: 'pfc'})
            .set({value: projectPfc}).exec(function(err) {
              if (err) { return exits.error(err); }
            });
          
          });
          return exits.success();
         });
    }); // </ Project.findOne() >
  }
};
