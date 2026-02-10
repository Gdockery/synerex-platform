var util = require('util');
var _ = require('@sailshq/lodash');

// Map helper names to regexes for the topic that that helper handles.
var topics = {
  processSensorData: /^xeco\/(.+)\/sensors\/(.*)\/(.*)\/data$/,
  processMeterData: /^xeco\/(.+)\/sensors\/(.*)\/(.*)\/meterData$/,
  processEquipmentData: /^xeco\/(.+)\/sensors\/(.*)\/(.*)\/equipmentData$/,
  processBeacon: /^xeco\/(.+)\/gateways\/(.*)\/status$/,
  processControlMessage: /^xeco\/.+\/(sensors|gateways)\/.+\/(control$|cancelcontrol)/,
  processControlAck: /^xeco\/(.+)\/sensors\/(.*)\/ack$/,
  processSoftwareAck: /^xeco\/(.+)\/gateways\/(.*)\/ack$/,
  processStatus: /^xeco\/(.+)\/sensors\/(.*)\/status$/
};

module.exports = function routeMessage(req, res) {

  var sails = req._sails;

  // Get the MQTT topic from the message.
  var topic = req.param('topic');
  if (!topic) { return res.serverError(new Error('Devices service received message wihout MQTT topic in body: ' + util.inspect(req.body))); }

  // Start a dictionary of inputs to the helper, omitting "topic".
  var inputs = { payload: _.omit(req.body, 'topic') };

  var projectSlug;

  var matchedHelperName;
  var match;

  // Loop through the known topics to find the one that matches the one we received.
  for (var helperName in topics) {

    // Attempt to match the topic we received to one of the known topics.
    match = topic.match(topics[helperName]);

    // If there's a match, set the helper name for use below.
    if (match) {
      matchedHelperName = helperName;
      break;
    }

  }

  console.log("matchedHelperName: ", matchedHelperName);

  // Set the helper inputs according to the helper we determined based on the MQTT topic.
  switch (matchedHelperName) {

    // Ignore control messages.  We may get these due to the IoT rule being set to listen for xeco/#.
    case 'processControlMessage':
      return res.ok();

    case 'processSensorData':
      [, projectSlug, inputs.meshId, inputs.meterSerialNumber] = match;
      break;
      
    case 'processEquipmentData':
      [, projectSlug, inputs.meshId] = match;
      break;

    case 'processMeterData':
      [, projectSlug, inputs.meshId] = match;
      break;

    case 'processBeacon':
      [, projectSlug, inputs.deviceId] = match;
      if (projectSlug === 'None') {
        matchedHelperName = 'processGatewayFlare';
        projectSlug = null;
      }
      break;

    case 'processControlAck':
      [, projectSlug, inputs.meshId] = match;
      break;

    case 'processSoftwareAck':
      [, projectSlug, inputs.gatewayId] = match;
      break;

    case 'processStatus':
      [, projectSlug, inputs.meshId] = match;
      break;

    default:
      // If we made it here, then the message topic didn't match any of the known topics.
      sails.log.error(new Error('Devices service received message with unknown topic: ' + req.param('topic')));
      return res.ok();

  }

  // Strip out any undefined inputs.
  inputs = _.omit(inputs, function(val) { return _.isUndefined(val); }); // jshint ignore:line

  // Add the project slug if we have one.
  if (projectSlug) {
    inputs.projectSlug = projectSlug;
  }

  // Run the given helper.
  sails.helpers.devices[matchedHelperName](inputs).setEnv({sails: sails}).exec(function (err, resp) { // jshint ignore:line
    if (err) { return res.serverError(err); }
    return res.ok(resp);
  });
  return;


};
