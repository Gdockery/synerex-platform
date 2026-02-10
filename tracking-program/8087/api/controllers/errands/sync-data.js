const DataSync = require('../../services/DataSyncService')

module.exports = function (req, res) {

	  DataSync.sync(err => {
	    console.log('Sync: done with error', err)
	    res.end(err)
	  })

  

}
