/**
 * csv/generateDetailedMeterReport.js
 *
 * @description :: Server-side helper function.
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */
module.exports = {


  friendlyName: 'Generate detailed meter report',


  description: 'Generate and upload a detailed meter report for the given parameters.',


  inputs: {

    slug: {
      description: 'The slug of the project under which this report is being created.',
      example: 'abc123',
      required: true
    },

    title: {
      example: 'My detailed meter report.csv',
      description: 'If the .csv extension is not present, it will be added.',
      required: true
    },

    meters: {
      description: 'IDs of meters to use in the report.',
      extendedDescription: 'Must contain at least one meter ID.',
      example: [1],
      required: true
    },

    intervalLength: {
      description: 'The length of interval to group meters by, in minutes.',
      example: 15,
      required: true
    },

    fromDate: {
      description: 'Start date for the report.',
      example: 12345,
      required: true
    },

    toDate: {
      description: 'End date for the report.',
      example: 12345,
      required: true
    }

  },


  exits: {
    success: {
      outputExample: 'e108de91-c1a8-4d31-9171-2ceeec022b47',
      outputDescription: 'The UUID of the uploaded file.'
    }
  },


  fn: function (inputs, exits) {

    const StorageService = require('../../../services/StorageService')

    // Import the UUID module.
    var uuidV4 = require('uuid/v4');

    // Import the Readable stream class.
    var Readable = require('stream').Readable;

    var util = require('util');

    let Moment = require('moment-timezone');

    // Determine the interval length in seconds and milliseconds, for use in the SQL
    var intervalMs = 60 * 1000 * inputs.intervalLength;
    var intervalSec = 60 * inputs.intervalLength;

    var SQL;
    var mergeMeters = 0;

    if (inputs.intervalLength === 365) { //secret way to get meters merged
      mergeMeters = 1;
      intervalMs = 60000;
      intervalSec = 60;
    }

    // If they want minute-by-minute data, get it right out of the db.
    if (inputs.intervalLength === 0) { //secret way to get every line
      SQL = `SELECT
        MeterData.meter as meter,
        Meter.name as meterName,
        CONCAT(DATE_FORMAT(FROM_UNIXTIME(MeterData.recordedAt/ 1000), '%Y-%m-%d %H:'), LPAD(MeterData.minute, 2, '0'), ':00') as fromTime,
        CONCAT(DATE_FORMAT(FROM_UNIXTIME(MeterData.recordedAt/ 1000), '%Y-%m-%d %H:'), LPAD(MeterData.minute, 2, '0'), ':59') as toTime,
        MeterData.l1Volt as l1Volt,
        MeterData.l1Amp as l1Amp,
        MeterData.l1Kw as l1Kw,
        MeterData.l1Kva as l1Kva,
        MeterData.l1Pf as l1Pf,
        MeterData.l1THD as l1THD,
        MeterData.l1Kvar as l1Kvar,
        MeterData.l2Volt as l2Volt,
        MeterData.l2Amp as l2Amp,
        MeterData.l2Kw as l2Kw,
        MeterData.l2Kva as l2Kva,
        MeterData.l2Pf as l2Pf,
        MeterData.l2THD as l2THD,
        MeterData.l2Kvar as l2Kvar,
        MeterData.l3Volt as l3Volt,
        MeterData.l3Amp as l3Amp,
        MeterData.l3Kw as l3Kw,
        MeterData.l3Kva as l3Kva,
        MeterData.l3Pf as l3Pf,
        MeterData.l3THD as l3THD,
        MeterData.l3Kvar as l3Kvar,
        MeterData.totalVolt as totalVolt,
        MeterData.totalAmp as totalAmp,
        MeterData.outputAmp as outputAmp,
        MeterData.totalKw as totalKw,
        MeterData.totalKva as totalKva,
        MeterData.totalPf as totalPf,
        MeterData.totalTHD as totalTHD,
        MeterData.totalKvar as totalKvar,
        Project.timeZoneId as projectTimeZoneId
      FROM meterdata as MeterData
      JOIN meter as Meter ON (MeterData.meter=Meter.id)
      JOIN project as Project ON (Meter.project = Project.id)
      WHERE meter IN ( ${inputs.meters.join(', ')} )
      AND MeterData.recordedAt >= ${inputs.fromDate}
      AND MeterData.recordedAt <= ${inputs.toDate} + 86399000
      ORDER BY fromTime`;
    }
    // Create a SQL statement to get the meter data for the time period and interval length specified.
    else {
      SQL = `SELECT
        max(MeterData.meter) as meter,
        max(Meter.name) as meterName,
        FLOOR((MeterData.recordedAt-${inputs.fromDate})/${intervalMs}) as intervalNum,
        DATE_FORMAT(FROM_UNIXTIME(${inputs.fromDate / 1000} + (FLOOR((recordedAt-${inputs.fromDate})/${intervalMs}) * ${intervalSec})), '%Y-%m-%d %H:%i:%s') as fromTime,
        DATE_FORMAT(FROM_UNIXTIME(${inputs.fromDate / 1000} + (FLOOR((recordedAt-${inputs.fromDate})/${intervalMs}) * ${intervalSec}) + ${intervalSec - 1}), '%Y-%m-%d %H:%i:%s') as toTime, `;

      if (mergeMeters) {
        SQL += `AVG(MeterData.l1Volt) as l1Volt,
          AVG(MeterData.l1Amp)*${inputs.meters.length} as l1Amp,
          AVG(MeterData.l1Kw)*${inputs.meters.length} as l1Kw,
          AVG(MeterData.l1Kva)*${inputs.meters.length} as l1Kva,
          AVG(ABS(MeterData.l1Pf)) as l1Pf,
          COALESCE(AVG(MeterData.l1THD), 0) as l1THD,
          AVG(MeterData.l1Kvar)*${inputs.meters.length} as l1Kvar,
          AVG(MeterData.l2Volt) as l2Volt,
          AVG(MeterData.l2Amp)*${inputs.meters.length} as l2Amp,
          AVG(MeterData.l2Kw)*${inputs.meters.length} as l2Kw,
          AVG(MeterData.l2Kva)*${inputs.meters.length} as l2Kva,
          AVG(ABS(MeterData.l2Pf)) as l2Pf,
          COALESCE(AVG(MeterData.l2THD), 0) as l2THD,
          AVG(MeterData.l2Kvar)*${inputs.meters.length} as l2Kvar,
          AVG(MeterData.l3Volt) as l3Volt,
          AVG(MeterData.l3Amp)*${inputs.meters.length} as l3Amp,
          AVG(MeterData.l3Kw)*${inputs.meters.length} as l3Kw,
          AVG(MeterData.l3Kva)*${inputs.meters.length} as l3Kva,
          AVG(ABS(MeterData.l3Pf)) as l3Pf,
          COALESCE(AVG(MeterData.l3THD), 0) as l3THD,
          AVG(MeterData.l3Kvar)*${inputs.meters.length} as l3Kvar,
          AVG(MeterData.totalVolt) as totalVolt,
          AVG(MeterData.totalAmp)*${inputs.meters.length} as totalAmp,
          AVG(MeterData.outputAmp)*${inputs.meters.length} as outputAmp,
          AVG(MeterData.totalKw)*${inputs.meters.length} as totalKw,
          AVG(MeterData.totalKva)*${inputs.meters.length} as totalKva,
          AVG(MeterData.totalPf) as totalPf,
          COALESCE(AVG(MeterData.totalTHD), 0) as totalTHD,
          AVG(MeterData.totalKvar)*${inputs.meters.length} as totalKvar,
          MAX(MeterData.totalKva)*${inputs.meters.length} as peakKva,
          MAX(MeterData.totalKw)*${inputs.meters.length} as peakKw,
          max(Project.timeZoneId) as projectTimeZoneId
        FROM meterdata as MeterData
        JOIN meter as Meter ON (MeterData.meter=Meter.id)
        JOIN project as Project ON (Meter.project = Project.id)
        WHERE meter IN ( ${inputs.meters.join(', ')} )
        AND MeterData.recordedAt >= ${inputs.fromDate}
        AND MeterData.recordedAt <= ${inputs.toDate} + 86399000
        GROUP BY intervalNum, fromTime, toTime
        ORDER BY intervalNum`;
      } else {
        SQL += `AVG(MeterData.l1Volt) as l1Volt,
          AVG(MeterData.l1Amp) as l1Amp,
          AVG(MeterData.l1Kw) as l1Kw,
          AVG(MeterData.l1Kva) as l1Kva,
          AVG(ABS(MeterData.l1Pf)) as l1Pf,
          COALESCE(AVG(MeterData.l1THD), 0) as l1THD,
          AVG(MeterData.l1Kvar) as l1Kvar,
          AVG(MeterData.l2Volt) as l2Volt,
          AVG(MeterData.l2Amp) as l2Amp,
          AVG(MeterData.l2Kw) as l2Kw,
          AVG(MeterData.l2Kva) as l2Kva,
          AVG(ABS(MeterData.l2Pf)) as l2Pf,
          COALESCE(AVG(MeterData.l2THD), 0) as l2THD,
          AVG(MeterData.l2Kvar) as l2Kvar,
          AVG(MeterData.l3Volt) as l3Volt,
          AVG(MeterData.l3Amp) as l3Amp,
          AVG(MeterData.l3Kw) as l3Kw,
          AVG(MeterData.l3Kva) as l3Kva,
          AVG(ABS(MeterData.l3Pf)) as l3Pf,
          COALESCE(AVG(MeterData.l3THD), 0) as l3THD,
          AVG(MeterData.l3Kvar) as l3Kvar,
          AVG(MeterData.totalVolt) as totalVolt,
          AVG(MeterData.totalAmp) as totalAmp,
          AVG(MeterData.outputAmp) as outputAmp,
          AVG(MeterData.totalKw) as totalKw,
          AVG(MeterData.totalKva) as totalKva,
          AVG(MeterData.totalPf) as totalPf,
          COALESCE(AVG(MeterData.totalTHD), 0) as totalTHD,
          AVG(MeterData.totalKvar) as totalKvar,
          MAX(MeterData.totalKva) as peakKva,
          MAX(MeterData.totalKw) as peakKw,
          max(Project.timeZoneId) as projectTimeZoneId
        FROM meterdata as MeterData
        JOIN meter as Meter ON (MeterData.meter=Meter.id)
        JOIN project as Project ON (Meter.project = Project.id)
        WHERE meter IN ( ${inputs.meters.join(', ')} )
        AND MeterData.recordedAt >= ${inputs.fromDate}
        AND MeterData.recordedAt <= ${inputs.toDate} + 86399000
        GROUP BY meter, intervalNum, fromTime, toTime
        ORDER BY intervalNum`;
      }
    }

    // console.log(SQL);

    // Declare a var to hold the UUID of the new CSV file object on S3
    var uuid;

    // Get a new db connection.
    sails.getDatastore().leaseConnection(function(db, proceed) {

      // Keep trying UUIDs until we find one that hasn't been used already
      var fileExists = false;
      do {
        uuid = uuidV4();
        fileExists = StorageService.existsSync('csv/' + uuid)
      } while(fileExists)

      // Make sure the filename has the CSV extension.
      var filename = inputs.title.replace(/\.csv$/,'') + '\.csv';

      // Query the database and request a stream of the results.
      var dbStream = db.query(SQL).stream({ highWaterMark: 5 });

      // Create a new Readable stream that will transform the results of the db stream.
      var readStream = new (
        (function () {
          function ReadableStream() {
            var self = this;

            // Call the parent class constructor.
            Readable.call(this);

            // When the DB stream is finished, declare this stream tapped out as well.
            dbStream.on('end', function() {
              self.push(null);
            });

            // Start the DB stream in "flowing" mode, and run each row we receive through the "pushRow" function.
            dbStream.on('data', function(data) {
              self.pushRow(data);
            });

            // Push the CSV header into the stream buffer.
            if (inputs.intervalLength === 1) {
                // ADDED outputAmp to header
              this.push('Start Time,End Time,Meter,l1Volt,l1Amp,l1Kw,l1Kva,l1Pf,l1THD,l1Kvar,l2Volt,l2Amp,l2Kw,l2Kva,l2Pf,l2THD,l2Kvar,l3Volt,l3Amp,l3Kw,l3Kva,l3Pf,l3THD,l3Kvar,avgVolt,avgAmp,totalKw,totalKva,avgPf,avgTHD,totalKvar\n');
            } else {
                // ADDED outputAmp to header
              this.push('Start Time,End Time,Meter,l1Volt,l1Amp,l1Kw,l1Kva,l1Pf,l1THD,l1Kvar,l2Volt,l2Amp,l2Kw,l2Kva,l2Pf,l2THD,l2Kvar,l3Volt,l3Amp,l3Kw,l3Kva,l3Pf,l3THD,3Kvar,avgVolt,avgAmp,avgKw,avgKva,avgPf,avgTHD,avgKvar,peakKva,peakKw\n');
            }

          }

	// Transformation function that takes one DB row and turns it into a CSV string.
	ReadableStream.prototype.pushRow = function(row) {
    	let fromTime = new Moment(row.fromTime).tz(row.projectTimeZoneId).format('YYYY-MM-DD HH:mm:ss');
    	let toTime = new Moment(row.toTime).tz(row.projectTimeZoneId).format('YYYY-MM-DD HH:mm:ss');

    	// Helper function to safely round to 2 decimal places
    	const round = (num) => (typeof num === 'number' ? num.toFixed(2) : '0.00');

    	var data = [
         fromTime,
         toTime,
         row.meterName,
         round(row.l1Volt),
         round(row.l1Amp),
         round(row.l1Kw),
         round(row.l1Kva),
         round(row.l1Pf),
         round(row.l1THD),
         round(row.l1Kvar),
         round(row.l2Volt),
         round(row.l2Amp),
         round(row.l2Kw),
         round(row.l2Kva),
         round(row.l2Pf),
         round(row.l2THD),
         round(row.l2Kvar),
         round(row.l3Volt),
         round(row.l3Amp),
         round(row.l3Kw),
         round(row.l3Kva),
         round(row.l3Pf),
         round(row.l3THD),
         round(row.l3Kvar),
         round(row.totalVolt),
         round(row.totalAmp),
         round(row.totalKw),
         round(row.totalKva),
        ];

		// before 11-07-2024 avg pf of power filter was calculated wrong
             var pf1 = row.l1Pf;
             var pf2 = row.l2Pf;
             var pf3 = row.l3Pf;
             if (row.l1Pf < 0) {
                pf1 = 200 + row.l1Pf;
             }
             if (row.l2Pf < 0) {
                pf1 = 200 + row.l2Pf;
             }
             if (row.l3Pf < 0) {
                pf1 = 200 + row.l3Pf;
             }
             var result = (pf1 + pf2 + pf3) / 3;
             if (result > 100) {
                result = 200 - result;
                result = 0 - result;
             }
              correctedPf = result;
              data.push(round(correctedPf));
	      
              data.push(round(row.totalTHD));
              data.push(round(row.totalKvar));
/*	      data.push(row.load1Amp);
	      data.push(row.load2Amp);
	      data.push(row.load3Amp);
	      data.push(row.loadTotalAmp);
	      data.push(row.load1Kva);
	      data.push(row.load2Kva);
	      data.push(row.load3Kva);
	      data.push(row.loadTotalKva);
  */          if (inputs.intervalLength > 1) {
                data.push(round(row.peakKva));
                data.push(round(row.peakKw));
            }

            var str = data.join(',')+'\n';

            // If we get pushback when trying to push this to our buffer, pause the database stream.
            if (!this.push(str)) {
              dbStream.pause();
            }
          };

          // Once whoever's consuming this stream is ready to read, start getting data from the database stream.
          ReadableStream.prototype._read = function() {
            dbStream.resume();
          };

          // Make this a readable stream.
          util.inherits(ReadableStream, Readable);

          // Return the stream class.
          return ReadableStream;
        })()
      )();

      StorageService.writeStream('csv/' + inputs.title + '\.csv', readStream, proceed)
    }, function(err, result) {
      if (err) { return exits.error(err); }
      return exits.success(uuid);
    });
  }
};
