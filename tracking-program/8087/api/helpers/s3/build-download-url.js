module.exports = {


  friendlyName: 'Build download url',


  description: 'Build a (potentially temporary) download URL pointed at a file hosted on S3.',


  extendedDescription: 'Note that this method does NOT check that the file actually exists!',


  sideEffects: 'cacheable',


  inputs: {

    key: {
      description: 'The S3 key of the file this download URL is for.',
      example: 'pdf/project-4-depositInvoice.pdf',
      required: true
    },

    ttl: {
      description: 'The # of milliseconds to keep this link active.  If this is set > 0, link will be temporary.',
      example: 1000,
      defaultsTo: 0
    }

  },


  exits: {

    success: {
      outputFriendlyName: 'S3 URL',
      outputExample: 'https://aws.whatever.com/asdg8a382',
    }

  },


  fn: function (inputs, exits) {

    var AWS = require('aws-sdk');

    // Set global AWS credentials, in case they haven't been set already.
    AWS.config = new AWS.Config(sails.config.aws.credentials);

    // Get S3 accessor.
    var s3 = new AWS.S3(sails.config.aws.s3);

    if (inputs.ttl < 1000) {
      return exits.error(new Error('Currently, only temporary S3 URLs are supported -- i.e. `ttl` is required and must be > 1000 (1 second)'));
    }

    // Get temporary URL:
    s3.getSignedUrl('getObject', {
      Key: inputs.key,
      Expires: Math.floor(inputs.ttl / 1000)
    }, function(err, s3Url) {
      if (err) { return exits.error(err); }

      return exits.success(s3Url);

    });//</ s3.getSignedUrl() >

  }


};
