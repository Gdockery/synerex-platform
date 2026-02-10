var async = require('async');
var moment = require('moment-timezone');

// Attempt to import `sails` dependency, as well as `rc` (for loading `.sailsrc` files).
var sails;
var rc;
try {
  sails = require('sails');
  rc = require('sails/accessible/rc');
} catch (e) {
  console.error('Encountered an error when attempting to require(\'sails\'):');
  console.error(e.stack);
  return;
}//-•

// Get the config from the environment.
var conf = rc('sails');

// Turn off most hooks.
conf.hooks = {
  request: false,
  views: false,
  blueprints: false,
  pubsub: false,
  policies: false,
  security: false,
  i18n: false,
  session: false,
  sockets: false,
  auth: false,
  user: false,
  webpack: false,

  // Create the "alerts" hook that will run this service.
  deviceSim: function(sails) { // eslint-disable-line
                            // ^^^ hooks should always accept the "sails" arg

    return {

      initialize: function(cb) {

        var AWS = require('aws-sdk');

        // Get the Sails environment (e.g. web-staging) config.
        var envConfig = require('../../../config/env/' + process.env.sails_environment);

        // Pull the AWS config out, with some defaults.
        var awsConfig = _.defaults(envConfig.aws, require('../../../config/aws').aws);

        // Configure the AWS SDK.
        AWS.config = new AWS.Config(awsConfig.credentials);

        // Get a handle to the IoT API
        this.iotData = new AWS.IotData(awsConfig.iotData);

        return cb();

      },

      routes: {
        before: {
          // This endpoint will be POSTed to by the SQS queue, which a user
          // may add a message to directly.
          'POST /': function (req, res) {

            var sails = req._sails;

            // Get the MQTT topic from the message.
            var topic = req.param('topic');

            var match = topic.match(/^enola\/(.*)\/sensor\/(.*)\/(.*)\/(.*)$/);

            // If it's a match, pull the pertinent info out of the topic and run the associated helper.
            if (match) {

              var projectId, meshId, sensorId, command;
              [, projectId, meshId, sensorId, command] = match;

              var pubTopic = 'enola/' + projectId + '/sensor/' + meshId + '/' + sensorId + '/ack';
              // Acknowledge the command
              sails.hooks.deviceSim.iotData.publish({
                topic: pubTopic,
                payload: JSON.stringify({
                  id: req.body.id,
                  action: command === 'control' ? 'added' : 'deleted',
                  test: true
                })
              }, function(err, data) {
                if (err) {
                  console.error(err);
                  return res.serverError(new Error('Error publishing to: ' + pubTopic));
                }
                return res.ok('Successfully published to: ' + pubTopic);
              });

            }

            else {
              return res.serverError(new Error('Unknown topic: ' + topic));
            }

          },

          'POST /add-device-data': function(req, res) {
            Project.find({ isDeleted: false }).populate('meters', { isDeleted: false }).exec(function(err, projects) {
              if (err) { return res.serverError(err); }
              var meters = _.reduce(projects, function(memo, project) {
                return memo.concat(project.meters);
              }, []);
              async.eachSeries(meters, function(meter, nextMeter) {

                var d = {};
                [d['4018'], d['4019'], d['4020'], d['4055'], d['4056'], d['4057'], d['4028'], d['4029'], d['4030'], d['4046'], d['4047'], d['4048'], d['4052'], d['4053'], d['4054'], d['4037'], d['4038'], d['4039']] = createMeterRecord(true);
                // Divide by 1000 since the real meters will send Unix timestamps, not JS ones.
                d.recordedAt = _.round((new Date()).getTime() / 1000);
                // Set the "test" flag so that the message will be sent to the staging queue.
                d.test = true;

                var topic = 'enola/'  + meter.project + '/sensor/' + meter.meshId + '/' + meter.deviceId + '/data';

                sails.hooks.deviceSim.iotData.publish({
                  topic: topic,
                  payload: JSON.stringify(d)
                }, function(err, data) {
                  if (err) {
                    console.log('Error publishing to: ', topic, err);
                    return nextMeter(err);
                  }
                  console.log('Successfully published to: ', topic);
                  return nextMeter();
                });

              }, function(err) {
                if (err) { return res.serverError(err); }
                return res.ok();
              });

            });
          },

          // Don't allow any other requests through.
          '/*': function (req, res) { return res.serverError(new Error('Sim service received request to ' + req.url + ' (should only get POST / requests).')); }

        }
      }
    };
  }
};

conf.bootstrap = function(cb) { return cb(); };

// Start server.
sails.lift(conf);

function createMeterRecord(xeco) {
  var phases = [
    _.random(264000, 268000) / 1000, // l1Volt
    _.random(264000, 268000) / 1000, // l2Volt
    _.random(264000, 268000) / 1000, // l3Volt
    _.random(370000, 470000) / 1000, // l1Amp
    _.random(370000, 470000) / 1000, // l2Amp
    _.random(370000, 470000) / 1000, // l3Amp
    _.random( 75000, 115000) / 1000, // l1Kw
    _.random( 75000, 115000) / 1000, // l2Kw
    _.random( 75000, 115000) / 1000, // l3Kw
    (_.random( 95000, 130000) * (xeco ? 0.95 : 1)) / 1000, // l1Kva,
    (_.random( 95000, 130000) * (xeco ? 0.95 : 1)) / 1000, // l2Kva,
    (_.random( 95000, 130000) * (xeco ? 0.95 : 1)) / 1000, // l3Kva,
    (_.random( 70, 90) * (xeco ? 1 : 0.96)) / 100 , // l1Pf,
    (_.random( 70, 90) * (xeco ? 1 : 0.96)) / 100 , // l2Pf,
    (_.random( 70, 90) * (xeco ? 1 : 0.96)) / 100 , // l3Pf,
    (_.random( 50000, 70000) * (xeco ? 0.8 : 1)) / 1000, // l1Kvar,
    (_.random( 50000, 70000) * (xeco ? 0.8 : 1)) / 1000, // l2Kvar,
    (_.random( 50000, 70000) * (xeco ? 0.8 : 1)) / 1000, // l3Kvar,
  ];

  return phases;

}
