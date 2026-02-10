module.exports = {


  friendlyName: 'Remove alert',


  description: 'Remove an alert group and its related alerts and alert events.',


  inputs: {
    id: {
      description: 'The ID of the meter alert group to remove.',
      example: 123
    }
  },


  exits: {

    unauthorized: {
      statusCode: 404,
    },
    notFound: {
      statusCode: 404,
    }
  },


  fn: function (inputs, exits) {
    var req = this.req;

    sails.helpers.web.alerts.removeAlert(_.extend({ deviceType: 'meter', user: req.user }, inputs)).exec(exits);

  }

};
