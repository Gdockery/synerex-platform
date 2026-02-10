import json
import os
from EGCommon.egLogging import log

from EGCommon.egGPIO import EGGPIO
from EGCommon.egUtils import *
from EGDatabase.egScheduleTable import EGScheduleTable
from EGSensors.egSensors import EGSensors
from egMQTTClient import EGMQTTClient
from egMQTTSensorMessageHandlers import EGMQTTSensorMessageHandlers
from EGDatabase.egDatabaseManager import globalDBManager
from EGCommon.egMainManager import EGMainManager

#------------------------------------------------------------------------------------------------------------------
#
# Implementation of MQTT flow for a Sensor Node
# The Sensor Node reads sensors data and publish it to their sensorID topics and writes to local DB
# Subscribed to a control topic on which it receives control messages from broker/cloud
# Subscribed to an update topic on which it receives update messages
# Subscribed to a switch topic on which it receives gpio switch control messages

class EGMQTTClientSensorNode(EGMQTTClient):

    def __init__(self, host=None, port=1883):
        host = host or os.getenv("MQTT_HOST")
        EGMQTTClient.__init__(self, host=host, port=port)
        self.msgHandler = EGMQTTSensorMessageHandlers(self)
        self.sensor = EGSensors()
        #self.sensor = EG3037USBSensors()
        self.lowPriorityInterval = 59 # The timeout loops from mqtt+mesh communication thread add a 1-2s delay

        self.subscribeTopics = None

        self.publishTopicData = None
        self.publishTopicStatus = None
        self.publishTopicScheduleAck = None
        self.publishTopicControl = None

        self.createTopics()

        # SWITCH GPIO
        self.switch = EGGPIO(20)
        self.refreshSwitchStatus = True
        self.currentSwitchValue = self.switch.get()

        # Dummy serial to match the printed stickers
        self.serial = EGUtil.getInterfaceMACAddress(interface="eth0")

        self.pendingDataMessages = {}

        # Save the timestamp for the last immediate switch command, in case we need to ignore the schedule
        self.lastSwitchCmdTimeStamp = 0


    def createTopics(self):

        topicNode = "xeco/" + str(globalSettings.id) + "/sensors/" + self.sensor.hostid

        self.subscribeTopics = [
            (topicNode + "/control", 0),
            (topicNode + "/update", 0),
            (topicNode + "/switch", 0),
            (topicNode + "/cancelcontrol", 0)
        ]

        self.publishTopicData = topicNode + "/" + self.sensor.sensorid + "/meterData"
        self.publishTopicStatus = topicNode + "/status"
        self.publishTopicScheduleAck = topicNode + "/ack"
        self.publishTopicControl = topicNode + "/control"

        log.info("Subscribed to %s\n Publishing to topic: %s\n" % (self.subscribeTopics, self.publishTopicData))

    #------------------------------------------------------------------------------------------------------------------
    #
    # Message has reached broker => update DB
    #
    def on_publish(self, client, userdata, mid):
        sensorData = self.pendingDataMessages.get(mid)
        if sensorData is not None:
            log.info("[Node on_publish] QOS Message published id: %d dataid %s. Updating status in DB." % (mid, sensorData.id))
            self.sensor.updateStatus(sensorData.id, EGSensors.STATUS_TRANSMITED)
            self.pendingDataMessages.pop(mid)

    # ------------------------------------------------------------------------------------------------------------------
    #
    # We received a control message from broker
    #
    def on_message(self, client, userdata, msg):
        topic = msg.topic
        topicParts = topic.split("/")
        type = topicParts[-1]

        if type == "control":
            self.msgHandler.handleControlMessage(msg)
        elif type == "update":
            self.msgHandler.handleUpdateMessage(msg)
        elif type == "switch":
            self.msgHandler.handleSwitchMessage(msg)
        elif type == "cancelcontrol":
            self.msgHandler.handleCancelControlMessage(msg)
        else:
            log.error("[Node on_message] Unknown sensor topic type: %s" % type)


    def onTopicsChange(self):
        log.info("Disconnecting to refresh topics")
        self.client.disconnect()
        self.createTopics()
        self.refreshSwitchStatus = True
        # No need to issue a connect() as this is handled on message publishing

    # ------------------------------------------------------------------------------------------------------------------
    #
    # Publish messages to broker
    #
    def addHighPriorityMessages(self):
        self.checkSwitchSchedule()


    def addLowPriorityMessages(self):
        self.__publishDataMessage()
        if self.refreshSwitchStatus:
            if self.publishStatusMessage():
                self.refreshSwitchStatus = False


    def __publishDataMessage(self):
        data = self.sensor.readSensor()

        if data is None:
            return

        self.sensor.saveData(data)

        (result, mid) = self.client.publish(self.publishTopicData, data.toJSON(), qos=0)
        self.pendingDataMessages[mid] = data

        if result < 0:
            log.info("Error publishing data message id: %d" % mid)
        else:
            log.info("Publishing data message id: %d dataid: %s" % (mid, data.id))

        return (result > -1)


    def publishStatusMessage(self):
        from main import __version__

        # Check for ON or OFF file and set currentSwitchValue
        if os.path.isfile("/home/pi/ON"):
            self.currentSwitchValue = "0"
        elif os.path.isfile("/home/pi/OFF"):
            self.currentSwitchValue = "1"

        data = {
            "switch": {
                "status": self.currentSwitchValue
            },
            "serial": self.serial,
            "version": __version__,
        }

        (result, mid) = self.client.publish(self.publishTopicStatus, json.dumps(data), qos=0)

        if result < 0:
            log.info("Error publishing switch message id: %d" % mid)
        else:
            log.info("Publishing switch message id: %d" % mid)

        return (result > -1)


    def checkSwitchSchedule(self):
        res = globalDBManager.nodesScheduleTable.getLastApplicableCommand()

        if res is not None:
            (newstate, timestamp) = res
            # Which is always true if no manual commands have been sent since last... is zero
            if (self.lastSwitchCmdTimeStamp < timestamp):
                #nowstate = self.switch.get()
                #log.info("[SCHEDULE CHECK] newstate: %d, oldstate: %s", int(newstate), str(nowstate))
                #if (nowstate == None) or (int(newstate) <> nowstate):
                log.info("[SCHEDULED] Turning SWITCH to %s" % str(newstate))

                if (newstate): 
                    f = open("/home/pi/turnoff","w")
                    f.write("1")
                else:
                    f = open("/home/pi/turnon","w")
                    f.write("0")
                f.close()
                self.switch.set(int(newstate))
                self.currentSwitchValue = str(newstate)
                self.refreshSwitchStatus = True
                log.info("[SCHEDULED] Switch status is now %s", self.currentSwitchValue)
                if self.publishStatusMessage():
                    self.refreshSwitchStatus = False
                #log.info("[SCHEDULED] Switch status is now %s", self.currentSwitchValue)
            else:
                log.info("Last manual switch at %d trumps schedule at %d" % (self.lastSwitchCmdTimeStamp, timestamp))
        else:
            log.info("Defaulting switch to ON")
            f = open("/home/pi/turnon","w")
            f.write("1")
            f.close()
            self.currentSwitchValue = 1 

            # Check for ON or OFF file and set currentSwitchValue
            if os.path.isfile("/home/pi/ON"):
                self.currentSwitchValue = "0"
            elif os.path.isfile("/home/pi/OFF"):
                self.currentSwitchValue = "1"
            self.switch.set(0)
            self.refreshSwitchStatus = True
            if self.publishStatusMessage():
                self.refreshSwitchStatus = False

    def publishScheduleAck(self, itemid, action):

        data = {
            "type": "scheduleack",
            "id": itemid,
            "action": action
        }

        (result, mid) = self.client.publish(self.publishTopicScheduleAck, json.dumps(data), qos=0)

        if result < 0:
            log.info("Error publishing schedule ack message id: %d" % mid)
        else:
            log.info("Publishing schedule ack message id: %d schedule id: %s" % (mid, data["id"]))

        return (result > -1)

    # Publish an ack if the switch command was successful. This is processed by Master Node which publish retries
    # for switch messages received from application server
    def publishSwitchAck(self, status):

        data = {
            "type": "switchack",
            "status": status
        }

        (result, mid) = self.client.publish(self.publishTopicScheduleAck, json.dumps(data), qos=0)

        if result < 0:
            log.info("Error publishing switch ack message id: %d" % mid)
        else:
            log.info("Publishing switch ack message id: %d status: %s" % (mid, data["status"]))

        return (result > -1)


    # This is called when a control message with reboot: true is received to remove this message and prevent reboot loop
    def publishRebootAck(self):
        data = {
            "reboot": False
        }

        (result, mid) = self.client.publish(self.publishTopicControl, json.dumps(data), qos=0)

        if result < 0:
            log.info("Error publishing reboot ack message id: %d" % mid)
        else:
            log.info("Publishing schedule reboot ack id: %d" % mid)

        return (result > -1)


if __name__ == "__main__":
    mqttpub = EGMQTTClientSensorNode()
    while True:
        mqttpub.handleMessages()
