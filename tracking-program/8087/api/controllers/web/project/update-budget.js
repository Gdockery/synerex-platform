module.exports = {

  friendlyName: 'Get current savings',

  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',

  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    budgetData: {
      description: 'Updated data for the lastBudgetInvoice',
      example: {},
      required: true
    },

    type: {
      description: 'invoice or report',
      example: 'invoice',
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
        meta: {},
        response: {
        }
      }
    },

    notFound: {
      statusCode: 404
    },

    badRequest: {
      statusCode: 400
    }

  },


  fn: function (inputs, exits) {

    // just making sure the lineItems property is there
    if (_.isUndefined(inputs.budgetData)) {
      return exits.badRequest('`data` must contain parameters');
    }
    var projectSet;
    console.log("input type", inputs.type);

    if (inputs.type == 'invoice'){
      projectSet = Project.update({id: inputs.project}).set({lastBudgetInvoice: inputs.budgetData}).meta({fetch: true});
    } else {
      projectSet = Project.update({id: inputs.project}).set({lastBudget: inputs.budgetData}).meta({fetch: true});
    }

    projectSet.exec(function (err, updatedRecords) {
      console.log("updated invoice", updatedRecords);
      if (err) {
        return exits.error(err);
      }

      if (updatedRecords.length === 0) {
        return exits.notFound();
      }
      return exits.success({
        meta: {},
        response: updatedRecords[0].lastBudgetInvoice,
      });
    });

      

  }


};
