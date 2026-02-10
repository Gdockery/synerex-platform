module.exports = {


  friendlyName: 'Remove alert',


  description: 'Remove an alert group and its related alerts and alert events.',


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
      description: 'The ID of the alert group to remove.',
      example: 123
    }
  },


  exits: {
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

    if (!_.contains(['meter', 'repeater', 'switch'], inputs.deviceType)) {
      return exits.error(new Error('The given device type was not valid.'));
    }

    switch (inputs.deviceType) {

      case 'meter':
        AlertGroup = MeterAlertGroup;
        AlertEvent = MeterAlertEvent;
        Alert = MeterAlert;
        break;

      case 'repeater':
        AlertGroup = RepeaterAlertGroup;
        AlertEvent = RepeaterAlertEvent;
        Alert = RepeaterAlert;
        break;


      case 'switch':
        AlertGroup = SwitchAlertGroup;
        AlertEvent = SwitchAlertEvent;
        Alert = SwitchAlert;
        break;

    }

    // Fetch the alert group in question.
    AlertGroup.findOne({id: inputs.id})
      .populate('alerts')
      .populate('users')
      .exec(function(err, alertGroup) {
        if (err) { return exits.error(err); }
        if (!alertGroup) { return exits.notFound(); }

        // Make sure that the logged-in user has access to this alert group (via its project).
        if ( !_.find(inputs.user.projects, {id: alertGroup.project} )) {
          return exits.unauthorized();
        }

        // Get a reference to the datastore.
        var datastore = sails.getDatastore('default');

        // Begin a transaction.
        datastore.transaction(function(db, proceed) {

          // Delete all alert events for this group.
          AlertEvent.destroy({ alertGroup: inputs.id }).usingConnection(db).exec(function(err) {
            if (err) { return proceed(err); }

            // Delete all alerts for this group.
            Alert.destroy({ group: inputs.id }).usingConnection(db).exec(function(err) {
              if (err) { return proceed(err); }

              // Delete the alert group.
              AlertGroup.destroy({ id: inputs.id }).usingConnection(db).exec(proceed);

            });

          });

        }).exec(function(err) {

          if (err) { return exits.error(err); }
          return exits.success();

        });


      });

  }

};
