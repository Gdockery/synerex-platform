module.exports = {

  friendlyName: 'Find one switch event',
  description: 'Get details about the specified record.',
  inputs: {
    id: { description: 'The ID of the record to look up.', example: 123, required: true }
  },
  exits: {
    success: { outputExample: { meta: {}, response: {} } },
    notFound: { statusCode: 404 },
    badRequest: { statusCode: 400 },
  },
  fn: function(inputs, exits) {
    SwitchCommand.findOne({ id: inputs.id })
    .populate('switches')
    .exec(function(err, record){
      if (err) { return exits.error(err); }
      if (!record) { return exits.notFound(); }

      record.switches = _.map(record.switches, function(switchDevice) {
        if (_.contains(record.cancelledBySwitchIds, switchDevice.id)) {
          switchDevice.status = 'canceled';
        }
        else if (_.contains(record.executedBySwitchIds, switchDevice.id)) {
          switchDevice.status = 'executed';
        }
        else if (_.contains(record.acceptedBySwitchIds, switchDevice.id)) {
          switchDevice.status = 'accepted';
        }
        else {
          switchDevice.status = 'pending';
        }
        return switchDevice;
      });
      return exits.success({
        response: record
      });
    });
  }

};
