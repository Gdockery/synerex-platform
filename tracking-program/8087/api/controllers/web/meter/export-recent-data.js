module.exports = {


  friendlyName: 'Get recent meter data for project',


  description: 'Get the most recent reading for every meter in a project.',


  inputs: {

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
    unauthorized: {
      statusCode: 404
    }
  },


  fn: function (inputs, exits) {
    var req = this.req;
    var res = this.res;
    // Make sure that the logged-in user has access to this project.
    if ( req.user.role !== sails.config.constants.USER_ROLES.XECO_ADMIN && !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    res.header('Content-type', 'application/json');

    // Get the SQL queries we need.
    sails.helpers.web.meter.getRecentDataQuery(_.extend({}, inputs, {stream: true})).exec({
      error: exits.error,
      success: function(queries) {

        queries.countQuery.exec(function(err, count) {
          if (err) { return exits.error(err); }

          // Write the start of the JSON response.
          res.write('{"meta":{"count":' + count + '},"response":[');

          // Start streaming
          var page = 0;
          queries.dataQuery.eachBatch(function(batch, next) {
            if (page > 0) { res.write(','); }
            page++;
            res.write(_.map(batch, function(row) { 
              
              return JSON.stringify(row); }).join(','));

            return next();
          }).exec(function(err) {
            if (err) { return exits.error(err); }
            res.write(']}');
            return exits.success();
          });

        });

      }
    });

  }

};
