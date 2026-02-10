const async = require('async')

const DataSync = require('../../services/DataSyncService')

module.exports = {

  friendlyName: 'Data sync - data export handler',

  description: 'Exports data',


  inputs: {
    table: {
      description: 'The name of the DB table',
      example: 'meterdata',
      required: true
    },

    since: {
      description: 'Records created or updated since this time - milliseconds timestamp',
      example: 0,
      required: false
    },

    limit: {
      description: 'The maximum count of records to return',
      example: 0,
      required: false
    },

    refId: {
      description: 'Local ID must be equal or greater than this',
      example: 0,
      required: false
    }
  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    let table = inputs.table

    if (!DataSync.isSyncable(table)) {
      return exits.badRequest('no table')
    }

    let since = inputs.since || 0

    let limit = inputs.limit

    // TODO make default and maximum limit configurable if needed
    if (!limit) {
      limit = 10000
    }

    if (limit > 10000) {
      limit = 10000
    }

    let refId = inputs.refId || 0

    DataSync.exportRecords(table, since, limit, refId, (err, records) => {
      if(err) {
        return exits.error(err)
      }

      exits.success(records)
    })
  }

}
