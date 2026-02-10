module.exports = {


  friendlyName: 'List project switches',


  description: 'Get a filtered, paginated list of all switches in a project.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    name: {
      description: 'A filter constraint.',
      extendedDescription: 'If specified, results will be filtered to only those that contain this substring in the relevant field.',
      example: 'B1 Main'
    },

    deviceType: {
      description: 'A filter constraint.',
      extendedDescription: 'This value will be matched exactly.',
      example: 1
    },

    // Generic pagination/sorting inputs:
    page: sails.config.constants.PAGINATION_INPUTS.page,
    pageSize: sails.config.constants.PAGINATION_INPUTS.pageSize,
    orderBy: sails.config.constants.PAGINATION_INPUTS.orderBy,
    orderDirection: sails.config.constants.PAGINATION_INPUTS.orderDirection

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
      gateway: 'B8:27:EB',
      meshIp: '10.1.0.200',
      deviceType: 1, 
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
      selectClause: ['id', 'name', 'lastCommunicatedAt', 'meshLastCommunicatedAt', 'deviceId', 'hasSchedule', 'deviceType', 'gateway', 'meshIp'],
      whereClause: {
        project: inputs.project,
        name: !_.isUndefined(inputs.name) ? { contains: inputs.name } : undefined,
        deviceType: inputs.deviceType,
        isDeleted: false
      },
      sortClause: (inputs.orderBy||'name') + ' ' + (inputs.orderDirection||'ASC'),
      pageSize: inputs.pageSize,
      page: inputs.page
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

          if (project.gwControl) {
            report.response = report.response.map(switchItem => {
              switchItem.status = ['On'];
              return switchItem;
            });

            Test.find({
              project: inputs.project,
              startAt: { '<=': curTime },
              endAt: { '>=': curTime },
              isDeleted: false
            })
              .exec(function(err, tests) {
                if (tests.length > 0) {
                  var test = tests[0];
                  var segment = Math.floor((curTime - test.startAt) / 3600000) + 1;

                  report.response = report.response.map(switchItem => {
                    if (segment % 2 === 1) {
                      switchItem.status = ['Off'];
                    }
                    switchItem.status.push('Test');
                    return switchItem;
                  });
                }

                Gateway.find({ project: inputs.project, isDeleted: false }).sort('lastCommunicatedAt DESC').limit(1)
                  .exec(function(err, gateway) {
                    gateway = gateway[0];

                    report.response = report.response.map(switchItem => {
                      switchItem.meshLastCommunicatedAt = gateway.lastCommunicatedAt;
                      return switchItem;
                    });

                    return exits.success(report);
                  });

              });

          } else {
            report.response = report.response.map(switchItem => {
              switchItem.status = [];
              return switchItem;
            });

            Test.find({
              project: inputs.project,
              startAt: { '<=': curTime },
              endAt: { '>=': curTime },
              isDeleted: false
            })
              .exec(function(err, tests) {
                if (err) {
                  return exits.error(err);
                }

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

          }

        });

      }
    });

  }

};
