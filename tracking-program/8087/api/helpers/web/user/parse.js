module.exports = {


  friendlyName: 'Parse (user)',


  description: 'Parse & pre-process values to set for a user on a create or an update.',


  inputs: {

    data: {
      description: 'A dictionary of values to set -- some of which correspond with model attributes and some of which don\'t.',
      extendedDescription: 'WARNING: For efficiency, this helper mutates `data` in-place!',
      type: 'ref',
      required: true
    }

  },


  exits: {

    success: {
      outputDescription: 'The pre-processed dictionary of values to create or update.'
    },

    badRequest: {
      description: 'One or more of the provided values were not valid.'
    }

  },


  fn: function (inputs, exits) {

    var stdlib = require('sails-stdlib');

    // > Note that unrecognized fields such as `password` and `fullName`
    // > will simply be thrown out when writing to the database using Waterline.
    // > (So it doesn't hurt to leave them in even after attaching `hashedPassword`, etc.)
    var valuesToSet = inputs.data;


    // Process "fullName"
    if (!_.isUndefined(valuesToSet.fullName)) {
      // This isn't a perfect name split (consider `van der Henst` and `de Silva`, for example)
      // However, it's good enough for our purposes, because it's consistent across the app.
      // > https://tex.stackexchange.com/questions/204697/how-to-correctly-typeset-an-authors-two-word-last-name-in-bibtex
      var namePieces = _.trim(valuesToSet.fullName).split(/\s+/);
      if (namePieces.length < 2) {
        return exits.badRequest('Please provide this user\'s first name and last name, separated by a space.  (Sorry Prince/Cher -- consider using a pseudonym as your surname?)');
      }

      valuesToSet.firstName = namePieces.slice(0,namePieces.length-1).join(' ');
      valuesToSet.lastName = _.last(namePieces);
    }//>-


    // Process "password"
    (function (proceed){

      if (_.isUndefined(valuesToSet.password)) {
        return proceed(undefined, valuesToSet);
      }

      // If empty string was specified for the password, then instead of hashing the password,
      // generate a reset password token that will let this user choose her own password.
      // > e.g. "vt8qeSpSG9+HVXyhoRlecw=="
      // > https://github.com/substack/node-password-reset/blob/master/index.js
      if (!valuesToSet.password) {
        valuesToSet.resetPasswordToken = sails.helpers.web.user.getNewToken().execSync();
        return proceed(undefined, valuesToSet);
      }//-•

      // Otherwise, hash the provided password:
      var bcrypt = require('bcryptjs');
      bcrypt.hash(valuesToSet.password, 8, function(err, hashedPassword) {
        if(err) { return proceed(err); }

        valuesToSet.hashedPassword = hashedPassword;
        return proceed(undefined, valuesToSet);
      });

    })(function(err, valuesToSet){
      if (err) { return exits.error(err); }
      return exits.success(valuesToSet);
    });

  }


};
