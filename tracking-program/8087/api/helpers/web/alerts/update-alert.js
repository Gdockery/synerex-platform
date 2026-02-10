module.exports = {


  friendlyName: 'Update alert',


  description: 'Update an existing alert group.',


  inputs: {

    deviceType: {
      description: 'The type of device the group represents',
      example: 'meter',
      required: true
    },

    user: {
      description: 'The current logged-in user.',
      example: '===',
      required: true
    },

    id: {
      description: 'The ID of the alert group to update.',
      example: 123,
      required: true
    },

    devices: {
      description: 'IDs of devices to add to the alert.',
      extendedDescription: 'This list, if provided, will completely replace the previous list of devices attached to this alert.',
      example: [1]
    },

    users: {
      description: 'IDs of users to add to the alert.',
      extendedDescription: 'This list, if provided, will completely replace the previous list of users attached to this alert.',
      example: [1],
    }

  },


  exits: {

    badDeviceIds: {
      description: 'One or more of the provided device IDs were invalid for the specified project.',
      statusCode: 400,
      outputExample: ''
    },

    badUserIds: {
      description: 'One or more of the provided user IDs were invalid for the specified project.',
      statusCode: 400,
      outputExample: ''
    },

    unauthorized: {
      statusCode: 404,
      outputExample: ''
    },

    notFound: {
      statusCode: 404,
      outputExample: ''
    }

  },


  fn: function (inputs, exits) {

    var AlertGroup;
    var AlertEvent;
    var Alert;
    var Device;

    if (!_.contains(['meter', 'repeater', 'switch'], inputs.deviceType)) {
      return exits.error(new Error('The given device type was not valid.'));
    }

    switch (inputs.deviceType) {

      case 'meter':
        AlertGroup = MeterAlertGroup;
        AlertEvent = MeterAlertEvent;
        Alert = MeterAlert;
        Device = Meter;
        break;

      case 'repeater':
        AlertGroup = RepeaterAlertGroup;
        AlertEvent = RepeaterAlertEvent;
        Alert = RepeaterAlert;
        Device = Repeater;
        break;


      case 'switch':
        AlertGroup = SwitchAlertGroup;
        AlertEvent = SwitchAlertEvent;
        Alert = SwitchAlert;
        Device = Switch;
        break;
    }

    // Fetch the meter alert group in question.
    AlertGroup.findOne({id: inputs.id})
      .populate('alerts')
      .populate('users')
      .exec(function(err, alertGroup) {
        if (err) { return exits.error(err); }
        if (!alertGroup) { return exits.notFound(); }

        // Make sure that the logged-in user has access to this device alert group (via its project).
        if ( !_.find(inputs.user.projects, {id: alertGroup.project} )) {
          return exits.unauthorized();
        }

        // Make sure `devices` (if provided) contains at least one device, and that all device IDs are positive integers.
        if (!_.isUndefined(inputs.devices) && (inputs.devices.length === 0 || _.any(inputs.devices, function(deviceId) { return deviceId === 0 || parseInt(deviceId) !== deviceId; }))) {
          return exits.badDeviceIds();
        }

        // Make sure `users` contains only positive integers.
        if (!_.isUndefined(inputs.users) && _.any(inputs.users, function(userId) { return userId === 0 || parseInt(userId) !== userId; })) {
          return exits.badUserIds();
        }

        async.auto({

          // Validate that all specified users have access to the given project.
          checkUsers: function(cb) {
            if (!inputs.users) { return cb(); }
            User.find({id: inputs.users}).populate('projects').exec(function(err, users) {
              if (err) {return cb(err);}

              // If any of the users could not be found, bail.
              if (users.length !== inputs.users.length) {
                return cb('badUserIds');
              }

              // If any of the users don't have access to the given project, bail.
              if (_.any(users, function(user) {
                return (user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(user.projects, {id: alertGroup.project}));
              })) {
                return cb('badUserIds');
              }

              // All the users checked out.
              return cb();

            });
          },

          checkDevices: function(cb) {
            if (!inputs.devices) { return cb(); }
            Device.find({id: inputs.devices}).exec(function(err, devices) {
              if (err) {return cb(err);}

              // If any of the devices could not be found, bail.
              if (devices.length !== inputs.devices.length) {
                return cb('badDeviceIds');
              }

              // If any of the devices are not attached to the given project, bail.
              if (_.any(devices, function(device) {
                return device.project !== alertGroup.project;
              })) {
                return cb('badDeviceIds');
              }

              // All the devices checked out.
              return cb();

            });
          }

        }, function(err) {
          if (err && err === 'badUserIds') { return exits.badUserIds(); }
          if (err && err === 'badDeviceIds') { return exits.badDeviceIds(); }
          if (err) { return exits.error(err); }

          // Get a reference to the datastore.
          var datastore = sails.getDatastore('default');

          // Begin a transaction.
          datastore.transaction(function(db, proceed) {

            async.auto({

              replaceDevices: function(cb) {
                if (!inputs.devices) { return cb(); }
                // Get the IDs of devices associated with this group.
                var deviceIds = _.pluck(alertGroup.alerts, 'device');

                // Get the IDs of devices to remove from this group.
                var deviceIdsToRemove = _.difference(deviceIds, inputs.devices);

                // Get the IDs of device alerts to remove from this group.
                var devicesAlertsIdsToRemove = _.pluck(_.filter(alertGroup.alerts, function(alert) {
                  return _.contains(deviceIdsToRemove, alert.device);
                }), 'id');

                // Get the IDs of devices to add to this group.
                var devicesToAdd = _.difference(inputs.devices, deviceIds);

                // Remove device alerts from the group.
                Alert.destroy({id: devicesAlertsIdsToRemove}).exec(function(err) {
                  if (err) { return proceed(err); }

                  // Remove device alert events associated with deleted device alerts.
                  AlertEvent.destroy({alertGroup: inputs.id, [inputs.deviceType]: deviceIdsToRemove}).exec(function(err) {
                    if (err) { return proceed(err); }

                    // Add new device alerts to group.
                    Alert.createEach(_.map(devicesToAdd, function(deviceToAdd) {

                      return {
                        [inputs.deviceType]: deviceToAdd,
                        group: inputs.id
                      };

                    }))
                    .meta({fetch: true})
                    .exec(proceed); // </ add new device alerts to group>

                  }); // </ remove old device alert events>

                }); //< /destroy old device alerts>

              },

              replaceUsers: function(cb) {
                if (!inputs.users) { return cb(); }

                // Update the users for the alert group.
                AlertGroup.replaceCollection(inputs.id, 'users', inputs.users).exec(cb);

              }

            }, proceed);

          }, function(err) {

            if (err) { return exits.error(err); }
            return exits.success();

          }); // </ datastore.transaction() >

        }); // </ asyc.auto() >

      }); // </ AlertGroup.findOne() >

  }

};
