var Moment = require('moment-timezone');
var async = require('async');
var flaverr = require('flaverr');

module.exports = function doGenerateReport(req, res) {
  var sails = req._sails;
  var datastore = sails.getDatastore('default');

  Project.find({isDeleted: false}).exec(function(err, projects) {
    if (err) { return res.serverError(err); }
    async.eachLimit(projects, 1, function(project, nextProject) {
      console.log('[' + Moment().format() + '] doGenerateReport projectId ' + project.id + ', ' + project.name);
      let now = Moment.tz(new Moment(), project.timeZoneId);
      let today = Moment(now);
      let yesterday = Moment(now).subtract(1, 'day');
      let newMonth = yesterday.startOf('month').isSame(today.startOf('month'), 'date') ? false : true;
      if (!newMonth){ //this should be !newMonth
        return res.ok();
      } else {
          let fromDate = yesterday.startOf('month').valueOf();
          let toDate = yesterday.endOf('month').valueOf();
          sails.helpers.web.meter.getAggregateDataForPeriod({
          project: project.id,
          fromDate: fromDate,
          toDate: toDate,
        }).exec(function(err, data) {
          if (err) { return exits.error(err);}
          let reportData = {
              total: 0,
              totalBeforeXeco: 0,
              usageKWH: 0,
              kwPeak: 0,
              kwhSavings: 0,
              kwPeakSavings:0,
              totalBill: 0,
              pfc: 0,
            };

            reportData.total = (data.kwh * project.kwhRate) + (data.kvaPeak * project.kwRate);
            reportData.usageKWH = _.round(data.kwh);
            reportData.kwPeak = _.round(data.kvaPeak);
            reportData.kwhSavings = _.round(project.kwhSavings * 100, 2);
            reportData.kwPeakSavings = _.round(project.kwPeakSavings * 100, 2);
            reportData.totalBill = _.round(reportData.total * (1 + project.taxRate), 2);
            reportData.totalBeforeXeco = ((data.kwh * project.kwhRate * (1 + project.kwhSavings)) + (data.kvaPeak * project.kwRate * (1 + project.kwSavings))) * (1 + project.taxRate);

            // Determine which month this report represents, by checking the day of the "fromDate".
            // If it's <=15, use the month from the "fromDate", otherwise use the month from the "toDate".
            var month = (function() {
              var fromDateMoment = new Moment(fromDate).tz(project.timeZoneId);
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
            sails.getDatastore().transaction(function (db, proceed){
              SavingsReport.findOne({project: project.id,month: month,}).usingConnection(db).exec(function(err, existingReport) {
                if (err) { return proceed(err); }
                if (existingReport) {
                  return proceed(flaverr('E_CONFLICT', new Error('...')));
                }

                SavingsReport.create({
                  project: project.id,
                  month: month,
                  fromDate: fromDate,
                  // Make sure the "to" date is at the very end of the day, since this is an inclusive range.
                  toDate: toDate,
                  reportData: reportData
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
              console.log("bill created!");
            });
        });
      }

      return nextProject();
    }, function(err) {
      if (err) {return res.serverError(err);}

      return res.ok();
    });
  });
};
