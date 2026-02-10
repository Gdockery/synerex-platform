const { RemoteHost, LocalStatus } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance Status of Remote Host',

  description: 'Maintenance status of other XECO Web Portals.',


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

    remote.readStatus()
      .then(() => {
        exits.success({
          local: LocalStatus.get(),
          remote: remote.getStatus()
        })
      })

  }


}