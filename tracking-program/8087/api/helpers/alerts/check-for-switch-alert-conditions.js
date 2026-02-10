var Moment = require('moment-timezone');
var async = require('async');
var debug = require('debug')('alerts');

module.exports = {


  friendlyName: 'Check for switch alert conditions',


  description: 'Given a project ID, check for alert conditions and trigger alerts if necessary',


  inputs: {

    project: {
      description: 'The project to check switch alert conditions for.',
      example: '===',
      required: true
    }

  },


  fn: function (inputs, exits) {

    var now = new Date().getTime();

    SwitchAlertGroup.find({ project: inputs.project.id, isDeleted: false}).populate('alerts').exec(function(err, switchAlertGroups) {
      if (err) { return res.serverError(err); }

      async.each(switchAlertGroups, function(switchAlertGroup, nextSwitchAlertGroup) {

        debug(' - checking switch alert group #' + switchAlertGroup.id + ' (type ' + switchAlertGroup.alertType + ', threshold ' + switchAlertGroup.threshold + ', delay ' + (switchAlertGroup.delay || 'n/a') + ')');

        // The earliest acceptable time for the last known device message.
        var earliestAllowableCommunication = now - (switchAlertGroup.threshold * 60 * 1000);

        // Get the IDs of all the switchs related to this alert group.
        var switchIds = _.pluck(switchAlertGroup.alerts, 'switch');

        // Find all the switch records.
        Switch.find({ id: switchIds }).exec(function(err, switchs) {
          if (err) {
            // TODO -- handle error.
            sails.log.error('Error attempting to retrieve switchs for switch alert group ' + switchAlertGroup.id + ': ' + require('util').inspect(err, {depth: null}));
            return nextSwitchAlertGroup();
          }

          // See if any of the switchs are in an alert state.
          async.each(switchs, function(aSwitch, nextSwitch) {

            debug('  - checking switch #' + aSwitch.id + ' (' + aSwitch.name + ')');

            // Get the switch alert for this switch.
            var switchAlert = _.find(switchAlertGroup.alerts, { switch: aSwitch.id });
            if (!switchAlert) {
              sails.log.error('Consistency violation: could not find associated switch alert for switch ' + aSwitch.id + ' in group ' + switchAlertGroup.id );
              return nextSwitch();
            }

            // The earliest time that the next notifications can be sent for this switch alert.
            var earliestNotificationTime = switchAlert.lastNotificationsSent + (24 * 60 * 60 * 1000);


            // Has the switch been out of communication longer than is acceptable based on the alert parameters?
            if (aSwitch.meshLastCommunicatedAt > 0 && aSwitch.meshLastCommunicatedAt < earliestAllowableCommunication) {
              debug('   H - switch has been out of communication for too long...');

              if (now < earliestNotificationTime) {
                debug('    J - alerts already went out during this 24 period...doing nothing...');
                return nextSwitch();
              }

              // Put a record in the MeterAlertEvent table.
              SwitchAlertEvent.create({
                switch: aSwitch.id,
                alertGroup: switchAlertGroup.id,
                project: inputs.project.id
              }).exec(function(err) {

                // Look up the switch alert group again, this time populating users.
                // We could do this above, but then we'd be populating users every minute, instead of only
                // when we needed to send out an email.
                SwitchAlertGroup.findOne({ id: switchAlertGroup.id }).populate('users').exec(function(err, switchAlertGroupWithUsers) {
                  if (err) {
                    sails.log.error('Error attempting to send out emails for switch alert ' + switchAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                    return nextSwitch();
                  }
                  async.each(switchAlertGroupWithUsers.users, function(user, nextUser) {
                    debug('    - sending email to ' + user.email);
                    sails.helpers.sendTemplateEmail({
                      template: 'switch-offline-alert',
                      templateData: {
                        user: user,
                        project: inputs.project,
                        switchDevice: aSwitch,
                        alert: switchAlert,
                        alertGroup: switchAlertGroup
                      },
                      to: [user.email],
                      subject: 'Alert: switch offline'
                    }).exec(function(err) {
                      if (err) {
                        sails.log.error('Error attempting to send out email to address `' + user.email + '` for switch alert ' + switchAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                      }
                      return nextUser();
                    });

                  }, function() {
                    SwitchAlert.update({ id: switchAlert.id }, { lastNotificationsSent: now  }).exec(function(err) {
                      if (err) {
                        sails.log.error('Error attempting to update switch alert ' + switchAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                      }
                      return nextSwitch();
                    });
                  });

                });

              });
            }

            else {
              debug('   I - switch in communication...doing nothing...');
              return nextSwitch();
            }


          }, nextSwitchAlertGroup);


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
