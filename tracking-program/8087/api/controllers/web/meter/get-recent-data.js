module.exports = {


  friendlyName: 'Get recent meter data for project',


  description: 'Get the most recent reading for every meter in a project.',


  inputs: {

    page: {
      description: 'Page number to retrieve.',
      example: 1,
      defaultsTo: 1
    },

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

    hasSwitch: {
      description: 'Filter by whether or not the meter has a switch control attached.',
      example: true
    },

    xecoSwitchedOn: {
      description: 'Filter by whether or not the meter has its Xeco unit switched on.',
      example: true
    },

    name: {
      description: 'Value to filter the "meter name" column by.',
      extendedDescription: 'This value will be matched using `like`.',
      example: 'B1 Main'
    },

    lastL1Kw: {
      description: 'Value to filter the "KW Supply" column by.',
      extendedDescription: 'This value will be matched exactly.',
      example: 123.45
    },

    lastL1Pf: {
      description: 'Value to filter the "power factor" column by.',
      extendedDescription: 'This value will be matched exactly.',
      example: 123.45
    },

    lastL1Volt: {
      description: 'Value to filter the "voltage" column by.',
      extendedDescription: 'This value will be matched exactly.',
      example: 123.45
    },

    lastL1Amp: {
      description: 'Value to filter the "current" column by.',
      extendedDescription: 'This value will be matched exactly.',
      example: 123.45
    },

    lastL1Kva: {
      description: 'Value to filter the "KVA demand" column by.',
      extendedDescription: 'This value will be matched exactly.',
      example: 123.45
    },

    lastL1Kvar: {
      description: 'Value to filter the "kvar" column by.',
      extendedDescription: 'This value will be matched exactly.',
      example: 123.45
    },


    orderBy: {
      description: 'Column to sort results by.',
      example: 'lastL1Pf',
      defaultsTo: 'name'
    },

    orderDirection: {
      description: 'Direction to sort the results.',
      example: 'ASC',
      defaultsTo: 'ASC'
    }

  },


  exits: {
    success: {
      outputExample: {
        meta: {
          page: 1,
          total: 33
        },
        response: []
      }
    },
    unauthorized: {
      statusCode: 404
    }
  },


  fn: function (inputs, exits) {
    var req = this.req;

    var req = req;

    // Make sure that the logged-in user has access to this project.
    if ( !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    // Get the SQL queries we need.
    sails.helpers.web.meter.getRecentDataQuery(_.extend({}, inputs, {limit: 1000})).exec({
      error: exits.error,
      success: function(queries) {

        async.auto({
          count: function(cb) {
            queries.countQuery.exec(cb);
          },

          rows: function(cb) {
            queries.dataQuery.exec(cb);
          }

        }, function(err, results) {
          if (err) { return exits.error(err); }
          var output = {
            meta: {
              page: inputs.page,
              total: results.count
            },
            response: results.rows
          };

          
            output.response.forEach(function(device){
              //if (device.lastTotalPf <= 70) {
              //  device.lastTotalPf = 100;
             // }
              //device.lastTimestamp = (new Moment(device.lastTimestamp)).tz(project.timeZoneId).format('YYYY/MM/DD h:mm:ss a');
            });
     
          return exits.success(output);
        });


      }
    });

  }

};
