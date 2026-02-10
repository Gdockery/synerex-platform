const DataSync = require('../../services/DataSyncService')

module.exports = function (req, res) {

  DataSync.undoMigrate(err => {
    console.log('Undo migrate: done with error', err)
    res.end(err)
  })

}
