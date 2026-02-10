module.exports = sails.config.constants.buildUpdateAction('meter', {

  before: function(inputs, proceed) {
    if (inputs.valuesToSet.name){
      Meter.find({name: inputs.valuesToSet.name.trim(), isDeleted: false, id: {'!=': inputs.id}}).exec(function(err, meters) {
        if (err) { return proceed(err); }
        if (meters.length) {
          var conflictErr = new Error('A meter already exists with this name');
          conflictErr.exit='conflict';
          return proceed(conflictErr);
        }
        return proceed();
      });
    } else if (inputs.valuesToSet.deviceId) {
      Meter.find({deviceId: inputs.valuesToSet.deviceId.trim(), isDeleted: false, id: {'!=': inputs.id}}).exec(function(err, meters) {
        if (err) { return proceed(err); }
        if (meters.length) {
          var conflictErr = new Error('A meter already exists with this device ID');
          conflictErr.exit='conflict';
          return proceed(conflictErr);
        }
        return proceed();
      });
    }

  },

  after: function(updatedMeter, exits) {

    sails.helpers.web.meter.processNewDeviceId({
      theMeter: updatedMeter
    }).exec(exits);

  }


});
