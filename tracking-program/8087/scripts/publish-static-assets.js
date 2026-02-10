var fs = require('fs');
var path = require('path');
var async = require('async');
var AWS = require('aws-sdk');
var webpack = require('webpack');
var glob = require('glob');
var mime = require('mime-types');
var _ = require('@sailshq/lodash');

var webpackConfig = require('../webpack.config');
var package = require('../package.json');

var version = package.version;

if (_.isUndefined(process.env.sails_environment)) {
  console.error('No environent set -- please use deploy-prod or deploy-staging.');
  process.exit(1);
}

var awsConfig = _.defaults(require('../config/env/' + process.env.sails_environment).aws, require('../config/aws').aws);
AWS.config = new AWS.Config(awsConfig.credentials);
var s3 = new AWS.S3(awsConfig.s3);
var tmpDir = path.resolve(__dirname, '..', '.tmp/public');

if (process.env.no_webpack) {
  webpack = function(dummy, cb) { return cb(); };
}

webpack(webpackConfig, function(err) {

  if (err) {
    console.error(err);
    return process.exit(1);
  }

  // var filesToPublish = [
  //   {
  //     src: path.resolve(__dirname, '..', '.tmp', 'public', 'js', 'main.bundle.js'),
  //     dest: 'static/js/main.bundle.js'
  //   },
  //   // {
  //   //   src: path.resolve(__dirname, '..', '.tmp', 'public', 'styles', 'main.bundle.css'),
  //   //   dest: 'static/styles/main.bundle.' + version + '.css'
  //   // }
  // ];
  glob(tmpDir + '/{css/**,js/**,images/**,fonts/**}', {nodir: true}, function(err, filesToPublish) {

    if (err) {
      console.error(err);
      return process.exit(1);
    }

    filesToPublish = _.map(filesToPublish, function(fileToPublish) {
      return {
        src: fileToPublish,
        dest: path.resolve('/static', path.relative(tmpDir, fileToPublish))
      };
    });

    async.each(filesToPublish, function(fileToPublish, publishNextFile) {
      var params = {
        Key: version + fileToPublish.dest,
        Body: fs.createReadStream(fileToPublish.src),
        ACL: 'public-read'
      };
      var contentType = mime.lookup(fileToPublish.src);
      if (contentType) {
        params.ContentType = contentType;
      }
      s3.upload(params, function(err) {
        if (err) { return publishNextFile(err); }
        console.log('...published `' + version + fileToPublish.dest + '`');
        return publishNextFile();
      });
    }, function(err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
    });

  });


});
