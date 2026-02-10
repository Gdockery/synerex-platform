/**
 * SwitchCommand.js
 *
 * @description :: A scheduled switch command.
 */

module.exports = {

  attributes: {

    // The project that this switch command belongs to.
    project: {
      model: 'Project',
      required: true
    },

    startDate: {
      type: 'string',
      required: true
    },

    endDate: {
      type: 'string',
      required: true
    },

    // IDs of the switches that have accepted the command.
    switches: {
      type: 'json',
      defaultsTo: []
    },

    // Whether the command was cancelled before being executed.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    // Whether the command was completed
    isCompleted: {
      type: 'boolean',
      defaultsTo: false 
    },

    // IDs of the switches that have cancelled the command.
    scheduleDetail: {
      type: 'json',
      defaultsTo: []
    },

    deviceType: {
      type: 'number',
    },

    daysOfWeek: {
      type: 'json',
      defaultsTo: []
    },

    totalHoursOff: {
      type: 'number',
      allowNull: true,
    },


  },

};

