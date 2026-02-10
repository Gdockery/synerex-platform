const { unlinkSync } = require('fs')
const { basename, dirname } = require('path')
const { LocalStatus, State, applyUpdate, tempPath } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance Update',

  description: 'Remote maintenance of other XECO Web Portals.',


  files: ['pack'],


  inputs: {

    pack: {
      example: '===',
      required: true
    }

  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    let localState = LocalStatus.get().state

    if (localState != State.Ready && localState != State.Error) {
      return exits.error('Inappropriate state for update')
    }

    let packPath = tempPath('received-pack')

    LocalStatus.update({
      state: State.Updating,
      error: null
    })

    inputs.pack.upload({
      maxBytes: 200000000,
      dirname: dirname(packPath),
      saveAs: basename(packPath)
    }, (err, uploadedFiles) => {

      if (err) {
        LocalStatus.update({
          state: State.Error,
          error: err.toString()
        })

        return exits.error(err)
      }

      LocalStatus.update({
        file: packPath
      })

      applyUpdate(packPath)
        .then(() => { // this should never execute
          unlinkSync(packPath)
          LocalStatus.update({
            impossible: 'message'
          })
        })
        .catch(err => {
          unlinkSync(packPath)
          LocalStatus.update({
            state: State.Error,
            error: err.toString()
          })
        })

      return exits.success(LocalStatus.get())
    })

  }

}