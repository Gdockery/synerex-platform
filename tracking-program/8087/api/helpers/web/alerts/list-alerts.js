module.exports = {


  friendlyName: 'List project alerts',


  description: 'List all the alert groups for a project.',


  inputs: {

    deviceType: {
      description: 'The type of device the group represents',
      example: 'meter',
      required: true
    },

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

  },


  exits: {
    success: {
      outputExample: {
        meta: {},
        response: [{
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
        }]
      }
    },
    unauthorized: {
      statusCode: 404,
      outputExample: ''
    }
  },

  fn: function (inputs, exits) {

    var AlertGroup;
    var sort;

    if (!_.contains(['meter', 'repeater', 'switch'], inputs.deviceType)) {
      return exits.error(new Error('The given device type was not valid.'));
    }

    switch (inputs.deviceType) {

      case 'meter':
        AlertGroup = MeterAlertGroup;
        sort = [{threshold: 'ASC'},{delay: 'ASC'}];
        break;

      case 'repeater':
        AlertGroup = RepeaterAlertGroup;
        sort = [{threshold: 'ASC'}];
        break;


      case 'switch':
        AlertGroup = SwitchAlertGroup;
        sort = [{threshold: 'ASC'}];
        break;

    }

    // Find meter alert groups for this project.
    AlertGroup.find({project: inputs.project})
    .sort(sort)
    .populate('alerts')
    .populate('users')
    .exec(function(err, alertGroups) {

      if (err) { return exits.error(err); }

      // Roll the "alerts" array up into an alert count.
      var data = _.map(alertGroups, function(alertGroup) {
        alertGroup.deviceCount = alertGroup.alerts.length;
        delete alertGroup.alerts;
        return alertGroup;
      });

      return exits.success({meta: {}, response: data});

    });

  }


};
