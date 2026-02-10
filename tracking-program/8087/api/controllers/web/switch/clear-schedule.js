module.exports = {


  friendlyName: 'Clear scheduled events',


  description: 'Cancel and delete all scheduled events.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    }

  },


  exits: {

    unauthorized: {
      statusCode: 404
    },

    notFound: {
      statusCode: 404
    }

  },


  fn: function (inputs, exits) {
    // Make sure that the logged-in user has access to this project.
    let project = _.find(this.req.user.projects, { id: inputs.project })
    if (!project) {
      return exits.unauthorized();
    }

    SwitchCommand.find({
      project: project.id
    })
      .exec((err, commands) => {
        if (err) {
          return exits.error(err)
        }

        async.each(commands,
          (command, callback) => {
            sails.helpers.devices.cancelSwitchSchedule({
              projectSlug: project.slug,
              scheduleId: 'x-' + command.id
            }).exec(function (err) {
              if (err) {
                return callback(err)
              }

              SwitchCommand.destroy({
                id: command.id
              })
                .exec(err => {
                  if (err) {
                    return callback(err)
                  }

                  return callback()
                })
            })
          },
          err => {
            if (err) {
              return exits.error(err)
            }

            return exits.success()
          })
      })
  }


}
