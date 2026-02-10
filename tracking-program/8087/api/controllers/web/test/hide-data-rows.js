module.exports = {


  friendlyName: 'Hide data rows',


  description: 'Hide one or more rows of data from a test.',


  extendedDescription: 'This will cause the test report to be recalculated.',


  inputs: {

    id: {
      description: 'The ID of the test to hide data rows for.',
      example: 123,
      required: true
    },

    rowIds: {
      description: 'The IDs of the meter data rows to hide.',
      example: [1],
      required: true
    }

  },


  exits: {
    unauthorized: {
      statusCode: 404
    },
    invalidRowIds: {
      statusCode: 400,
      description: 'One or more of the provided row IDs are not valid for the given test.'
    }
  },


  fn: function (inputs, exits) {
    var req = this.req;

    // Retrieve the test in question.
    Test.findOne({id: inputs.id})
    .exec(function(err, test) {
      if (err) { return exits.error(err);}
      if (!test) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: test.project} )) {
        return exits.unauthorized();
      }

      MeterData.find({id: inputs.rowIds})
      .populate('meter')
      .exec(function(err, rows) {
        if (err) { return exits.error(err);}
        if (rows.length !== inputs.rowIds.length) {
          return exits.invalidRowIds();
        }

        // Get the start time of the test.
        var startTime = test.startAt;

        // Get the end time of the test.
        var endTime = startTime + (test.duration * 60 * 60 * 1000);

        // If any of the data rows are for meters in another project, or are outside of the time period
        // of the test, return an error.
        if (_.any(rows, function(row) {
          return row.meter.project !== test.project || row.recordedAt < startTime || row.recordedAt >= endTime;
        })) {
          return exits.invalidRowIds();
        }

        // Update the `hiddenMeterDataRowIds` for the test.
        var hiddenMeterDataRowIds = _.uniq(test.hiddenMeterDataRowIds.concat(inputs.rowIds));

        sails.getDatastore().transaction(function (db, proceed){

          // Update the Test record with the new hidden rows, also clearing out the reportData JSON field
          // so that the next time the report data is requested it will be recalculated.
          Test.update({ id: inputs.testId }, {hiddenMeterDataRowIds: hiddenMeterDataRowIds})
          .usingConnection(db)
          .exec(function(err) {
            if (err) { return proceed(err);}
            sails.helpers.web.test.calculateTestResults({
              testId: inputs.id,
              dbConnection: db
            }).exec(proceed);
          });
        }).exec(function(err, output) {
          if (err) { return exits.error(err); }
          return exits.success(output);
        });

      });

    });

  }


};
