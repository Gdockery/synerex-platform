module.exports = function(req, res) {
  var sails = req._sails;
  var moment = require('moment-timezone');
  sails.log.error('[' + moment().format() + '] Schedule-tasks start');

  var async = require('async');

  var AWS = require('aws-sdk');

  // Get the Sails environment (e.g. web-staging) config.
  var envConfig = require('../../../config/env/' + process.env.sails_environment);

  // Pull the AWS config out, with some defaults.
  var awsConfig = _.defaults(envConfig.aws, require('../../../config/aws').aws);

  // Configure the AWS SDK.
  AWS.config = new AWS.Config(awsConfig.credentials);

  // Create a new SQS API service object.
  var sqs = new AWS.SQS(awsConfig.sqs);

  Project.find({ isDeleted: false }).exec(function(err, projects) {
    async.each(projects, function(project, nextProject) {
      sails.log.error('[' + moment().format() + '] Scheduling project ' + project.id);
      sqs.sendMessage({
        MessageBody: '{"project":' + project.id + '}'
      }, function(err, response) {
        return nextProject();
      });
    }, function(err) {
      if (err) {
        console.log(err);
        // TODO -- report when SQS message sending fails.
      }
      return res.ok();
    });

  });

  sails.log.error('[' + moment().format() + '] Schedule-tasks end');
};
