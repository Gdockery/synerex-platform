"""
IoT command service - publish MQTT messages for switch control.
Ported from api/services/IotCommand.js and api/helpers/devices/send-switch-command.js
Supports 'aws' (AWS IoT) and 'mqtt' protocols.
"""
import json
import logging
import os

logger = logging.getLogger(__name__)

_protocol = None
_iot_client = None


def _get_protocol():
    return os.environ.get("IOT_PROTOCOL", "aws").lower()


def _get_aws_client():
    """Lazy-init AWS IoT Data client."""
    global _iot_client
    if _iot_client is None:
        try:
            import boto3
            endpoint = os.environ.get("AWS_IOT_ENDPOINT", "a15raz503f5pp3.iot.us-east-1.amazonaws.com")
            _iot_client = boto3.client("iot-data", endpoint_url=f"https://{endpoint}")
        except Exception as e:
            logger.warning("AWS IoT client init failed: %s", e)
    return _iot_client


def publish(topic, payload):
    """
    Publish message to IoT topic.
    payload: dict or str - if dict, will be JSON stringified.
    """
    protocol = _get_protocol()
    payload_str = json.dumps(payload) if isinstance(payload, dict) else str(payload)

    if protocol == "aws":
        client = _get_aws_client()
        if not client:
            raise RuntimeError("AWS IoT client not available")
        try:
            client.publish(topic=topic, qos=0, payload=payload_str.encode("utf-8"))
        except Exception as e:
            logger.exception("AWS IoT publish failed: %s", e)
            raise
    elif protocol == "mqtt":
        try:
            import paho.mqtt.client as mqtt
            address = os.environ.get("MQTT_ADDRESS", "localhost:1883")
            if ":" in address:
                host, port = address.rsplit(":", 1)
                port = int(port)
            else:
                host, port = address, 1883
            client_id = os.environ.get("MQTT_CLIENT_ID", "flask-rollup")
            client = mqtt.Client(client_id=client_id, clean_session=False)
            client.connect(host, port, 60)
            client.publish(topic, payload_str, qos=0)
            client.disconnect()
        except ImportError:
            raise RuntimeError("paho-mqtt required for MQTT protocol. pip install paho-mqtt")
        except Exception as e:
            logger.exception("MQTT publish failed: %s", e)
            raise
    elif protocol == "none":
        logger.debug("IOT_PROTOCOL=none — skipping publish to %s", topic)
    else:
        raise ValueError(f"Unknown IOT_PROTOCOL: {protocol}")
