var Moment = require('moment-timezone');
var async = require('async');
var debug = require('debug')('alerts');

module.exports = function checkForAlertConditions(req, res) {

  var sails = req._sails;
  var datastore = sails.getDatastore('default');
  var projectId = req.param('project');

  // Make sure the project is real and not archived.
  Project.findOne({id: projectId}).exec(function(err, project) {
    if (err) { return res.serverError(err);}
    if (!project) { return res.notFound(); }
    if (project.isDeleted) { return res.serverError(new Error('Could not check alert conditions for project #' + projectId + ' because it is deleted.'));}

    debug('Checking for alerts in project #' + project.id + ' (' + project.name + ')');

    async.parallel([

      function meterAlerts(cb) {

        sails.helpers.alerts.checkForMeterAlertConditions({ project: project }).exec(function(err) {
          if (err) {
            sails.log.error('Error checking for meter alerts on project ' + project.id + ': ' + require('util').inspect(err, {depth: null}));
          }
          return cb();
        });

      },

      function repeaterAlerts(cb) {

        sails.helpers.alerts.checkForRepeaterAlertConditions({ project: project }).exec(function(err) {
          if (err) {
            sails.log.error('Error checking for repeater alerts on project ' + project.id + ': ' + require('util').inspect(err, {depth: null}));
          }
          return cb();
        });

      },

      function switchAlerts(cb) {

        sails.helpers.alerts.checkForSwitchAlertConditions({ project: project }).exec(function(err) {
          if (err) {
            sails.log.error('Error checking for switch alerts on project ' + project.id + ': ' + require('util').inspect(err, {depth: null}));
          }
          return cb();
        });

      }

    ], function(err) {
      if (err) { return res.serverError(err); }
      return res.ok();

    });

  });

};
