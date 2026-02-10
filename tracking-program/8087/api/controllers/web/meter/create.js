var Moment = require('moment-timezone');

module.exports = sails.config.constants.buildCreateAction('meter', {

  before: function(inputs, proceed) {
    Meter.find({deviceId: inputs.valuesToSet.deviceId.trim(), isDeleted: false}).exec(function(err, meters) {
      if (err) { return proceed(err); }
      if (meters.length) {
        var conflictErr = new Error('A meter already exists with this device ID');
        conflictErr.exit='conflict';
        return proceed(conflictErr);
      }
      return proceed();
    });

  },

  after: function(newMeter, exits) {

    sails.helpers.web.meter.processNewDeviceId({
      theMeter: newMeter
    }).exec({
      error: exits.error,
      success: function() {
        console.log(newMeter);
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'week', valueType: 'kwh', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'today', valueType: 'kwh', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
           
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'month', valueType: 'avgKva', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
           
          });

          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'month', valueType: 'kwh', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
           
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'month', valueType: 'peak', value: 0, description: ''}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
           
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastMonth', valueType: 'kwh', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
           
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastMonth', valueType: 'peak', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
           
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastMonth', valueType: 'totalCost',value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastMonth', valueType: 'totalSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'year', valueType: 'totalSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastYear', valueType: 'totalSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastYear', valueType: 'totalSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'allTime', valueType: 'totalSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'today', valueType: 'I2RLossSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'week', valueType: 'I2RLossSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'month', valueType: 'I2RLossSavings', description: '', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastMonth', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'year', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'lastYear', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          ReportData.create({type: 'meter', typeId: newMeter.id, project: newMeter.project, period: 'allTime', valueType: 'I2RLossSavings', value: 0}).meta({fetch: true}).exec(function(err, updatedMeter){
            if (err) {
              console.log('[' + Moment().format() + '] upload savings detail for meter error ' + newMeter.id);
            }
          });
          console.log("updated ReportData")
        return exits.success({
          response: {
            id: newMeter.id
          }
        });
      }
    });

  }

});
