module.exports = {


  friendlyName: 'List project switches',


  description: 'Get a filtered, paginated list of all switches in a project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    deviceType: {
      description: 'A filter constraint.',
      extendedDescription: 'This value will be matched exactly.',
      example: 1
    },


  },


  exits: {

    success: sails.config.constants.getPaginationSuccessExit({
      id: 123,
      name: 'switch name',
      isOn: false,
      lastCommunicatedAt: 19238235823,
      meshLastCommunicatedAt: 19238235823,
      status: [],
      hasSchedule: true,
      pf: 90,
      voltage: 122,
      ampLoad: 200,
      deviceType: 2, 
    }),

    badRequest: { statusCode: 400 },

    unauthorized: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    // Make sure that the logged-in user has access to this project.
    if (!_.any(this.req.user.projects, {id: inputs.project})) {
      return exits.unauthorized();
    }

    sails.helpers.web.findAndFormatRecords({
      model: Switch,
      selectClause: ['id', 'name', 'ampLoad', 'voltage','pf','deviceId', 'originalHours','lastCommunicatedAt', 'meshLastCommunicatedAt','hasSchedule', 'deviceType'],
      whereClause: {
        project: inputs.project,
        deviceType: inputs.deviceType,
        isDeleted: false
      },
    }).exec({
      error: function (err) {
        return exits.error(err);
      },
      badRequest: function(err){
        return exits.badRequest(err);
      },
      success: function(report) {

        Project.findOne({ id: inputs.project }).exec(function(err, project) {
          let curTime = (new Date()).getTime();

          report.response = report.response.map(switchItem => {
            switchItem.status = [];
            return switchItem;
          });

          Test.find({
            project: inputs.project,
            startAt: { '<=': curTime },
            endAt: { '>=': curTime },
            isDeleted: false
          }).exec(function(err, tests) {
            if (err) {return exits.error(err);}

            // If a test is running, set status 'test' for everyone
            if (tests.length > 0) {
              report.response = report.response.map(switchItem => {
                switchItem.status.push('Test');
                return switchItem;
              });
            }

                // Test the state of the switch based on piboard
                PiBoard.find({
                  deviceId: { in: _.pluck(report.response, 'deviceId') }
                })
                  .exec(function(err, piboards) {
                    if (err) {
                      return exits.error(err);
                    }

                    report.response = report.response.map(switchItem => {
                      let piboard = _.find(piboards, function(item) { return item.deviceId === switchItem.deviceId; });

                      let status = 'Undefined';
                      if (piboard) {
                        // Switch statuses are actually reversed
                        status = piboard.switchState ? 'Off' : 'On';
                      }

                      switchItem.status.push(status);
                      return switchItem;
                    });

                    report.response = report.response.map(switchItem => {
                      if (switchItem.meshLastCommunicatedAt < curTime - 3 * 60 * 1000) {
                        switchItem.status = ['Poweroff'];
                      }

                      return switchItem;
                    });

                    return exits.success(report);
                  });
              });

        });

      }
    });

  }

};
