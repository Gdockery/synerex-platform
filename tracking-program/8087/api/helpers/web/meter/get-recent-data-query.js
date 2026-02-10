/**
 * meter/get-recent-data.js
 *
 * @description :: Server-side helper function.
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */
module.exports = {


  friendlyName: 'Get recent data SQL',


  description: 'Validate parameters and construct SQL queries for retrieving recent meter data.',


  inputs: {

    page: {
      description: 'Page number to retrieve.',
      example: 1
    },

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

    stream: {
      description: 'Whether or not the data query should use streaming.',
      extendedDescription: 'If `true`, the `.stream()` method will be called instead of `.find()`.',
      example: false,
      defaultsTo: false
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
    },

    limit: {
      description: 'Maximum number of records to return.',
      example: 10
    }

  },


  exits: {
    success: {
      outputExample: {
        dataQuery: '===',
        countQuery: '==='
      }
    }
  },


  fn: function (inputs, exits) {

    var dataQuery = inputs.stream ? Meter.stream() : Meter.find();
    var countQuery = Meter.count();

    // Start the where clause.
    var where = { isDeleted: false, project: inputs.project };

    // Filter by meter name, if provided.
    if (inputs['name']) {
      where.name = { contains: inputs.name };
    } 

    // Filter by numeric fields, if provided.
    _.each(['lastTotalKw', 'lastTotalPf', 'lastTotalVolt', 'lastTotalAmp', 'lastTotalKva', 'lastTotalKvar', 'lastOutputAmp', 'hasSwitch', 'xecoSwitchedOn'], function(col) {
      if (!_.isUndefined(inputs[col])) {
        where[col] = inputs[col];
      }
    });

    dataQuery = dataQuery.where(where);
    countQuery = countQuery.where(where);

    if (inputs.orderBy) {
      // Add the sort clause.
      dataQuery = dataQuery.sort([{[inputs.orderBy]: inputs.orderDirection}]);
    }

    // Add the limit clause.
    if (inputs.limit) {
      dataQuery = dataQuery.limit(inputs.limit);
    }

    // Add the skip clause.
    if (inputs.page > 1) {
      dataQuery = dataQuery.skip((inputs.limit * (inputs.page - 1)));
    }


    return exits.success({
      dataQuery: dataQuery,
      countQuery: countQuery
    });

  }

};
