module.exports = {

  friendlyName: 'Process meter device data',

  inputs: {

    projectSlug: {
      description: 'The slug of the project for which this message was intended.',
      example: 'abc123'
    },

    meshId: {
      example: 'ff:ff:ff:ff:ff:ff'
    },

    meterSerialNumber: {
      example: 'p37103421'
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
    Meter.find({ meshId: inputs.meshId, isDeleted: false }).populate('project').exec(function(err, meters) {
 
      if (err) {
        return exits.error(err);
      }
      if (!meters.length) {
        sails.log.error('Error trying to process data from meter w/ mesh ID `' + inputs.meshId + '`: could not find an active meter with that mesh ID.');
        return exits.success();
      }
      if (meters.length > 1) {
        sails.log.error('Warning: when trying to process data from meter w/ mesh ID `' + inputs.meshId + '`, multiple meters were found.  Using the first...');
      }
      if (meters[0].project.slug !== inputs.projectSlug) {
        sails.log.error('Error trying to process data from meter w/ mesh ID `' + inputs.meshId + '`: project slug in topic (`' + inputs.projectSlug + '`) does not match that of meter\'s project (`' + meters[0].project.slug + '`).');
        return exits.success();
      }

      var meter = meters[0];

      // Start the MeterData dictionary.
      var data = {
        meshId: inputs.meshId,
        recordedAt: recordedAt
      };

      // If we found a known meter, store it with the data as well as the
      // day, minute and interval ID when the data was recorded (which we
      // need a specific timezone for).
      if (meter) {
        data.meter = meter.id;

        // Get the time-zone adjusted moment that the recording was taken.
        var recordedAtMoment = (new Moment(recordedAt)).tz(meter.project.timeZoneId);
        // Get the day of the recording.
        data.day = recordedAtMoment.format('YYYY-MM-DD') || '';
        // Get the interval ID of the recording.
        data.intervalId = sails.helpers.util.getIntervalFromMoment({moment: recordedAtMoment}).execSync() || '';
        // Get the minute of the recording.
        data.minute = recordedAtMoment.minute() || 0;

      }

      var LAST_RECORD = 'SELECT * FROM ' + MeterData.tableName + ' WHERE ' + MeterData.schema.meter.columnName + 
                              ' = ' + meter.id + ' ORDER BY ' + MeterData.schema.recordedAt.columnName + ' DESC limit 1';

      datastore.sendNativeQuery(LAST_RECORD).exec(function(err, result) {
        if (result.rows.length > 0){
          var lastRecord = result.rows[0];
          if (lastRecord.day == data.day && lastRecord.intervalId == data.intervalId && lastRecord.minute == data.minute) {
            console.log("found fake record inserted before real data");
            MeterData.destroy({
              id: lastRecord.id
            }).exec(function(err) {

              if (err) { return exits.error(err); } 
              console.log("deleted fake meterData", lastRecord.id);
            });
          }
        }
      // Start the Meter update dictionary.
        var meterUpdate = {
          lastCommunicatedAt: current,
          meshLastCommunicatedAt: current,
          meterSerialNumber: inputs.meterSerialNumber
        };

        var fns = {
          sum: _.sum,
          div1000: function(vals) { return _.sum(vals) / 1000; },
          avg: function(vals) { return _.sum(vals) / vals.length; },
          avg100: function(vals) { return (_.sum(vals) * 100) / vals.length; },
          toPercent: function(vals) { return _.sum(vals) * 100; },
          multiply: function(vals) { return _.sum(vals) * 100; },
          avgPF: function(vals) {
	     console.log(vals);
	     var pf1 = vals[0];
	     var pf2 = vals[1];
	     var pf3 = vals[2]; 
	     if (vals[0] < 0) {
	        console.log(vals[0]);
		pf1 = 200 + vals[0];
	     }
	     if (vals[1] < 0) {
	        console.log(vals[1]);
		pf2 = 200 + vals[1];
	     }
	     if (vals[2] < 0) {
	        console.log(vals[2]);
		pf3 = 200 + vals[2];
	     }
	     var result = (pf1 + pf2 + pf3) / 3;
	     if (result > 100) {
		result = 200 - result;
		result = 0 - result;
	     }
	     return result;
	  },
        };
       console.log("meter.id=",meter.id);
       console.log("meter.isSub=",meter.isSub);
       console.log("meter.isFilter=",meter.isFilter);
       if (meter.isSub == 0 && meter.isFilter == 0) {
	console.log("isSub == 0");
        // Marshall the incoming data into the appropriate fields for the Meter and MeterData models.
        _.each(
          {
           'l1Volt': 1160,
           'l2Volt': 1162,
           'l3Volt': 1164,
           'totalVolt': { fn: 'avg', registers: [1160, 1162, 1164] },
           'l1Amp': 1144,
           'l2Amp': 1146,
           'l3Amp': 1148,
           'totalAmp': { fn: 'avg', registers: [1144, 1146, 1148] },
           'l1Kw': 1170,
           'l2Kw': 1172,
           'l3Kw': 1174,
           'totalKw': { fn: 'sum', registers: [1170, 1172, 1174] },
           'l1Kva': 1178,
           'l2Kva': 1180,
           'l3Kva': 1182,
           'totalKva': { fn: 'sum', registers: [1178, 1180, 1182] },
           'l1Pf': 2302,
           'l2Pf': 2304,
           'l3Pf': 2306,
           'totalPf': { fn: 'avgPF', registers: [2302, 2304, 2306] },
           'l1Kvar': 1186,
           'l2Kvar': 1188,
           'l3Kvar': 1190,
           'totalKvar': { fn: 'sum', registers: [1186, 1188, 1190] },
           'l1THD': 9001,
           'l2THD': 9002,
           'l3THD': 9003,
           'totalTHD': { fn: 'avg', registers: [9001, 9002, 9003] },
          },

          function(source, modelField) {

            var val;
            if (_.isObject(source)) {
              val = fns[source.fn](_.map(source.registers, function(register) { return inputs.payload[register]; }));
            } else {
              val = inputs.payload[source];
            }

            // The Meter model contains a cached version of the last known values for each of the fields, prefixed by `last`.
            meterUpdate['last' + modelField[0].toUpperCase() + modelField.substr(1)] = val;

            // The MeterData model contains exactly the fields that were sent in the payload.
            // add the last meterdata timestamp to meter table so front end can see if meter time is synchronized
            
            
            data[modelField] = val;

          }
        );
       } else if (meter.isFilter) {
	console.log("isFilter == 1");
        // Marshall the incoming data into the appropriate fields for the Meter and MeterData models.
        _.each(
          {
           'l1Volt': 1160,
           'l2Volt': 1162,
           'l3Volt': 1164,
           'totalVolt': { fn: 'avg', registers: [1160, 1162, 1164] },
           'l1Amp': 1144,
           'l2Amp': 1146,
           'l3Amp': 1148,
           'totalAmp': { fn: 'avg', registers: [1144, 1146, 1148] },
           'l1Kw': 1170,
           'l2Kw': 1172,
           'l3Kw': 1174,
           'totalKw': { fn: 'sum', registers: [1170, 1172, 1174] },
           /*'l1Kw': { fn: 'div1000', registers: [1170] },
           'l2Kw': { fn: 'div1000', registers: [1172] },
           'l3Kw': { fn: 'div1000', registers: [1174] },
           'totalKw': { fn: 'div1000', registers: [1170, 1172, 1174] },*/
           'l1Kva': 1178,
           'l2Kva': 1180,
           'l3Kva': 1182,
           'totalKva': { fn: 'sum', registers: [1178, 1180, 1182] },
           'l1Pf': 2302,
           'l2Pf': 2304,
           'l3Pf': 2306,
           'totalPf': { fn: 'avgPF', registers: [2302, 2304, 2306] },
           'l1Kvar': 1186,
           'l2Kvar': 1188,
           'l3Kvar': 1190,
           'totalKvar': { fn: 'sum', registers: [1186, 1188, 1190] },
           'l1THD': 2326,
           'l2THD': 2328,
           'l3THD': 2330,
           'totalTHD': { fn: 'avg', registers: [2326, 2328, 2330] },
           'outputAmp': { fn: 'sum', registers: [3040, 3041, 3042] },
          },

          function(source, modelField) {

            var val;
            if (_.isObject(source)) {
              val = fns[source.fn](_.map(source.registers, function(register) { return inputs.payload[register]; }));
            } else {
              val = inputs.payload[source];
            }

            // The Meter model contains a cached version of the last known values for each of the fields, prefixed by `last`.
            meterUpdate['last' + modelField[0].toUpperCase() + modelField.substr(1)] = val;

            // The MeterData model contains exactly the fields that were sent in the payload.
            // add the last meterdata timestamp to meter table so front end can see if meter time is synchronized
            
            
            data[modelField] = val;

          }
	 );
       } else {
	 console.log("isFilter == 0, isSub == 0");
        // Marshall the incoming data into the appropriate fields for the Meter and MeterData models.
        _.each(
          {
           'l1Volt': 1160,
           'l2Volt': 1162,
           'l3Volt': 1164,
           'totalVolt': { fn: 'avg', registers: [1160, 1162, 1164] },
           'l1Amp': 1144,
           'l2Amp': 1146,
           'l3Amp': 1148,
           'totalAmp': { fn: 'avg', registers: [1144, 1146, 1148] },
           'l1Kw': { fn: 'div1000', registers: [1170] },
           'l2Kw': { fn: 'div1000', registers: [1172] },
           'l3Kw': { fn: 'div1000', registers: [1174] },
           'totalKw': { fn: 'div1000', registers: [1170, 1172, 1174] },
           'l1Kva': 1178,
           'l2Kva': 1180,
           'l3Kva': 1182,
           'totalKva': { fn: 'sum', registers: [1178, 1180, 1182] },
           'l1Pf': { fn: 'avg100', registers:[1194] },
           'l2Pf': { fn: 'avg100', registers:[1196] },
           'l3Pf': { fn: 'avg100', registers:[1198] },
           'totalPf': { fn: 'avg100', registers: [1194, 1196, 1198] },
           'l1Kvar': 1186,
           'l2Kvar': 1188,
           'l3Kvar': 1190,
           'totalKvar': { fn: 'sum', registers: [1186, 1188, 1190] },
           'l1THD': 2326,
           'l2THD': 2328,
           'l3THD': 2330,
           'totalTHD': { fn: 'avg', registers: [2326, 2328, 2330] },
          },

          function(source, modelField) {

            var val;
            if (_.isObject(source)) {
              val = fns[source.fn](_.map(source.registers, function(register) { return inputs.payload[register]; }));
            } else {
              val = inputs.payload[source];
            }

            // The Meter model contains a cached version of the last known values for each of the fields, prefixed by `last`.
            meterUpdate['last' + modelField[0].toUpperCase() + modelField.substr(1)] = val;

            // The MeterData model contains exactly the fields that were sent in the payload.
            // add the last meterdata timestamp to meter table so front end can see if meter time is synchronized
            
            
            data[modelField] = val;

          }
	 );
	}

        meterUpdate.lastTimestamp = recordedAt;

        data.rawData = JSON.stringify(inputs.payload);
        console.log("meter processor: ", data);

        datastore.transaction(function(db, proceed) {

          // Create an INSERT IGNORE statement for adding meter data, so that duplicate rows will be ignored.
          var METER_DATA_SQL = 'INSERT IGNORE into ' + MeterData.tableName + ' SET ' +
                               _.reduce(data, function(memo, val, key) { return memo.concat(key + '=\'' + val + '\''); }, []).join(', ');

          METER_DATA_SQL += ' ,createdAt = ' + now.valueOf() + ', updatedAt = ' + now.valueOf();
          datastore.sendNativeQuery(METER_DATA_SQL).usingConnection(db).exec(function(err, result) {
            if (err) { return proceed(err); }
            //console.log("real meter data recorded", result);
            // If something was actually inserted, and we found a matching meter in the database,
            // then update the Meter record.
            if (result.affectedRows > 0 && meter) {
              Meter.update({id: meter.id}, meterUpdate).usingConnection(db).exec(proceed);
             // console.log("updated meter", meter.id);
              return;
            }

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
