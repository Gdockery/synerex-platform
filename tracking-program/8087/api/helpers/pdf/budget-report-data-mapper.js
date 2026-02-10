module.exports = {

  friendlyName: 'Get budget report',

  description: 'Get budget ',

  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },
  },


  exits: {
    success: {
      outputExample: '===',
    }

  },


  fn: function (inputs, exits) {

    // Get the project record.
    Project.findOne({ id: inputs.project }).exec(function(err, project) {
      if (err) { return exits.error(err); }
      
      let data = project.lastBudget;

      //let stream = sails.services.pdfservice.generateBudgetReport(data);
      //stream.end();
      return exits.success(data);
    });                    
  }
};
