module.exports = {


  friendlyName: 'Set electric bill analysis',


  description: 'Set (create or update) the initial electric bill analysis for this project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    electricBillAnalysis: {
      description: 'The new electric bill analysis.',
      extendedDescription: 'Note that this will **COMPLETELY REPLACE** any previous bill analysis.  (This is not a patch!)',
      example: {},
      required: true
    }

  },


  exits: {
     success: {},

  },


  fn: function (inputs, exits) {
    Project.findOne({id: inputs.project}).exec(function(err, project) {
      if (err) { return exits.error(err); }
         

        Project.update({ id: inputs.project })
        .set({
          electricBillAnalysis: inputs.electricBillAnalysis,
          electricBillAnalysisUpdatedAt: Date.now(),
          
        })
        .exec(function(err) {
          if (err) { return exits.error(err); }
          return exits.success(inputs.electricBillAnalysis);
        });
     
    });
  }
};
