const mqtt_address = process.env.MQTT_URL;
const devices_staging_url = process.env.DEVICES_STAGING_URL;
const xct_url = process.env.XCT_URL;

const mqtt = require('mqtt');
const request = require('request');

const client = mqtt.connect(mqtt_address, { clientId: 'http-bridge', clean: false, keepalive: 600});

client.on('connect', function() {
  console.log('connected ' + client.connected);
});

client.on('error', function(error) {
  console.log('error ' + error);
  process.exit(1);
});

client.on('message', (topic, message) => {
  console.log('Topic: ' + topic);
  console.log('Message: ' + message);

  if(topic === 'xeco/stop') {
    client.end();
  }

  try {
    let payload = JSON.parse(message);
    payload['topic'] = topic;

    console.log('posting ' + JSON.stringify(payload));
    request.post(devices_staging_url, {
      json: payload
    }, function(error, response, body) {
      //console.log('request error: ' + error);
    });
  } catch {
	console.log("INVALID JSON");
  }
  try {
    let payload2 = JSON.parse(message);
    payload2['topic'] = topic;

    console.log('posting to xct ' + JSON.stringify(payload2));
    request.post(xct_url, {
      json: payload2
    }, function(error, response, body) {
      //console.log('request xct error: ' + error);
    });
  } catch {
	console.log("INVALID xct JSON");
  }
});

client.subscribe('xeco/#');
