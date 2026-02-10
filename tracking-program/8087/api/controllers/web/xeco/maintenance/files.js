const { readFileSync } = require('fs')

const { newTemp, createFileListPack } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance - List app files and folders',

  description: 'List all app files and folders present on this XECO Web Portal.',


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    let temp = newTemp('file-list')

    createFileListPack(temp.path + '/pack')
      .then(packPath => {
        this.res.attachment('pack')
        exits.success(readFileSync(packPath))
        temp.cleanup()
      })
      .catch(err => {
        throw err
      })

  }


}