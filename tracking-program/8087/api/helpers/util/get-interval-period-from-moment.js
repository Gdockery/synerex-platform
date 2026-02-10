module.exports = {


  friendlyName: 'Get interval period from moment',


  description: 'Given a moment object, an interval number and interval duration, get the start and end time for the interval.',


  extendedDescription: 'The moment object will be used to determine the day to retrieve the interval for.',


  sync: true,


  inputs: {

    moment: {
      example: '===',
      required: true
    },

    intervalId: {
      example: '5/-5:00',
      required: true
    }, 

    intervalDuration: {
      example: 1,
      defaultsTo: 15
    }

  },


  exits: {

    success: {
      outputExample: {
        startTime: 12345,
        endTime: 12345
      },
      outputFriendlyName: 'Interval period',
      outputDescription: 'The start and end time of the given interval, as JS timestamps.'
    }

  },


  fn: function(inputs, exits) {

    // Get the interval number and time zone offset.
    var intervalNum;
    var tzOffset;
    [intervalNum, tzOffset] = inputs.intervalId.split('/');

    // Set the moment to the start of the day.
    var m = inputs.moment.startOf('day');

    // Set the hours and minutes according to the interval number and duration.
    // For example, interval 5 (with 15 minute intervals) represents 1:15:00 - 1:29:59 am.
    m = m.hours(Math.floor(intervalNum / 4));
    m = m.minutes((intervalNum % (60 / inputs.intervalDuration)) * inputs.intervalDuration);

    // Set the time zone offset.
    m = m.utcOffset(tzOffset);

    // Get a JS timestamp for the start of the interval.
    var startOfInterval = m.valueOf();

    // Calculate the end of the interval by adding one interval duration and subtracting on millisecond.
    var endOfInterval = startOfInterval + (60 * 1000 * inputs.intervalDuration) - 1;

    // Return the period info through the success exit.
    return exits.success({
      startTime: startOfInterval,
      endTime: endOfInterval
    });

  }


};
