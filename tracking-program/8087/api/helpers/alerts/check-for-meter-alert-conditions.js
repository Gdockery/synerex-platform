var Moment = require('moment-timezone');
var async = require('async');
var debug = require('debug')('alerts');

module.exports = {


  friendlyName: 'Check for meter alert conditions',


  description: 'Given a project ID, check for alert conditions and trigger alerts if necessary',


  inputs: {

    project: {
      description: 'The project to check meter alert conditions for.',
      example: '===',
      required: true
    }

  },


  fn: function (inputs, exits) {

    var now = new Date().getTime();

    MeterAlertGroup.find({ project: inputs.project.id, isDeleted: false}).populate('alerts').exec(function(err, meterAlertGroups) {
      if (err) { return res.serverError(err); }

      async.each(meterAlertGroups, function(meterAlertGroup, nextMeterAlertGroup) {

        debug(' - checking meter alert group #' + meterAlertGroup.id + ' (type ' + meterAlertGroup.alertType + ', threshold ' + meterAlertGroup.threshold + ', delay ' + (meterAlertGroup.delay || 'n/a') + ')');

        // The "HIGH_DEMAND" alerts, time to set "triggerNotificationOn" to if the meter is found to be in a (new) alert state.
        var desiredNotificationTime = (now + (meterAlertGroup.delay * 60 * 1000));

        // For "GATEWAY_ERROR" alerts, the earliest acceptable time for the last known device message.
        var earliestAllowableCommunication = now - (meterAlertGroup.threshold * 60 * 1000);

        // Get the IDs of all the meters related to this alert group.
        var meterIds = _.pluck(meterAlertGroup.alerts, 'meter');

        // Find all the meter records.
        Meter.find({ id: meterIds }).exec(function(err, meters) {
          if (err) {
            // TODO -- handle error.
            sails.log.error('Error attempting to retrieve meters for meter alert group ' + meterAlertGroup.id + ': ' + require('util').inspect(err, {depth: null}));
            return nextMeterAlertGroup();
          }

          // See if any of the meters are in an alert state.
          async.each(meters, function(meter, nextMeter) {

            debug('  - checking meter #' + meter.id + ' (' + meter.name + ')');

            // Get the meter alert for this meter.
            var meterAlert = _.find(meterAlertGroup.alerts, { meter: meter.id });
            if (!meterAlert) {
              sails.log.error('Consistency violation: could not find associated meter alert for meter ' + meter.id + ' in group ' + meterAlertGroup.id );
              return nextMeter();
            }

            // The earliest time that the next notifications can be sent for this meter alert.
            var earliestNotificationTime = meterAlert.lastNotificationsSent + (24 * 60 * 60 * 1000);

            // For "high demand" alerts...
            if (meterAlertGroup.alertType === sails.config.constants.METER_ALERT_TYPES.HIGH_DEMAND) {

              // Is the meter demand above the threshold?  And has it communicated in the past 10 minutes?
              // The second question is to avoid situations where a meter goes offline while in a high-demand state,
              // thus triggering alerts until it comes back.
              if (meter.lastTotalKva > meterAlertGroup.threshold && meter.lastCommunicatedAt > now - (10 * 60 * 1000)) {
                debug('   A - meter is above threshold and still in communication...');
                // Was the meter already in an alert state?
                if (meterAlert.triggerNotificationOn > 0) {
                  debug('   B - meter is already in alert state...');
                  // Is it time to send the notification?
                  if (now > meterAlert.triggerNotificationOn) {
                    debug('   C - current time > notification time...sending emails...');
                    // Put a record in the MeterAlertEvent table.
                    MeterAlertEvent.create({
                      meter: meter.id,
                      alertGroup: meterAlertGroup.id,
                      project: inputs.project.id
                    }).exec(function(err) {
                      if (err) {
                        sails.log.error('Error attempting to record meter alert event meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                      }
                      // Look up the meter alert group again, this time populating users.
                      // We could do this above, but then we'd be populating users every minute, instead of only
                      // when we needed to send out an email.
                      MeterAlertGroup.findOne({ id: meterAlertGroup.id }).populate('users').exec(function(err, meterAlertGroupWithUsers) {
                        if (err) {
                          sails.log.error('Error attempting to send out emails for meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                          return nextMeter();
                        }
                        async.each(meterAlertGroupWithUsers.users, function(user, nextUser) {
                          debug('    - sending email to ' + user.email);
                          sails.helpers.sendTemplateEmail({
                            template: 'meter-demand-alert',
                            templateData: {
                              user: user,
                              project: inputs.project,
                              meter: meter,
                              alert: meterAlert,
                              alertGroup: meterAlertGroup
                            },
                            to: [user.email],
                            subject: 'Alert: high meter demand reported'
                          }).exec(function(err) {
                            if (err) {
                              sails.log.error('Error attempting to send out email to address `' + user.email + '` for meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                            }
                            return nextUser();
                          });

                        }, function() {
                          var triggerNotificationOn = now + (24 * 60 * 60 * 1000);
                          MeterAlert.update({ id: meterAlert.id }, { lastNotificationsSent: now, triggerNotificationOn: triggerNotificationOn }).exec(function(err) {
                            if (err) {
                              sails.log.error('Error attempting to update meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                            }
                            return nextMeter();
                          }); // </MeterAlert.update>

                        }); // </async.each(meterAlertGroupWithUsers.users)>

                      }); // </MeterAlertGroup.findOne>

                    }); // </MeterAlertEvent.create>

                  } // </if (now > meterAlert.triggerNotificationOn)>

                  // Otherwise just sit tight.
                  else {
                    debug('   D - current time < notification time...doing nothing.');
                    return nextMeter();
                  }

                } // </if (meterAlert.triggerNotificationOn > 0) >

                // Otherwise, set up a time to send a notification.
                else {
                  // Get the next available notification time.
                  var triggerNotificationOn = earliestNotificationTime < desiredNotificationTime ? desiredNotificationTime : earliestNotificationTime;
                  debug('   E - meter was not in alert state...setting triggerNotificationOn to ' + triggerNotificationOn + '...');

                  // Update the meter alert with the notification time.
                  MeterAlert.update({ id: meterAlert.id }, {triggerNotificationOn: triggerNotificationOn}).exec(function(err) {
                    if (err) {
                      sails.log.error('Error attempting to update meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                    }
                    return nextMeter();
                  });

                }

              } // </if meter is above threshold and in communication>

              // If the meter is below threshold or out of communication, and its "triggerNotificationOn" is nonzero, clear it.
              else if (meterAlert.triggerNotificationOn > 0) {
                debug('   F - meter is not above threshold or is out of communication...clearing previous triggerNotificationOn');
                MeterAlert.update({ id: meterAlert.id }, {triggerNotificationOn: 0}).exec(function(err) {
                  if (err) {
                    sails.log.error('Error attempting to update meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                  }
                  return nextMeter();
                });
              }

              // If the meter is below threshold or out of communication, and it wasn't already in an alert state, just continue.
              else {
                debug('   G - meter is not above threshold or is out of communication...doing nothing');
                return nextMeter();
              }
            } // </ If meter alert is "high demand" type

            // Handle "gateway" alerts
            else {

              // Has the meter been out of communication longer than is acceptable based on the alert parameters?
              if (meter.lastCommunicatedAt > 0 && meter.lastCommunicatedAt < earliestAllowableCommunication) {
                debug('   H - meter has been out of communication for too long...');

                if (now < earliestNotificationTime) {
                  debug('    J - alerts already went out during this 24 period...doing nothing...');
                  return nextMeter();
                }

                // Put a record in the MeterAlertEvent table.
                MeterAlertEvent.create({
                  meter: meter.id,
                  alertGroup: meterAlertGroup.id,
                  project: inputs.project.id
                }).exec(function(err) {

                  // Look up the meter alert group again, this time populating users.
                  // We could do this above, but then we'd be populating users every minute, instead of only
                  // when we needed to send out an email.
                  MeterAlertGroup.findOne({ id: meterAlertGroup.id }).populate('users').exec(function(err, meterAlertGroupWithUsers) {
                    if (err) {
                      sails.log.error('Error attempting to send out emails for meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                      return nextMeter();
                    }
                    async.each(meterAlertGroupWithUsers.users, function(user, nextUser) {
                      debug('    - sending email to ' + user.email);
                      sails.helpers.sendTemplateEmail({
                        template: 'meter-offline-alert',
                        templateData: {
                          user: user,
                          project: inputs.project,
                          meter: meter,
                          alert: meterAlert,
                          alertGroup: meterAlertGroup
                        },
                        to: [user.email],
                        subject: 'Alert: meter offline'
                      }).exec(function(err) {
                        if (err) {
                          sails.log.error('Error attempting to send out email to address `' + user.email + '` for meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                        }
                        return nextUser();
                      });

                    }, function() {
                      MeterAlert.update({ id: meterAlert.id }, { lastNotificationsSent: now  }).exec(function(err) {
                        if (err) {
                          sails.log.error('Error attempting to update meter alert ' + meterAlert.id + ': ' + require('util').inspect(err, {depth: null}));
                        }
                        return nextMeter();
                      });
                    });

                  });

                });
              }

              else {
                debug('   I - meter in communication...doing nothing...');
                return nextMeter();
              }

            }

          }, nextMeterAlertGroup);


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
