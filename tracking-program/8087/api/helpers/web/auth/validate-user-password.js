module.exports = {


  friendlyName: 'Validate user password (strict)',


  description: 'Strictly validate a string as the potential "password" for a user.',


  cacheable: true,


  sync: true,


  inputs: {

    string: {
      description: 'The string to validate as a password.',
      required: true,
      example: 'abcd1234',
    }

  },


  exits: {

    success: {
      description: 'The specified string is 100% valid.'
    },

    notValid: {
      description: 'The specified string is not a valid password.'
    },

  },


  fn: function (inputs,exits) {


    // Coerce
    //////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Since we don't need to support `strict: false` for this validator (it is ALWAYS strict), then we can
    // just skip this part.  (Also no need for the "notStrictlyValid" exit, output from the success exit,
    // or the `strict` input)
    //
    // n/a




    // Validate
    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    // • Must be long enough.
    if (inputs.string.length < 7) {
      return exits.notValid(new Error('Password must consist of at least 7 characters.'));
    }

    // • Must not be too long.
    if (inputs.string.length > 72) {
      return exits.notValid(new Error('Password must not contain more than 72 characters.'));
    }


    return exits.success();
  }

};
