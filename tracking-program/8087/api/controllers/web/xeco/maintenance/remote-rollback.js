const { RemoteHost } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance Remote Rollback',

  description: 'Remote rollback of other XECO Web Portals.',


  inputs: {

    host: {
      description: 'The host in question',
      example: 'ip:port',
      required: true
    },

    secret: {
      description: 'The passphrase that enables maintenance on the remote host',
      example: '123abc',
      required: true
    }

  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    let remote = new RemoteHost(inputs.host, inputs.secret)

    remote.setStatus({
      rollbackError: undefined,
      time: (new Date).toGMTString()
    })

    remote.rollback()
      .catch(err => {
        remote.setStatus({
          rollbackError: err.toString(),
          time: (new Date).toGMTString()
        })
      })

    return exits.success(remote.getStatus())

  }


}