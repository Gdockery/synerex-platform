// const StorageService = require('../../services/StorageService')
const SyncService = require('../../services/DataSyncService')

module.exports = function (req, res) {

  // StorageService.writeSync('this/is/just/a/test', 'and it worked!')
  // res.end('DONE')

  // SyncService.sync(err => {
  //   res.end('Done with error: ' + err)
  // }, ['switch', 'switchcommand', 'switch_switches_switch__switchcommand_switches'])

  // SyncService.exportRecords('switchcommand', 1544023457111, 500, (err, records) => {
  //   SyncService.prepareSwitchCommandsForImport(records, (err, records) => {
  //     res.end(JSON.stringify(records))
  //   })
  // })
  
  console.log('Recreating delete triggers..')
  SyncService.recreateDeleteTriggers(err => {
    res.end('Done with error: ' + err)
  })
}
