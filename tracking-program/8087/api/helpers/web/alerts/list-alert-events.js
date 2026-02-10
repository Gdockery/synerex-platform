module.exports = {


  friendlyName: 'List project alert events',


  description: 'List the recent alert events for a project.',


  inputs: {

    deviceType: {
      description: 'The type of device the group represents',
      example: 'meter',
      required: true
    },

    project: {
      description: 'The ID of the project to pull recent alert event data for.',
      example: 123,
      required: true
    },

    page: {
      description: 'Page number to retrieve.',
      example: 1,
      defaultsTo: 1
    },

  },


  exits: {
    success: {
      outputExample: {
        meta: {
          page: 1,
          total: 55
        },
        response: [{
          id: 123,
          createdAt: 12345,
          alert: {
            id: 123,
            alertType: 1,
            threshold: 123,
            delay: 123
          },
          device: {
            id: 123,
            name: 'Some meter'
          }
        }]
      }
    },
    unauthorized: {
      statusCode: 404,
      outputExample: ''
    }
  },

  fn: function (inputs, exits) {

    var AlertEvent;

    if (!_.contains(['meter', 'repeater', 'switch'], inputs.deviceType)) {
      return exits.error(new Error('The given device type was not valid.'));
    }

    switch (inputs.deviceType) {

      case 'meter':
        AlertEvent = MeterAlertEvent;
        break;

      case 'repeater':
        AlertEvent = RepeaterAlertEvent;
        break;


      case 'switch':
        AlertEvent = SwitchAlertEvent;
        break;

    }

    // Find all the alert events for this project
    AlertEvent.count({project: inputs.project}).exec(function(err, count) {
      if (err) { return exits.error(err); }

      // Find alert groups for this project.
      AlertEvent.find({project: inputs.project})
      .sort([{createdAt: 'ASC'}])
      .limit(10)
      .skip(10 * (inputs.page - 1))
      .populate('alertGroup')
      .populate(inputs.deviceType)
      .exec(function(err, alertEvents) {

        if (err) { return exits.error(err); }

        // Marshal the data appropriately
        var output = {

          meta: {
            page: inputs.page,
            total: count
          },

          response: _.map(alertEvents, function(alertEvent) {
            return {
              id: alertEvent.id,
              createdAt: alertEvent.createdAt,
              alert: alertEvent.alertGroup,
              device: alertEvent[inputs.deviceType]
            };
          })

        };

        return exits.success(output);

      });

    });

  }


};
