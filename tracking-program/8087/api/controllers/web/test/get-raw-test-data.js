module.exports = {


  friendlyName: 'Get raw test data',


  description: 'Get the minute-by-minute data for each meter included in the test.',


  inputs: {

    id: {
      description: 'The ID of the test to get report data for.',
      example: 123,
      required: true
    },

    page: {
      description: 'Page number to retrieve.',
      example: 1,
      defaultsTo: 1
    },

    showHidden: {
      description: 'Whether or not to show hidden rows.',
      example: true,
      defaultsTo: false
    },

    orderBy: {
      description: 'Column to sort results by.',
      example: 'recordedAt',
      defaultsTo: 'recordedAt'
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
          total: 1
        },
        response: [{
          id: 103,
          hidden: false,
          xecoSwitchedOn: true,
          cycle: 1,
          segment: 2,
          name: 'Meter #103',
          recordedAt: 1385131215000,
          totalVolt: 268.734,
          totalAmp: 410.66,
          totalKw: 266.528,
          totalKva: 330.974,
          totalPf: 0.81,
          totalKvar: 193.904
        }]
      }
    },
    unauthorized: {
      statusCode: 404
    },
    notFound: {
      statusCode: 404
    }
  },

  fn: function (inputs, exits) {
    var req = this.req;

    // Retrieve the test in question.
    Test.findOne({id: inputs.id})
    .populate('switchCommands')
    .exec(function(err, test) {
      if (err) { return exits.error(err);}
      if (!test) { return exits.notFound(); }

      // Make sure that the logged-in user has access to this project.
      if ( !_.find(req.user.projects, {id: test.project} )) {
        return exits.unauthorized();
      }

      // Get the meters in this project.
      // Note that _all_ meters, including deleted ones, will be retrieved, since meters
      // may have been deleted since the test, but if they were reporting data _during_ the test
      // then they weren't deleted at that point!
      Meter.find({project: test.project, isReporting: true}).select(['id']).exec(function(err, meters) {
        if (err) { return exits.error(err);}

        // Get the IDs of all meters to retrieve data for.
        var meterIds = _.pluck(meters, 'id');

        // Create a function to determine which cycle and segment a data point is for,
        // and whether the Xeco unit would have been switched OFF or ON at that point.
        var determineSegmentInfo = (function() {
          // Get an array of all of the times that segments start at.
          var segmentTimes = _.map(_.range(0, test.duration / test.interval), function(segNum) {
            return test.startAt + (segNum * test.interval * 60 * 60 * 1000);
          });
          // Create the actual function.
          return function(time) {
            // Loop through the segment times in reverse, and find the latest one that the given
            // time comes _after_.
            for (var i = segmentTimes.length - 1; i >= 0; i--) {
              if (time >= segmentTimes[i]) {
                var info = {
                  // The segment is either 1 or 2.
                  segment: (i % 2) + 1,
                  // Each cycle has two segments, e.g. for a 10-hour test with intervals of 1 hour,
                  // there are 5 segments.
                  cycle: Math.floor(i / 2) + 1,
                  // The Xeco is switched off in the first segment of a cycle,
                  // and switched on for the second one.
                  xecoSwitchedOn: i % 2
                };
                return info;
              }
            }
          };
        })();

        // Get the start time of the test.
        var startTime = test.startAt;

        // Get the end time of the test.
        var endTime = startTime + (test.duration * 60 * 60 * 1000);

        // Find all relevant meter readings during that period.
        var criteria = { and: [
          {meter: meterIds},
          {recordedAt: {'>=': startTime}},
          {recordedAt: {'<': endTime}},
          //{totalVolt: {'>': 0}},
          //{totalKw: {'>': 0}},
          //{totalKva: {'>': 0}}
        ] };

        // Unless specifically requested, don't show meter readings that were hidden from the test.
        if (inputs.showHidden !== true) {
          criteria.and.push({id: {'nin': test.hiddenMeterDataRowIds || []}});
        }

        async.auto({

          count: function(cb) {
            MeterData.count(criteria).exec(cb);
          },

          rows: function(cb) {
            MeterData.find(criteria)
            .populate('meter')
            .sort([{[inputs.orderBy]: inputs.orderDirection}])
            .skip((inputs.page - 1) * sails.config.constants.DEFAULT_PAGE_SIZE * 10)
            .limit(sails.config.constants.DEFAULT_PAGE_SIZE * 10)
            .exec(cb);
          }

        }, function (err, result) {

          if (err) { return exits.error(err); }

          return exits.success({
            meta: {
              page: inputs.page,
              total: result.count
            },
            response: _.map(result.rows, function(row) {
              row.totalPf = (row.totalKw / row.totalKva * 100);
              return _.extend(row, { name: row.meter.name, hidden: _.contains(test.hiddenMeterDataRowIds, row.id) }, determineSegmentInfo(row.recordedAt) );
            })
          });

        });


      });

    });

  }

};
