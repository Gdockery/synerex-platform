module.exports = {


  friendlyName: 'Get savings report details',


  description: 'Get detailed information about a particular savings report.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    month: {
      description: 'The month (YYYY-MM) that this report represents.',
      example: '2017-05',
      required: true
    },

  },


  exits: {

    success: {
      outputExample: {
        meta: {},
        response: {
          createdAt: 1495667305103,
          reportData: { /* savings report data */ }
        }
      }
    },

    notFound: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    SavingsReport.findOne({ project: inputs.project, month: inputs.month })
    .select(['month', 'createdAt', 'reportData'])
    .exec(function (err, savingsReport){
      if (err) { return exits.error(err); }
      if (!savingsReport) { return exits.notFound(); }

      return exits.success({
        meta: {},
        response: savingsReport
      });
    });

  }


};
