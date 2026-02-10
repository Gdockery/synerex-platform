module.exports = {


  friendlyName: 'Validate email address',


  description: 'Validate (and potentially coerce) a string as a potential email address.',


  cacheable: true,


  sync: true,


  inputs: {

    string: {
      description: 'The string to validate as an email address.',
      required: true,
      example: 'john.doe@acmeinc.com',
    },

    strict: {
      description: 'If set, instead of coercing, the validation will fail as "not strictly valid".',
      example: false,
      defaultsTo: false
    }

  },


  exits: {

    success: {
      variableName: 'emailAddress',
      outputDescription: 'The validated email address (which might also have been coerced a bit).',
      example: 'john.doe@acmeinc.com'
    },

    notValid: {
      description: 'The specified string is not a valid email address.'
    },

    notStrictlyValid: {
      description: 'The specified string is close, but not strictly valid (only relevant if `strict` is enabled).'
    }

  },


  fn: function (inputs, exits) {

    var _ = require('lodash');



    // Coerce
    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    // • No trailing or leading whitespace (trim in non-strict mode)
    if (inputs.strict) {
      if (inputs.string.match(/^\s+/) || inputs.string.match(/\s+$/)) {
        return exits.notStrictlyValid(new Error('Must not contain trailing or leading whitespace.'));
      }
    }
    else {
      inputs.string = inputs.string.replace(/^\s+/, '');
      inputs.string = inputs.string.replace(/\s+$/, '');
    }

    // • Ensure any letters (w/ or w/o diacritical marks) are lowercase  (auto-lowercase them in non-strict mode)
    if (inputs.strict) {
      if (_.deburr(inputs.string).match(/[A-Z]/)) {
        // "ü"" is fine, as long as it's lower-case (but Ü is not fine-- hence the deburr)
        return exits.notStrictlyValid(new Error('Must not contain upper-case letters.'));
      }
    }
    else {
      inputs.string = inputs.string.toLowerCase();
    }



    // Validate
    //////////////////////////////////////////////////////////////////////////////////////////////////////////

    // • Must not be empty
    if (inputs.string.length < 1) {
      return exits.notValid(new Error('Email address must not be blank.'));
    }

    // • Must not be too long.
    if (inputs.string.length > 140) {
      return exits.notValid(new Error('Email address must not be longer than 140 characters.'));
    }

    // • Must match email regexp.
    var REGEX = /^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
    var matches = inputs.string.match(REGEX);
    if(!matches || matches.length === 0) {
      return exits.notValid(new Error('Does not match our email regexp at all.'));
    }
    else if (matches.length >= 2) {
      return exits.notValid(new Error('Matches our email regexp, but also contains extra garbage that makes it seem fishy.'));
    }


    // ...etc
    // TODO
    // (see https://github.com/treelinehq/machinepack-machines/blob/master/machines/validate-input-code-name.js#L82
    //  for an example.  I think it's prbly ok for us to dump everyting into "notValid" for us here, though. --
    //  but if we're vague, we just have to always remember to new up Error instances and pass them through)


    return exits.success(inputs.string);

  }


};
