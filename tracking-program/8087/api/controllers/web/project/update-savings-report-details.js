module.exports = {


  friendlyName: 'Update savings report details',


  description: 'Update a particular savings report.',


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

    reportData: {
      description: 'Updated data for the savings report.',
      example: {},
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
        meta: {},
        response: {
          updatedAt: 1495667305103,
          reportData: { /* savings report data */ }
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
    if (_.isUndefined(inputs.reportData.lineItems)) {
      return exits.badRequest('`reportData` must contain `lineItems` parameter');
    }
    var Moment = require('moment-timezone');
    Project.findOne({ id: inputs.project }).exec(function(err, project) {

      SavingsReport.findOne({project: inputs.project, month: inputs.month}).exec(function (err, existingReport) {
        if (err) {return exits.notFound();}

        SavingsReport.update({id: existingReport.id}).set({reportData: inputs.reportData}).meta({fetch: true}).exec(function (err, updatedReports) {
          if (err) {return exits.error(err);}
          if (updatedReports.length === 0) {return exits.notFound();}
          let billingRate = 0, avgRate = 0, taxPercent = 0;
          if (inputs.reportData.lineItems) {
            inputs.reportData.lineItems.forEach(function(lineItem){
              if (lineItem.type == "kwh" && lineItem.tierHours != "0" && lineItem.tierHours != "null" && lineItem.tierHours != null){
                  avgRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
              }
              if (lineItem.type == "kw" && lineItem.tierHours != "0" && lineItem.tierHours != "null" && lineItem.tierHours != null){
                  billingRate +=  parseFloat(lineItem.tierHours) / 24 * parseFloat(lineItem.billingRate);
              }
              if (lineItem.type =="tax") {
                //value added tax percentage
                taxPercent += parseFloat(lineItem.cost) / parseFloat(inputs.reportData.totalBill);
              }
            });

            Project.update({ id: inputs.project }).set({kwRate: billingRate, 
              kwhRate: avgRate, 
              taxRate: taxPercent, 
              multiplier: inputs.reportData.kwhMultiplier * (project.peakMultiplier / existingReport.reportData.kwMultiplier), 
              peakMultiplier: inputs.reportData.kwMultiplier * (project.peakMultiplier / existingReport.reportData.kwMultiplier )}).exec(function(err) {
              if (err) { return exits.error(err); }
              
            });
          }
          return exits.success({
            meta: {},
            response: updatedReports[0]
          }); 
        });
      });
    });
  }
};
