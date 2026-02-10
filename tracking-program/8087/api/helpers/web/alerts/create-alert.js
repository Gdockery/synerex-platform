module.exports = {


  friendlyName: 'Create alert',


  description: 'Create a new alert group.',


  inputs: {

    project: {
      description: 'The ID of the project to create an alert group for.',
      example: 123,
      required: true
    },

    deviceType: {
      description: 'The type of device the group represents',
      example: 'meter',
      required: true
    },

    alertType: {
      description: 'The type of alert that this group represents.',
      example: 1,
      required: true
    },

    threshold: {
      description: 'The alert threshold.',
      extendedDescription: 'If provided, must be a positive integer. For `HIGH_DEMAND` alerts, the power reading threshold above which the meter should be put in a warning state.  For `GATEWAY_ERROR` alerts, the amount of time that the meter must  be offline before triggering an alert.',
      example: 200
    },

    delay: {
      description: 'The alert delay.',
      extendedDescription: 'If provided, must be a positive integer. For `HIGH_DEMAND`, the duration that the meter must spend in the warning state (i.e. continuously reporting power usage above the `thresold` value) before triggering an alert.',
      example: 120
    },

    devices: {
      description: 'IDs of devices to add to the alert.',
      extendedDescription: 'Must contain at least one device ID.',
      example: [1],
      required: true
    },

    users: {
      description: 'IDs of users to add to the alert.',
      example: [1]
    }

  },


  exits: {

    badAlertType: {
      description: 'The given `alertType` value was invalid.',
      statusCode: 400,
      outputExample: ''
    },

    badAlertParameters: {
      description: 'The `threshold` or `delay` values were invalid for the specified alert type.',
      statusCode: 400,
      outputExample: ''
    },

    badDeviceIds: {
      description: 'One or more of the provided meter IDs were invalid for the specified project.',
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

    success: {
      outputExample: {
        meta: {},
        response: {
          id: 123,
          alertType: 1,
          threshold: 255,
          delay: 10,
          deviceCount: 3,
          users: [{
            id: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acmeinc.com'
          }]
        }
      }
    }

  },


  fn: function (inputs, exits) {

    var AlertGroup;
    var Alert;
    var Device;

    if (!_.contains(['meter', 'repeater', 'switch'], inputs.deviceType)) {
      return exits.error(new Error('The given device type was not valid.'));
    }

    // Make sure that `threshold` and `delay` are valid if provided.
    if (
      (!_.isUndefined(inputs.threshold) && (inputs.threshold === 0 || parseInt(inputs.threshold) !== inputs.threshold)) ||
      (!_.isUndefined(inputs.delay) && (inputs.delay === 0 || parseInt(inputs.delay) !== inputs.delay))
    ) {
      return exits.badAlertParameters();
    }

    // Make sure `devices` contains at least one device, and that all device IDs are positive integers.
    if (inputs.devices.length === 0 || _.any(inputs.devices, function(deviceId) { return deviceId === 0 || parseInt(deviceId) !== deviceId; })) {
      return exits.badDeviceIds();
    }

    // Make sure `users` contains only positive integers.
    if (!_.isUndefined(inputs.users) && _.any(inputs.users, function(userId) { return userId === 0 || parseInt(userId) !== userId; })) {
      return exits.badUserIds();
    }

    switch (inputs.deviceType) {

      case 'meter':
        // Make sure the given alert type is valid.
        if (!_.contains(_.values(sails.config.constants.METER_ALERT_TYPES), inputs.alertType)) {
          return exits.badAlertType();
        }

        // If it's a HIGH_DEMAND alert, make sure the appropriate parameters are set.
        if (inputs.alertType === sails.config.constants.METER_ALERT_TYPES.HIGH_DEMAND && _.isUndefined(inputs.delay)) {
          return exits.badAlertParameters();
        }

        // If it's a GATEWAY_ERROR alert, make sure the appropriate parameters are set.
        else if (inputs.alertType === sails.config.constants.METER_ALERT_TYPES.GATEWAY_ERROR && !_.isUndefined(inputs.delay)) {
          return exits.badAlertParameters();
        }

        AlertGroup = MeterAlertGroup;
        Alert = MeterAlert;
        Device = Meter;
        break;

      case 'repeater':
        // Make sure the given alert type is valid.
        if (!_.contains(_.values(sails.config.constants.REPEATER_ALERT_TYPES), inputs.alertType)) {
          return exits.badAlertType();
        }

        // If it's a GATEWAY_ERROR alert, make sure the appropriate parameters are set.
        else if (inputs.alertType === sails.config.constants.REPEATER_ALERT_TYPES.GATEWAY_ERROR && !_.isUndefined(inputs.delay)) {
          return exits.badAlertParameters();
        }

        AlertGroup = RepeaterAlertGroup;
        Alert = RepeaterAlert;
        Device = Repeater;
        break;


      case 'switch':
        // Make sure the given alert type is valid.
        if (!_.contains(_.values(sails.config.constants.SWITCH_ALERT_TYPES), inputs.alertType)) {
          return exits.badAlertType();
        }

        // If it's a GATEWAY_ERROR alert, make sure the appropriate parameters are set.
        else if (inputs.alertType === sails.config.constants.SWITCH_ALERT_TYPES.GATEWAY_ERROR && !_.isUndefined(inputs.delay)) {
          return exits.badAlertParameters();
        }

        AlertGroup = SwitchAlertGroup;
        Alert = SwitchAlert;
        Device = Switch;
        break;

    }


    async.auto({

      // Validate that all specified users have access to the given project.
      checkUsers: function(cb) {
        User.find({id: inputs.users, isDeleted: false}).populate('projects').exec(function(err, users) {
          if (err) {return cb(err);}

          // If any of the users could not be found, bail.
          if (users.length !== inputs.users.length) {
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
      },

      checkDevices: function(cb) {
        Device.find({id: inputs.devices, isDeleted: false}).exec(function(err, devices) {
          if (err) {return cb(err);}

          // If any of the devices could not be found, bail.
          if (devices.length !== inputs.devices.length) {
            return cb('badDeviceIds');
          }

          // If any of the devices are not attached to the given project, bail.
          if (_.any(devices, function(device) {
            return device.project !== inputs.project;
          })) {
            return cb('badDeviceIds');
          }

          // All the devices checked out.
          return cb();

        });
      }

    }, function(err, results) {
      if (err && err === 'badUserIds') { return exits.badUserIds(); }
      if (err && err === 'badDeviceIds') { return exits.badDeviceIds(); }
      if (err) { return exits.error(err); }

      // Get a reference to the datastore.
      var datastore = sails.getDatastore('default');

      // Begin a transaction.
      datastore.transaction(function(db, proceed) {

        // Create the new meter alert group.
        AlertGroup.create({
          project: inputs.project,
          alertType: inputs.alertType,
          threshold: inputs.threshold,
          delay: inputs.delay,
          meters: inputs.meters,
          users: inputs.users
        })
        .usingConnection(db)
        .meta({fetch: true})
        .exec(function(err, alertGroup) {
          if (err) { return proceed(err); }

          // Create the new meter alerts for the group.
          Alert.createEach(_.map(inputs.devices, function(deviceId) {
            return {
              project: inputs.project,
              group: alertGroup.id,
              [inputs.deviceType]: deviceId
            };
          }))
          .usingConnection(db)
          .exec(function(err) {
            if (err) { return proceed(err); }
            return proceed(undefined, alertGroup);
          });
        });

      }).exec(function(err, alertGroup) {
        // Any errors will cause the transaction to roll back.
        if (err) { return exits.error(err); }

        // Return through the `success` exit.
        return exits.success({
          meta: {},
          response: {
            id: alertGroup.id,
            alertType: inputs.alertType,
            threshold: inputs.threshold,
            delay: inputs.delay,
            deviceCount: inputs.devices.length,
            users: results.checkUsers
          }
        });
      });

    });

  }

};
