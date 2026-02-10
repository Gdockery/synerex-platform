module.exports = {


  friendlyName: 'Destroy savings report',


  description: 'Destroy one of the cost savings reports associated with a project.',


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

  },


  fn: function (inputs, exits) {
    var Moment = require('moment-timezone');
    Project.findOne({ id: inputs.project }).exec((err, project)=>{
      if (err) { return exits.error(err); }

      SavingsReport.destroy({
        month: inputs.month,
        project: inputs.project
      }).exec(function(err) {if (err) { return exits.error(err); } 
        console.log("bill deleted");
        return exits.success();

     });
    });
  }
};
