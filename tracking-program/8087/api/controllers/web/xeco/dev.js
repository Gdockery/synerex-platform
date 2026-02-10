module.exports = {

  friendlyName: 'Development helper action',


  description: 'Check maintenance status of this XECO Web Portals.',

  inputs: {
    command: {
      description: 'A command name',
      example: 'some-command',
      required: true
    },

  },


  exits: {
    badRequest: { statusCode: 400 }
  },


  fn: function (inputs, exits) {
    switch(inputs.command) {
      case 'reload':
        return sails.reloadActions(exits.success)
        break
    }
  }

}