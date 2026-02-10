module.exports = {


  friendlyName: 'Update',


  description: 'Update advanced options for this install of the XECO Web Portal.',


  inputs: {

    valuesToSet: {
      description: 'A dictionary of new values for one or more advanced options.',
      example: {},
      required: true
    }

  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    var reservedKeys = _.intersection(_.keys(inputs.valuesToSet), ['id','createdAt','updatedAt']);
    if (reservedKeys.length > 0) {
      return exits.badRequest(new Error('Cannot explicitly set reserved keys: '+reservedKeys));
    }

    var unrecognizedKeys = _.difference(_.keys(inputs.valuesToSet), _.keys(Xeco.attributes));
    if (unrecognizedKeys.length > 0){
      return exits.badRequest(new Error('One or more unrecognized properties detected: '+unrecognizedKeys));
    }

    Xeco.update({})
    .set(inputs.valuesToSet)
    .exec(function(err) {
      if (err) { return exits.error(err); }
      return exits.success();
    });

  }


};
