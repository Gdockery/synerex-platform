const { LocalStatus } = require('../../../../services/MaintenanceService')

module.exports = {

  friendlyName: 'Maintenance Status',

  description: 'Check maintenance status of this XECO Web Portals.',


  inputs: {
  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {

    LocalStatus.update({
      time: (new Date).toGMTString()
    })

    exits.success(LocalStatus.get())
    
  }

}