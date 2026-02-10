module.exports = {


  friendlyName: 'Get interval from moment',


  description: 'Given a moment object, get the 15 minute interval (0-95) it represents.',


  sync: true,


  inputs: {

    moment: {
      example: '===',
      required: true
    },

    intervalDuration: {
      example: 1,
      defaultsTo: 15
    }

  },


  exits: {

    success: {
      outputExample: '5-6:00',
      outputFriendlyName: 'Interval',
      outputDescription: 'The interval that the moment represents, including time zone offset.'
    }

  },


  fn: function(inputs, exits) { 

    var hours = inputs.moment.hours();
    var minutes = inputs.moment.minutes();
    var intervalsInHour = 60 / inputs.intervalDuration;

    var interval = (hours * intervalsInHour) + Math.floor(minutes / inputs.intervalDuration);
    if (interval < 10) { interval = '0' + interval; }

    return exits.success(interval + '/' + inputs.moment.format('Z'));

  }


};
