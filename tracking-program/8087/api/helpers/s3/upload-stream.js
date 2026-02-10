module.exports = {


  friendlyName: 'Upload stream',


  description: 'Upload an incoming readable stream of data to a suitabe key on Amazon S3.',


  inputs: {

    stream: {
      description: 'The Readable stream to upload.',
      type: 'ref',
      required: true
    },

    attachmentFilename: {
      description: 'The "attachment" filename to use in the content-disposition header.',
      example: 'project-4-proposal.pdf',
      required: true
    },

    keyPrefix: {
      description: 'A prefix for the S3 key under which this file will be uploaded.',
      example: 'pdf/',
      defaultsTo: ''
    },

  },


  exits: {

    success: {
      outputFriendlyName: 'S3 Info',
      outputExample: {
        key: 'pdf/ab309-13813b-10338a-afe831c'
      }
    }

  },


  fn: function (inputs, exits) {

    // Imports
    var AWS = require('aws-sdk');
    var uuidV4 = require('uuid/v4');

    // Set global AWS credentials, in case they haven't been set already.
    AWS.config = new AWS.Config(sails.config.aws.credentials);

    // Get S3 accessor.
    var s3 = new AWS.S3(sails.config.aws.s3);

    // Determine a solid S3 key for this file.
    var MAX_ATTEMPTS = 5;

    var conflictingKeyAlreadyExists = false;
    var uuid;
    var mostRecentErr;
    var numAttempts = 0;
    async.doUntil(

      function $tryNewUUID (proceed) {
        if (numAttempts > MAX_ATTEMPTS) {
          return proceed(new Error(
            'Could not upload file to S3.  Tried '+MAX_ATTEMPTS+' time(s) to come up with a suitable key, '+
            'but kept getting errors.  Most recently, got:'+mostRecentErr.stack
          ));
        }//-•
        numAttempts++;

        uuid = uuidV4();
        s3.headObject({
          Key: inputs.keyPrefix + uuid
        }, function(err) {
          if (err) {
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            // FUTURE: instead of using `true` below, actually negotiate this error to
            // rule out unrelated problems like AWS authentication.
            // (short-term, we use `mostRecentErr` to help serve as a catch-all--see above)
            // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
            if (err.statusCode == 404) {
              conflictingKeyAlreadyExists = false;
              return proceed();
            }
            else {
              conflictingKeyAlreadyExists = true;
              return proceed(err);
            }
          }//-•

          conflictingKeyAlreadyExists = false;
          return proceed();
        });
      },

      function $until() { return !conflictingKeyAlreadyExists; },

      function $afterwards(err) {
        if (err) { return exits.error(err); }

        s3.upload({
          Key: inputs.keyPrefix + uuid,
          Body: inputs.stream,// TODO: use stream instead
          ContentDisposition: 'attachment; filename=' + inputs.attachmentFilename,
          ACL: 'public-read'// FUTURE: potentially make this non-public (and update places that fetch this to use credentials)
        }, function(err) {
          if (err) { return exits.error(err); }

          return exits.success({
            key: inputs.keyPrefix + uuid,
          });

        });//</ s3.upload() >
      }

    );//</ async.doUntil() >

  }


};
