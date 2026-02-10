const { LocalStatus, State, rollbackUpdate } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance Rollback',

  description: 'Rollback latest update on this XECO Web Portals.',


  inputs: {
  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    let localState = LocalStatus.get().state

    if (localState != State.Ready && localState != State.Error) {
      return exits.error('Inappropriate state for rollback')
    }

    LocalStatus.update({
      state: State.RollingBack,
      error: null
    })

    rollbackUpdate()
      .then(() => { // this should never execute
        LocalStatus.update({
          impossible: 'message'
        })
      })
      .catch(err => {
        LocalStatus.update({
          state: State.Error,
          error: err.toString()
        })
      })

    return exits.success(LocalStatus.get())
  }

}