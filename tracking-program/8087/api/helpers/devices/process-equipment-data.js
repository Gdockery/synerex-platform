module.exports = {

  friendlyName: 'Process sensor device data',

  inputs: {

    projectSlug: {
      description: 'The slug of the project for which this message was intended.',
      example: 'abc123'
    },

    meshId: {
      example: 'ff:ff:ff:ff:ff:ff'
    },

    payload: {
      example: {}
    }

  },

  fn: function (inputs, exits) {

    var Moment = require('moment-timezone');
    var datastore = sails.getDatastore();
    var now = new Moment();
    var current = new Date().getTime();

    // Get the time that the device reported as `recordedAt` and transform it to a JS timestamp.
    // TODO -- lock this down so that only one of `timestamp` or `recordedAt` needs to be checked.
    var recordedAt = (inputs.payload.recordedAt || inputs.payload.timestamp) * 1000;

    // Look up the switch with the given mesh ID and verify that it is current and belongs to the specified project.
    Switch.find({ meshId: inputs.meshId, isDeleted: false, deviceType: 2 }).populate('project').exec(function(err, switches) {
      console.log("here 0")
      if (err) {
        return exits.error(err);
      }
      if (!switches.length) {
        sails.log.error('Error trying to process equipment data from meter w/ mesh ID `' + inputs.meshId + '`: could not find an active meter with that mesh ID.');
        return exits.success();
      }
      if (switches.length > 1) {
        sails.log.error('Warning: when trying to process equipment data from meter w/ mesh ID `' + inputs.meshId + '`, multiple meters were found.  Using the first...');
      }
      if (switches[0].project.slug !== inputs.projectSlug) {
        sails.log.error('Error trying to process data from meter w/ mesh ID `' + inputs.meshId + '`: project slug in topic (`' + inputs.projectSlug + '`) does not match that of meter\'s project (`' + switches[0].project.slug + '`).');
        return exits.success();
      }

      var sw = switches[0];

      // Start the MeterData dictionary.
      var data = {
        recordedAt: recordedAt
      };

      // If we found a known meter, store it with the data as well as the
      // day, minute and interval ID when the data was recorded (which we
      // need a specific timezone for).
      if (sw) {
        data.switch = sw.id;

        // Get the time-zone adjusted moment that the recording was taken.
        var recordedAtMoment = (new Moment(recordedAt)).tz(sw.project.timeZoneId);
        // Get the day of the recording.
        data.day = recordedAtMoment.format('YYYY-MM-DD') || '';
        // Get the interval ID of the recording.
        data.intervalId = sails.helpers.util.getIntervalFromMoment({moment: recordedAtMoment}).execSync() || '';
        // Get the minute of the recording.
        data.minute = recordedAtMoment.minute() || 0;

      }

      var LAST_RECORD = 'SELECT * FROM ' + EquipmentData.tableName + ' WHERE ' + EquipmentData.schema.switch.columnName + 
                              ' = ' + sw.id + ' ORDER BY ' + EquipmentData.schema.recordedAt.columnName + ' DESC limit 1';

      datastore.sendNativeQuery(LAST_RECORD).exec(function(err, result) {
          if (result.rows.length != 0) {
            var lastRecord = result.rows[0];
            if (lastRecord.day == data.day && lastRecord.intervalId == data.intervalId && lastRecord.minute == data.minute) {
              console.log("found fake record inserted before real data");
              EquipmentData.destroy({
                id: lastRecord.id
              }).exec(function(err) {

                if (err) { return exits.error(err); } 
                console.log("deleted fake equipmentData", lastRecord.id);
              });
            }
          } 
      // Start the Meter update dictionary.
   

        var fns = {
          sum: _.sum,
          avg: function(vals) { return _.sum(vals) / vals.length; }
        };

        // Marshall the incoming data into the appropriate fields for the Meter and MeterData models.
        _.each(
          {
           'l1Volt': 4018,
           'l2Volt': 4019,
           'l3Volt': 4020,
           'totalVolt': { fn: 'avg', registers: [4018, 4019, 4020] },
           'l1Amp': 4055,
           'l2Amp': 4056,
           'l3Amp': 4057,
           'totalAmp': { fn: 'avg', registers: [4055, 4056, 4057] },
           'l1Kw': 4028,
           'l2Kw': 4029,
           'l3Kw': 4030,
           'totalKw': { fn: 'sum', registers: [4028, 4029, 4030] },
           'l1Kva': 4046,
           'l2Kva': 4047,
           'l3Kva': 4048,
           'totalKva': { fn: 'sum', registers: [4046, 4047, 4048] },
           'l1Pf': 4052,
           'l2Pf': 4053,
           'l3Pf': 4054,
           'totalPf': { fn: 'avg', registers: [4052, 4053, 4054] },
           'l1Kvar': 4037,
           'l2Kvar': 4038,
           'l3Kvar': 4039,
           'totalKvar': { fn: 'sum', registers: [4037, 4038, 4039] },
           'l1VoltTHD': 9001,
           'l2VoltTHD': 9002,
           'l3VoltTHD': 9003,
           'totalVoltTHD': { fn: 'avg', registers: [9001, 9002, 9003] },
           'l1AmpTHD': 9004,
           'l2AmpTHD': 9005,
           'l3AmpTHD': 9006,
           'totalAmpTHD': { fn: 'avg', registers: [9004, 9005, 9006] },
          },

          function(source, modelField) {

            var val;
            if (_.isObject(source)) {
              val = fns[source.fn](_.map(source.registers, function(register) { return inputs.payload[register]; }));
            } else {
              val = inputs.payload[source];
            }

            // The Meter model contains a cached version of the last known values for each of the fields, prefixed by `last`.

            // The MeterData model contains exactly the fields that were sent in the payload.
            // add the last meterdata timestamp to meter table so front end can see if meter time is synchronized
            
            
            data[modelField] = val;

          }
        );
    

        datastore.transaction(function(db, proceed) {

          // Create an INSERT IGNORE statement for adding meter data, so that duplicate rows will be ignored.
          var METER_DATA_SQL = 'INSERT IGNORE into ' + EquipmentData.tableName + ' SET ' +
                               _.reduce(data, function(memo, val, key) { return memo.concat(key + '=\'' + val + '\''); }, []).join(', ');

          METER_DATA_SQL += ' ,createdAt = ' + now.valueOf() + ', updatedAt = ' + now.valueOf();
          datastore.sendNativeQuery(METER_DATA_SQL).usingConnection(db).exec(function(err, result) {
            if (err) { return proceed(err); }
        
            // If something was actually inserted, and we found a matching meter in the database,
            // then update the Meter record.
          
            // Otherwise just return.
            return proceed();
          });

        }, function(err) {
          if (err) { return exits.error(err); }

          // Return through the "success" exit.
          return exits.success();
        });
      });
    });
  }
};
