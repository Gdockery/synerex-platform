/**
 * Module dependencies
 */

var stdlib = require('sails-stdlib');

module.exports = sails.config.constants.buildCreateAction('project', {

  before: function (inputs, proceed) {

    // Create a `documentShareToken`.
    inputs.valuesToSet.documentShareToken = stdlib('strings').random();
    console.log("*****in create project");

    // If no `salesTax` was explicitly set (empty string doesn't count), then default it
    // to the `salesTax` value in the corresponding Client record (if available).
    if (!inputs.valuesToSet.salesTax) { return proceed(); }
    if (!inputs.valuesToSet.client) { return proceed(new Error('Must set a `client`')); }
    sails.models.client.findOne({ id: inputs.valuesToSet.client })
    .exec((err, client)=>{
      if (err) { return proceed(err); }
      if (!client) { return proceed(new Error('Cannot create project under client `'+inputs.valuesToSet.client+'` because no such client exists')); }
      if (client.salesTax){
        inputs.valuesToSet.salesTax = client.salesTax;
      }
      return proceed(); 
    });

  },

  after: function(newProject, exits) {

      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'week', description: 'weeklykwh', valueType: 'kwh'}).exec(function(err, updatedMeter){
        if (err) {console.log('upload savings detail for project error ');}
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'today', description: 'today kwh', valueType: 'kwh'}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'month', description: '', valueType: 'avgKva', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'month', description: '', valueType: 'kwh', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'month', description: '', valueType: 'peak', value: 0, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'kwh', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'peak', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'peak', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'totalCost', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'totalSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'year', description: '', valueType: 'totalSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastYear', description: '', valueType: 'totalSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'totalSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('[upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'today', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log(' upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'week', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'month', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'year', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastYear', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'year', description: '', valueType: 'carbonSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'carbonSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'carbonSavingsAmount', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log(' upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'kwhSavingsAmount', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'peakSavingsAmount', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'peakSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log(' upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'kwhSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'I2RLossSavingsAmount', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log(' upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'month', description: '', valueType: 'pfc', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastMonth', description: '', valueType: 'pfc', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'year', description: '', valueType: 'pfc', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log('upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'lastYear', description: '', valueType: 'pfc', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log(' upload savings detail for project error ');
        }
      });
      ReportData.create({type: 'project', typeId: newProject.id, project: newProject.id, period: 'allTime', description: '', valueType: 'pfc', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
        if (err) {
          console.log(' upload savings detail for project error ');
        }
      });

      console.log("******finished creating project");
        
    return exits.success({
      response: {
        id: newProject.id
      }
    });
  }
});
