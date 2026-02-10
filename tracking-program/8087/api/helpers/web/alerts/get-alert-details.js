module.exports = {


  friendlyName: 'Get alert details',


  description: 'Get the details of a single alert group.',


  inputs: {

    deviceType: {
      description: 'The type of device the group represents',
      example: 'meter',
      required: true
    },

    id: {
      description: 'The ID of the alert group to get details for.',
      example: 123,
      required: true
    },

    user: {
      description: 'The current logged-in user.',
      example: '===',
      required: true
    }

  },


  exits: {
    success: {
      outputExample: {
        meta: {},
        response: {
          alertType: 1,
          threshold: 255,
          delay: 10,
          devices: [{
            id: 123,
            name: 'Meter #1'
          }],
          users: [{
            id: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acmeinc.com'
          }]
        }
      }
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
    var Device;

    if (!_.contains(['meter', 'repeater', 'switch'], inputs.deviceType)) {
      return exits.error(new Error('The given device type was not valid.'));
    }

    switch (inputs.deviceType) {

      case 'meter':
        AlertGroup = MeterAlertGroup;
        Device = Meter;
        break;

      case 'repeater':
        AlertGroup = RepeaterAlertGroup;
        Device = Repeater;
        break;


      case 'switch':
        AlertGroup = SwitchAlertGroup;
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

        // Make sure that the logged-in user has access to this meter alert group (via its project).
        if ( !_.find(inputs.user.projects, {id: alertGroup.project} )) {
          return exits.unauthorized();
        }

        // Fetch all of the devices attached to the alerts in this group.
        Device.find({id: _.pluck(alertGroup.alerts, inputs.deviceType)}).exec(function(err, devices) {
          if (err) { return exits.error(err); }

          // Index the fetched devices by ID.
          devices = _.indexBy(devices, 'id');

          // Add a "devices" array to the data to return.
          var data = {
            alertType: alertGroup.alertType,
            threshold: alertGroup.threshold,
            delay: alertGroup.delay,
            devices: _.map(alertGroup.alerts, function(alert) {
              return devices[alert[inputs.deviceType]];
            }),
            users: alertGroup.users
          };

          return exits.success({meta: {}, response: data});

        });


      });

  }


};
