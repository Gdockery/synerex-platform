/**
 * PiBoard.js
 *
 * @description :: An identified Raspberry Pi on the network.
 *
 * This model is for internal use only, to keep track of which Pis have been discovered
 * via /status messages.  Pi-boards are not displayed as separate entities in the Portal app,
 * but are instead shown via their association with Meter, Switch, Repeater and Gateway models.
 *
 * By recording all identified Pi-boards as PiBoard records, we can reconcile messages from
 * unknown mesh IDs by searching through this table and (hopefully) finding a previously-identified
 * board to match the message with.
 *
 */

module.exports = {

  attributes: {

    // The serial number of the device.
    deviceId: {
      type: 'string',
      required: true
    },

    // The MAC address of the device's networking component (wireless card, USB dongle, etc.)
    meshId: {
      type: 'string',
      required: true
    },

    // The state of the switch (if any) attached to this Pi board.
    // "true" if on, "false" if off.
    switchState: {
      type: 'boolean',
      required: true
    },

    // The current (acknowledged) software version on the board.
    softwareVersion: {
      type: 'string'
    },

    // Time when the node last communicated with the server.
    lastCommunicatedAt: {
      type: 'number'
    }

  },

};

