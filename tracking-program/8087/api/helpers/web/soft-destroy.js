module.exports = {


  friendlyName: 'Soft destroy',


  description: '"Soft-destroy" the specified record (i.e. flag it as `isDeleted: true`).',


  inputs: {

    model: {
      description: 'The containing Sails/Waterline model.',
      type: 'ref',
      required: true,
    },

    id: {
      description: 'The ID of the record.',
      example: 123,
      required: true
    },

  },


  exits: {

    success: {
      description: 'Record was soft-deleted successfully.'
    },

    notFound: {
      description: 'Could not find a record with that id.'
    }

  },


  fn: function (inputs, exits) {

    // Check model for compatibility
    var badModelReason;
    if (!inputs.model.attributes.isDeleted) {
      badModelReason = 'it does not have an `isDeleted` attribute.';
    }
    if (inputs.model.attributes.isDeleted.type !== 'boolean') {
      badModelReason = 'its `isDeleted` attribute is not compatible (must be `type: \'boolean\')';
    }
    if (badModelReason) {
      return exits.error('Cannot use the `softDestroy()` helper with this model because '+reason);
    }


    inputs.model.update({
      id: inputs.id,
      isDeleted: { '!=': true }
    })
    .set({ isDeleted: true })
    .meta({ fetch: true })
    .exec(function(err, updatedRecords) {
      if (err) { return exits.error(err); }
      if (updatedRecords.length === 0) { return exits.notFound(); }
      if (updatedRecords.length > 1) {
        return exits.error(new Error(
          'Consistency violation: Only one record should have been updated.  '+
          '(But actually, it appears that '+updatedRecords.length+' records were updated!)'
        ));
      }
      return exits.success();
    });

  }


};
