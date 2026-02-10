var Moment = require('moment-timezone');
var async = require('async');
var debug = require('debug')('alerts');

module.exports = {


  friendlyName: 'Check for repeater alert conditions',


  description: 'Given a project ID, check for alert conditions and trigger alerts if necessary',


  inputs: {

    project: {
      description: 'The project to check repeater alert conditions for.',
      example: '===',
      required: true
    }

  },


  fn: function (inputs, exits) {

    var now = new Date().getTime();

    RepeaterAlertGroup.find({ project: inputs.project.id, isDeleted: false}).populate('alerts').exec(function(err, repeaterAlertGroups) {
      if (err) { return res.serverError(err); }

      async.each(repeaterAlertGroups, function(repeaterAlertGroup, nextRepeaterAlertGroup) {

        debug(' - checking repeater alert group #' + repeaterAlertGroup.id + ' (type ' + repeaterAlertGroup.alertType + ', threshold ' + repeaterAlertGroup.threshold + ', delay ' + (repeaterAlertGroup.delay || 'n/a') + ')');

        // The earliest acceptable time for the last known device message.
        var earliestAllowableCommunication = now - (repeaterAlertGroup.threshold * 60 * 1000);

        // Get the IDs of all the repeaters related to this alert group.
        var repeaterIds = _.pluck(repeaterAlertGroup.alerts, 'repeater');

        // Find all the repeater records.
        Repeater.find({ id: repeaterIds }).exec(function(err, repeaters) {
          if (err) {
            // TODO -- handle error.
            sails.log.error('Error attempting to retrieve repeaters for repeater alert group ' + repeaterAlertGroup.id + ': ' + require('util').inspect(err, {depth: null}));
            return nextRepeaterAlertGroup();
          }

          // See if any of the repeaters are in an alert state.
          async.each(repeaters, function(repeater, nextRepeater) {

            debug('  - checking repeater #' + repeater.id + ' (' + repeater.name + ')');

            // Get the repeater alert for this repeater.
            var repeaterAlert = _.find(repeaterAlertGroup.alerts, { repeater: repeater.id });
            if (!repeaterAlert) {
              sails.log.error('Consistency violation: could not find associated repeater alert for repeater ' + repeater.id + ' in group ' + repeaterAlertGroup.id );
              return nextRepeater();
            }

            // The earliest time that the next notifications can be sent for this repeater alert.
            var earliestNotificationTime = repeaterAlert.lastNotificationsSent + (24 * 60 * 60 * 1000);


            // Has the repeater been out of communication longer than is acceptable based on the alert parameters?
            if (repeater.lastCommunicatedAt > 0 && repeater.lastCommunicatedAt < earliestAllowableCommunication) {
              debug('   H - repeater has been out of communication for too long...');

              if (now < earliestNotificationTime) {
                debug('    J - alerts already went out during this 24 period...doing nothing...');
                return nextRepeater();
              }

              // Put a record in the RepeaterAlertEvent table.
              RepeaterAlertEvent.create({
                repeater: meter.id,
                alertGroup: repeaterAlertGroup.id,
                project: inputs.project.id
              }).exec(function(err) {

                // Look up the repeater alert group again, this time populating users.
                // We could do this above, but then we'd be populating users every minute, instead of only
                // when we needed to send out an email.
                RepeaterAlertGroup.findOne({ id: repeaterAlertGroup.id }).populate('users').exec(function(err, repeaterAlertGroupWithUsers) {
                  if (err) {
                    sails.log.error('Error attempting to send out emails for repeater alert ' + repeaterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                    return nextRepeater();
                  }
                  async.each(repeaterAlertGroupWithUsers.users, function(user, nextUser) {
                    debug('    - sending email to ' + user.email);
                    sails.helpers.sendTemplateEmail({
                      template: 'repeater-offline-alert',
                      templateData: {
                        user: user,
                        project: inputs.project,
                        repeater: repeater,
                        alert: repeaterAlert,
                        alertGroup: repeaterAlertGroup
                      },
                      to: [user.email],
                      subject: 'Alert: repeater offline'
                    }).exec(function(err) {
                      if (err) {
                        sails.log.error('Error attempting to send out email to address `' + user.email + '` for repeater alert ' + repeaterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                      }
                      return nextUser();
                    });

                  }, function() {
                    RepeaterAlert.update({ id: repeaterAlert.id }, { lastNotificationsSent: now  }).exec(function(err) {
                      if (err) {
                        sails.log.error('Error attempting to update repeater alert ' + repeaterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                      }
                      return nextRepeater();
                    });
                  });

                });

              });
            }

            else {
              debug('   I - repeater in communication...doing nothing...');
              return nextRepeater();
            }


          }, nextRepeaterAlertGroup);


        });



      }, function(err) {
        if (err) {
          return exits.error(err);
        }
        return exits.success();
      });

    });

  }

};
