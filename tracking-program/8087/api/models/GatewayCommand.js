/**
 * GatewayCommand.js
 *
 * @description :: A scheduled gateway command.
 */

module.exports = {

  attributes: {

    // The project that this switch command belongs to.
    project: {
      model: 'Project',
      required: true
    },

    // The type of command that has been scheduled.
    // Use a value from the `sails.config.constants.SWITCH_COMMAND_TYPES` set.
    commandType: {
      type: 'number',
      required: true
    },

    // For on/off commands, the time to run the command.
    // FUTURE: for recurring commands, the time to start the schedule.
    startAt: {
      type: 'number',
      required: true
    },

    // The collection of gateways to be controlled with this command.
//    gateways: {
//      collection: 'gateways'
//    },

    // Whether the command was cancelled before being executed.
    isCancelled: {
      type: 'boolean',
      defaultsTo: false
    },

    // Duration of the gateway test in hours
    duration: {
      type: 'number',
      required: false
    },

    // Test that this switch command is associated with, if any.
    test: {
      model: 'Test'
    }

  },

};

