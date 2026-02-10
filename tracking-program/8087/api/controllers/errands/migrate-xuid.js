const DataSync = require('../../services/DataSyncService')

module.exports = function (req, res) {

  DataSync.doMigrate(err => {
    console.log('Migrate: done with error', err)
    res.end(err)
  })

}
