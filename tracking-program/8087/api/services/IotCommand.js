let AWS = require('aws-sdk');
let mqtt = require('mqtt');

function IotCommand(protocol, extra) {
  sails.log.debug(protocol);

  if (typeof protocol !== 'undefined' && protocol) {
    this.protocol = protocol;
  } else {
    this.protocol = 'aws';
  }
  sails.log.debug(this.protocol);

  switch(this.protocol) {
    case 'aws':
      AWS.config = new AWS.Config(sails.config.aws.credentials);
      this.iotData = new AWS.IotData(sails.config.aws.iotData);
      break;

    case 'mqtt':
      this.iotData = mqtt.connect(sails.config.mqtt.address, { clientId: sails.config.mqtt.clientId, clean: false});
      break;
  }

}

IotCommand.prototype.publish = function(params, callback) {
  switch(this.protocol) {
    case 'aws':
      this.iotData.publish({
        topic: params.topic,
        payload: params.payload
      }, function(err, data) {
        if (callback && typeof callback === 'function') {
          return callback(err, data);
        }
      });
      break;

    case 'mqtt':
      var that = this;

      this.iotData.publish(params.topic, params.payload, function () {
        that.iotData.end();

        if (callback && typeof callback === 'function') {
          return callback(null, null);
        }
      });

      break;
  }
};

module.exports = IotCommand;
