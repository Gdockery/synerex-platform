module.exports = {


  friendlyName: 'Calculate 15-minute intervals',


  description: 'Given a set of meters, a start time and an end time, calculate any 15-minute interval data in the period.',


  extendedDescription: 'This will output one data row for each 15-minute interval in the given period.',


  inputs: {

    switches: {
      description: 'switch id',
      example: [123],
      required: true
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

    // The data attributes in the MeterData table to rollup on a per-minute basis.
    var MINUTE_SQL = 'SELECT ' +
                      'day, ' +
                      'minute, ' +
                      'intervalId, ' +
                      'switch, ' + 
                      'AVG(' + EquipmentData.schema.totalVolt.columnName + ') as avgVolt, ' +
                      'AVG(' + EquipmentData.schema.totalAmp.columnName + ') as avgAmp, ' +
                      'SUM(' + EquipmentData.schema.totalKw.columnName + ') as totalKw, ' +
                      'SUM(' + EquipmentData.schema.totalKvar.columnName + ') as totalKvar, ' +
                      'SUM(' + EquipmentData.schema.totalKva.columnName + ') as totalKva, ' +
                      'AVG(' + EquipmentData.schema.totalPf.columnName + ') as avgPf, ' +
                      'AVG(' + EquipmentData.schema.totalVoltTHD.columnName + ') as avgVoltTHD, ' +
                      'AVG(' + EquipmentData.schema.totalAmpTHD.columnName + ') as avgAmpTHD, ' +
                      'COUNT(id) as numSamples, ' +
                      'MAX(createdAt) as createdAt, ' +
                      'MAX(recordedAt) as recordedAt ' +
                      'FROM equipmentdata ' +
                      'WHERE switch IN (' + inputs.switches + ') ' + 
                      ' GROUP BY day, minute, intervalId, switch';

    // Begin a SQL query to get aggregate data.  Individual intervals / daily rollups will add
    // criteria to this query.
    var INTERVAL_SQL = 'SELECT ' +
                         'day, ' +
                         'intervalId, ' +
                         'switch, ' +
                         'SUM(numSamples) as numSamples, ' +
                         'MAX(createdAt) as createdAt, ' +
                         'MAX(recordedAt) as recordedAt, ' +
                         'AVG(avgVolt) as avgVolt, ' +
                         'AVG(avgAmp) as avgAmp, ' +
                         'AVG(totalKw) as avgKw, ' +
                         'AVG(totalKva) as avgKva, ' +
                         'AVG(avgPf) as avgPf, ' +
                         'AVG(totalKvar) as avgKvar, ' +
                         'AVG(avgAmpTHD) as avgAmpTHD, ' +
                         'AVG(avgVoltTHD) as avgVoltTHD, ' +
                         'FROM (' + MINUTE_SQL + ') as equipmentdata ' +
                         'GROUP BY day, intervalId '+
                         'ORDER BY MAX(recordedAt) DESC';


    // Run the query to get the aggregate data.
    var query = sails.getDatastore().sendNativeQuery(INTERVAL_SQL);
    if (inputs.dbConnection) {
      query = query.usingConnection(inputs.dbConnection);
    }
    query.exec(function(err, result) {
      if (err) { return exits.error(err); }

        return exits.success(result);
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