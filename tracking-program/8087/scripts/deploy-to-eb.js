/**
 * Module dependencies.
 */
var fs = require('fs');
var path = require('path');

var AWS = require('aws-sdk');
var _ = require('@sailshq/lodash');

// If no environment was specified, bail.
if (_.isUndefined(process.env.sails_environment)) {
  console.error('No environent set -- please use deploy-prod or deploy-staging.');
  process.exit(1);
}

// Get the app's version.
var version = require('../package.json').version;

// Get the Sails environment (e.g. web-staging) config.
var envConfig = require('../config/env/' + process.env.sails_environment);

// Pull the AWS config out, with some defaults.
var awsConfig = _.defaults(envConfig.aws, require('../config/aws').aws);

// Configure the AWS SDK.
AWS.config = new AWS.Config(awsConfig.credentials);

// Create a new S3 API service object.
var s3 = new AWS.S3(awsConfig.s3);

// Create a new Elastic Beanstalk API service object.
var elasticbeanstalk = new AWS.ElasticBeanstalk(awsConfig.elasticbeanstalk);

// Upload the zipped-up app source to S3.
s3.upload({
  Key: 'deployments/' + version + '.zip',
  Body: fs.createReadStream(path.resolve(__dirname, '..', '.tmp', 'deploy.zip')),
  ACL: 'public-read'
}, function(err) {
  if (err) {
    console.error('S3 error', err);
    process.exit(1);
  }
  var params = {
    ApplicationName: 'Synerex',
    AutoCreateApplication: false,
    Description: version + ' (' + process.env.sails_environment + ')',
    Process: false,
    SourceBundle: {
      S3Bucket: awsConfig.s3.params.Bucket,
      S3Key: 'deployments/' + version + '.zip'
    },
    VersionLabel: 'v' + version
  };

  // Create a new version of the Elastic Beanstalk app.
  elasticbeanstalk.createApplicationVersion(params, function(err, data) {
    if (err) {
      console.error('EB createApplicationVersion err:', err);
      process.exit(1);
    }
    console.log('Created version:', data);
    console.log('---');
    var params = {
      ApplicationName: 'Synerex',
      EnvironmentName: process.env.EB_ENV || awsConfig.elasticbeanstalk.params.environmentName,
      VersionLabel: 'v' + version,
      OptionSettings: (awsConfig.elasticbeanstalk._envOptions || []).concat([
        // Set the Sails app environment to use.
        {
          Namespace: 'aws:elasticbeanstalk:application:environment',
          OptionName: 'sails_environment',
          Value: process.env.sails_environment
        },
        // Start the Sails app in production mode.
        {
          Namespace: 'aws:elasticbeanstalk:application:environment',
          OptionName: 'NODE_ENV',
          Value: 'production'
        }
      ])
    };

    // Update the Elastic Beanstalk environment.  Most of the time the configuration
    // won't change from one version of the app to the next, except for the version
    // label, which is what triggers the new app version to be used.
    elasticbeanstalk.updateEnvironment(params, function(err, data) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log('Updated app:', data);
      if (process.env.VERBOSE) { console.log('with params:', params); }
    });
  });
});

