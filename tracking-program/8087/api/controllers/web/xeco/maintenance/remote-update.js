const { RemoteHost } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance Remote Update',

  description: 'Remote update of other XECO Web Portals.',


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
      error: undefined,
      updateStatus: 'in progress'
    })

    remote.update()
      .then(() => remote.setStatus({
        error: undefined,
        updateStatus: 'success'
      }))
      .catch(err => remote.setStatus({
        error: String(err),
        updateStatus: 'failed'
      }))

    return exits.success(remote.getStatus())

  }

  
}