module.exports = {


  friendlyName: 'Get new token',


  description: 'Generate a probabilistically-unique string for use as an invite or reset password token.',


  moreInfoUrl: 'https://github.com/substack/node-password-reset/blob/master/index.js',


  sync: true,


  inputs: {

  },


  exits: {

    success: {
      outputFriendlyName: 'New token',
      outputExample: 'vt8qeSpSG9+HVXyhoRlecw=='
    }

  },


  fn: function (inputs, exits) {

    // Get new token.
    var newToken;
    var buf = new Buffer(16);
    for(var i = 0; i < buf.length; i++) {
      buf[i] = Math.floor(Math.random() * 256);
    }
    newToken = buf.toString('base64');

    return exits.success(newToken);

  }


};
