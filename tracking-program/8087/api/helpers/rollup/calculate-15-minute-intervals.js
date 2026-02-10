module.exports = {


  friendlyName: 'Calculate 15-minute intervals',


  description: 'Given a set of meters, a start time and an end time, calculate any 15-minute interval data in the period.',


  extendedDescription: 'This will output one data row for each 15-minute interval in the given period.',


  inputs: {

    meterIds: {
      description: 'An array of meter IDs to get data for.',
      example: [123],
      required: true
    },

    meterDataIdsToExclude: {
      description: 'An array of MeterData row IDs to exclude from the query.',
      example: [123]
    },

    ranges: {
      description: 'An array of time ranges to aggregate.',
      example: [{startTime: 123, endTime: 123}],
      required: true
    },

    dbConnection: {
      example: '===',
      description: 'A database connection to use for queries.',
    }

  },

  fn: function(inputs, exits) {

    // Edge case -- if no ranges are sent in, return an empty array.
    if (inputs.ranges.length === 0) { return exits.success([]); }

    let ranges = cleanUpRanges(inputs.ranges);

    console.log('Original ranges lengh was', inputs.ranges.length)
    console.log('Cleaned up ranges lengh is', ranges.length)

    var RANGE_CRITERIA = _.map(ranges, function(range) {
      return '(recordedAt >= '  + range.startTime + ' AND recordedAt <= ' + range.endTime + ')';
    }).join(' OR ');

//INSERT INTO meterdataaggregate (createdAt, updatedAt, day, intervalId, numSamples, avgVolt, avgAmp, avgKw, avgKva, avgPf, avgKvar, project, intervalStartTime, intervalEndTime) select MAX(createdAt) as createdAt,MAX(updatedAt) as updatedAt, metersum.day as day, intervalId, count(*) as numSamples, AVG(metersum.avgVolt) as avgVolt, avg(metersum.avgAmp)*4 as avgAmp, avg(metersum.avgKw)*4 as avgKw, avg(metersum.avgKva)*4 as avgKva, avg(metersum.avgPf) as avgPf, avg(metersum.avgKvar)*4 as avgKvar, (select project from meter where id = 10) , floor(unix_timestamp(day) * 1000 + (convert(substring(intervalId, 1, 2),decimal) * 15 * 60 *1000)) as intervalStartTime, floor(unix_timestamp(day) * 1000 + (convert(substring(intervalId, 1, 2),decimal) * 15 * 60 *1000 + (14 * 60 * 1000) + (1 * 60 * 999))) as intervalEndTime from (select MAX(createdAt) as createdAt, MAX(updatedAt) as updatedAt, day, intervalId, count(*) as numSamples, avg(totalVolt) as avgVolt, avg(totalAmp) as avgAmp, avg(totalKw) as avgKw, avg(totalKva) as avgKva, avg(totalPf) as avgPf, avg(totalKvar) as avgKvar from meterdata group by meter, minute, intervalId, day) as metersum group by metersum.intervalId, metersum.day;

    // The data attributes in the MeterData table to rollup on a per-minute basis.
    var MINUTE_SQL = 'SELECT ' +
/*
                       'day, ' +
                       'minute, ' +
                       'intervalId, ' +
                       'AVG(' + MeterData.schema.totalVolt.columnName + ') as avgVolt, ' +
                       'AVG(' + MeterData.schema.totalAmp.columnName + ') as avgAmp, ' +
                       'AVG(' + MeterData.schema.totalKw.columnName + ')*' + inputs.meterIds.length + ' as totalKw, ' +
                       'AVG(' + MeterData.schema.totalKvar.columnName + ')*' + inputs.meterIds.length + ' as totalKvar, ' +
                       'AVG(' + MeterData.schema.totalKva.columnName + ')*' + inputs.meterIds.length + ' as totalKva, ' +
                       'AVG(' + MeterData.schema.totalPf.columnName + ') as avgPf, ' +
                       'COUNT(id) as numSamples, ' +
                       'MAX(createdAt) as createdAt, ' +
                       'MAX(recordedAt) as recordedAt ' +*/
'MAX(createdAt) as createdAt,MAX(updatedAt) as updatedAt, MAX(recordedAt) as recordedAt, metersum.day as day, intervalId, count(*) as numSamples, AVG(metersum.avgVolt) as avgVolt, avg(metersum.avgAmp)*' + inputs.meterIds.length + ' as avgAmp, avg(metersum.avgKw)*' + inputs.meterIds.length + ' as totalKw, avg(metersum.avgKva)*' + inputs.meterIds.length + ' as totalKva, avg(metersum.avgPf) as avgPf, avg(metersum.avgKvar)*' + inputs.meterIds.length + ' as totalKvar, (select project from meter where id = 10) , floor(unix_timestamp(day) * 1000 + (convert(substring(intervalId, 1, 2),decimal) * 15 * 60 *1000)) as intervalStartTime, floor(unix_timestamp(day) * 1000 + (convert(substring(intervalId, 1, 2),decimal) * 15 * 60 *1000 + (14 * 60 * 1000) + (1 * 60 * 999))) as intervalEndTime from (select MAX(createdAt) as createdAt, MAX(updatedAt) as updatedAt, MAX(recordedAt) as recordedAt, day, intervalId, count(*) as numSamples, avg(totalVolt) as avgVolt, avg(totalAmp) as avgAmp, avg(totalKw) as avgKw, avg(totalKva) as avgKva, avg(totalPf) as avgPf, avg(totalKvar) as avgKvar, max(minute) as minute ' +
                     'FROM meterdata ' +
                     'WHERE meter IN (' + inputs.meterIds.join(', ') + ') ' +
                     (inputs.meterDataIdsToExclude ? ('AND meterdata.id NOT IN (' + inputs.meterDataIdsToExclude.join(',') + ') ') : '') +
                     'AND (' + RANGE_CRITERIA + ') ' +
//                     'GROUP BY day, minute, intervalId';
		     'group by meter, minute, intervalId, day) as metersum group by metersum.intervalId, metersum.day, metersum.minute';

console.log(MINUTE_SQL);

    // Begin a SQL query to get aggregate data.  Individual intervals / daily rollups will add
    // criteria to this query.
    var INTERVAL_SQL = 'SELECT ' +
                         'day, ' +
                         'intervalId, ' +
                         'SUM(numSamples) as numSamples, ' +
                         'MAX(createdAt) as createdAt, ' +
                         'MAX(recordedAt) as recordedAt, ' +
                         'AVG(avgVolt) as avgVolt, ' +
                         'AVG(avgAmp) as avgAmp, ' +
                         'AVG(totalKw) as avgKw, ' +
                         'AVG(totalKva) as avgKva, ' +
                         'AVG(avgPf) as avgPf, ' +
                         'AVG(totalKvar) as avgKvar ' +
                        'FROM (' + MINUTE_SQL + ') as minuteData ' +
                        'GROUP BY day, intervalId '+
                        'ORDER BY MAX(recordedAt) DESC';

    var INTERVAL_SQL_PER_METER = 'SELECT ' + 
                                  'day, intervalId, COUNT(*) as numSamples, ' +
                                  'MAX(createdAt) as createdAt, ' +
                                  'MAX(recordedAt) as recordedAt, ' +
                                  'meter, AVG(totalVolt) as avgVolt, ' + 
                                  'AVG(totalAmp) as avgAmp, ' + 
                                  'AVG(totalKw) as avgKw, ' + 
                                  'AVG(totalKva) as avgKva, ' +
                                  'AVG(totalPf) as avgPf, ' +
                                  'AVG(totalKvar) as avgKvar ' + 
                                  'FROM meterdata WHERE meter IN (' + inputs.meterIds.join(', ') + ') ' +
                                  'AND (' + RANGE_CRITERIA + ') ' + 
                                  'GROUP BY day, intervalId, meter ORDER BY MAX(recordedAt) DESC';

    // Run the query to get the aggregate data.
    var query = sails.getDatastore().sendNativeQuery(INTERVAL_SQL);
    if (inputs.dbConnection) {
      query = query.usingConnection(inputs.dbConnection);
    }
    query.exec(function(err, result) {
      if (err) { return exits.error(err); }
      var perMeterQuery = sails.getDatastore().sendNativeQuery(INTERVAL_SQL_PER_METER);
      if (inputs.dbConnection) {
        perMeterQuery = perMeterQuery.usingConnection(inputs.dbConnection);
      }
      perMeterQuery.exec(function(err, perMeterResult) {
      if (err) { return exits.error(err); }
        console.log("calculate 15 minute intervals complete *****");
        return exits.success({all: result.rows, perMeter: perMeterResult.rows});
      });
    });

  }

};

function cleanUpRanges(ranges) {
  ranges = _.map(ranges, range => [range.startTime, range.endTime])

  ranges.sort((a, b) => a[0] - b[0])

  let merged = [], current

  ranges.forEach(range => {
    if(!current) {
      current = [range[0], range[1]]
    } else {
      if(range[0] > current[1] + 1) { // start new range
        merged.push(current)
        current = [range[0], range[1]]
      } else { // extend current
        current[1] = range[1]
      }
    }
  })

  if(current) {
    merged.push(current)
  }

  return _.map(merged, range => {
    return {
      startTime: range[0],
      endTime: range[1]
    }
  })
}

