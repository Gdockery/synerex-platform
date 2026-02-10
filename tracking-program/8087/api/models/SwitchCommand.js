/**
 * SwitchCommand.js
 *
 * @description :: A scheduled switch command.
 */

const CommandsSemaphore = (() => {

  const locked = {}
  const waiting = []

  function checkWaitingQueue() {
    let i = 0, id, resolve

    while(i < waiting.length) {
      [id, resolve] = waiting[i]

      if(locked[id]) {
        // go to next
        i++
      } else {
        // resolve and remove
        locked[id] = true
        waiting.splice(i, 1)
        resolve()
      }
    }
  }

  function Lock(id) {
    return new Promise(resolve => {
      waiting.push([id, resolve])
      checkWaitingQueue()
    })
  }

  function Unlock(id) {
    delete locked[id]
    checkWaitingQueue()
  }

  return {
    Lock,
    Unlock
  }
})()

module.exports = {

  attributes: {

    // The project that this switch command belongs to.
    project: {
      model: 'Project',
      required: true
    },

    // The type of command that has been scheduled.
    // Use a value from the `sails.config.constants.SWITCH_COMMAND_TYPES` set.
    commandType: {
      type: 'number',
      required: true
    },

    deviceType: {
      type: 'number',
      allowNull: true,
    },

    // For on/off commands, the time to run the command.
    // FUTURE: for recurring commands, the time to start the schedule.
    startAt: {
      type: 'number',
      required: true
    },

    // The collection of switches to be controlled with this command.
    switches: {
      collection: 'switch'
    },

    // IDs of the switches that have accepted the command.
    acceptedBySwitchIds: {
      type: 'json',
      defaultsTo: []
    },

    // Whether the command was cancelled before being executed.
    isCancelled: {
      type: 'boolean',
      defaultsTo: false
    },

    // IDs of the switches that have cancelled the command.
    cancelledBySwitchIds: {
      type: 'json',
      defaultsTo: []
    },

    // IDs of the switches that have executed the command.
    executedBySwitchIds: {
      type: 'json',
      defaultsTo: []
    },

    // Test that this switch command is associated with, if any.
    test: {
      model: 'Test'
    }

  },

  lock: CommandsSemaphore.Lock,
  unlock: CommandsSemaphore.Unlock
};