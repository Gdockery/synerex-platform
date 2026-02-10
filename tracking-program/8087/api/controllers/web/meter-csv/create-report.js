module.exports = {


  friendlyName: 'Create meter CSV report',


  description: 'Create a new CSV report for a set of meters.',


  inputs: {

    project: {
      description: 'The ID of the project to generate the report for.',
      example: 123,
      //required: true
    },

    reportType: {
      description: 'The type of report to generate.',
      example: 1,
      required: true
    },

    meters: {
      description: 'IDs of meters to use in the report.',
      extendedDescription: 'Must contain at least one meter ID.',
      example: [1],
      required: true
    },

    frequency: {
      description: 'The length of interval to group meters by, in minutes.',
      example: 15,
      defaultsTo: 15
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
    },

    users: {
      description: 'IDs of users to email the CSV report to',
      example: [1]
    }

  },


  exits: {

    badReportParameters: {
      description: 'The `fromDate` or `toDate` value was invalid.',
      statusCode: 400
    },

    badReportType: {
      description: 'The `reportType` value was invalid.',
      statusCode: 400
    },

    badMeterIds: {
      description: 'One or more of the provided meter IDs were invalid for the specified project.',
      statusCode: 400
    },

    badUserIds: {
      description: 'One or more of the provided user IDs were invalid for the specified project.',
      statusCode: 400
    },

    unauthorized: {
      statusCode: 404
    },

    success: {
      outputExample: {
        meta: {},
        response: {
          id: 123,
          reportType: 1,
          title: 'Some report title',
          fromDate: 12345,
          toDate: 55555,
          meterCount: 3,
          url: 'http://someurl.com'
        }
      }
    }

  },


  fn: function (inputs, exits) {
    console.log("here");
    var req = this.req;

    var Moment = require('moment-timezone');

    const StorageService = require('../../../services/StorageService')

    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    // Make sure that `toDate` > `fromDate`.
    if (inputs.fromDate > inputs.toDate) {
      return exits.badReportParameters();
    }

    // Make sure the given report type is valid.
    if (!_.contains(_.values(sails.config.constants.METER_CSV_TYPES), inputs.reportType)) {
      return exits.badReportType();
    }

    // Make sure `meters` contains at least one meter, and that all meter IDs are positive integers.
    if (inputs.meters.length === 0 || _.any(inputs.meters, function(meterId) { return meterId === 0 || parseInt(meterId) !== meterId; })) {
      return exits.badMeterIds();
    }



    // Remove `null` entries in the `inputs.users array`.
    var userIds = _.compact(inputs.users);


    async.auto({
      checkMeters: function(cb) {

        Meter.find({id: inputs.meters, isDeleted: false}).exec(function(err, meters) {
          if (err) {return cb(err);}

          // If any of the meters could not be found, bail.
          if (meters.length !== inputs.meters.length) {
            return cb('badMeterIds');
          }

          // If any of the meters are not attached to the given project, bail.
          if (_.any(meters, function(meter) {
            return meter.project !== inputs.project;
          })) {
            return cb('badMeterIds');
          }

          return cb();
        });
      },

      checkUsers: function(cb) {

        if (userIds.length === 0) { return cb(); }
   
        User.find({id: userIds, isDeleted: false}).populate('projects').exec(function(err, users) {
          if (err) {return cb(err);}

          // If any of the users could not be found, bail.
          if (users.length !== userIds.length) {
            return cb('badUserIds');
          }

          // If any of the users don't have access to the given project, bail.
          if (_.any(users, function(user) {
            return (user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(user.projects, {id: inputs.project}));
          })) {
            return cb('badUserIds');
          }

          // All the users checked out.
          return cb(undefined, users);

        });

      }

    }, function createReport(err, results) {
      if (err && err === 'badUserIds') { return exits.badUserIds(); }
      if (err && err === 'badMeterIds') { return exits.badMeterIds(); }
      if (err) { return exits.error(err); }

      var project = _.find(req.user.projects, {id: inputs.project} );
      var title;

      // Get the right helper to generate the report.
      var helper = (function() {

        switch (inputs.reportType) {

          // case sails.config.constants.METER_CSV_TYPES['15_MINUTE']:
          //   return sails.helpers.web.csv.generate15MinuteReport;

          case sails.config.constants.METER_CSV_TYPES['DETAILED_METER']:
            title = project.name + ' - ' + Moment.tz(inputs.fromDate, project.timeZoneId).format('YYYY-MM-DD') + ' to ' + Moment.tz(inputs.toDate, project.timeZoneId).format('YYYY-MM-DD') + ' (' + inputs.frequency + ' minute intervals)';
            return sails.helpers.web.csv.generateDetailedMeterReport;

          // case sails.config.constants.METER_CSV_TYPES['UNOCCUPIED_ENERGY']:
          //   return sails.helpers.web.csv.generateUnoccupiedEnergyReport;

        }

      })();

      // Call the helper to generate the report file and get its UUID.
      helper({
        slug: project.slug,
        title: title,
        meters: inputs.meters,
        intervalLength: inputs.frequency,
        fromDate: inputs.fromDate,
        toDate: inputs.toDate
      }).exec(function(err, uuid) {
        if (err) { return exits.error(err); }

        let csvPath = 'csv/' + title + '\.csv'

        if(!StorageService.existsSync(csvPath)) {
          return exits.error('CSV file not found')
        }

        let url = StorageService.webPath(csvPath)

        // Create the CSV report record.
        MeterCSV.create({
          reportType: inputs.reportType,
          title: title,
          uuid: uuid,
          project: inputs.project,
          fromDate: inputs.fromDate,
          toDate: inputs.toDate,
          meters: inputs.meters,
          users: inputs.users
        }).meta({fetch: true}).exec(function(err, meterCSV) {
          if (err) { return exits.error(err); }

          // If user IDs were specified, send emails to those user.
          async.each(results.checkUsers, function(user, nextUser) {

            sails.helpers.sendTemplateEmail({
              template: 'meter-csv',
              templateData: {
                user: user,
                title: title,
                url: 'http://portal.xecoenergy.com' + url
              },
              to: [user.email],
              subject: 'New Xeco meter data report'
            }).exec(nextUser);

          }, function(err) {
            // TODO - handle error in sending emails

            return exits.success({
              meta: {},
              response: {
                id: meterCSV.id,
                reportType: meterCSV.reportType,
                title: meterCSV.title,
                fromDate: meterCSV.fromDate,
                toDate: meterCSV.toDate,
                meterCount: inputs.meters.length,
                url: url
              }
            });

          }); // </async.each(results.users)

        }); // </ MeterCSV.create() >

      }); // </ helper that creates report >

    }); //  </ async.parallel that checks meters and users >

  }


};
