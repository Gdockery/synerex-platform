module.exports = {


  friendlyName: 'Get alert details',


  description: 'Get the details of a single meter alert group.',


  inputs: {

    id: {
      description: 'The ID of the meter alert group to get details for.',
      example: 123,
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
      statusCode: 404
    },
    notFound: {
      statusCode: 404
    }
  },


  fn: function (inputs, exits) {
    var req = this.req;

    sails.helpers.web.alerts.getAlertDetails(_.extend({ deviceType: 'meter', user: req.user }, inputs)).exec(exits);

  }


};
