/**
 * csv/generate15MinuteReport.js
 *
 * @description :: Server-side helper function.
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */
module.exports = {


  friendlyName: 'Generate 15 minute report',


  description: 'Generate and upload a 15 minute report for the parameters.',


  inputs: {

    title: {
      example: 'My 15-minute report.csv',
      description: 'If the .csv extension is not present, it will be added.',
      required: true
    },

    meters: {
      description: 'IDs of meters to use in the report.',
      extendedDescription: 'Must contain at least one meter ID.',
      example: [1],
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

    var uuidV4 = require('uuid/v4');

    var exampleFile = [
      'Xeco 15-minute meter report,,,',
      ',,,',
      'Date,Time,Meter,Data',
      '11/22/13,8:37:30,Meter #1,266.428',
      '11/22/13,8:37:30,Meter #2,243.34',
      '11/22/13,8:37:30,Meter #3,123.53',
      '11/22/13,8:37:30,Meter #4,255.12',
      '11/22/13,8:37:30,Meter #5,109.45'
    ].join('\n');

    var uuid;
    var fileExists = false;
    // var title = inputs.title.replace(/\.csv$/,'') + '.csv';

    do {
      uuid = uuidV4();
      fileExists = StorageService.existsSync('csv/' + uuid)
    } while(fileExists)

    let err = StorageService.writeSync('csv/' + uuid, exampleFile)
    if (err) { return exits.error(err); }
    return exits.success(uuid);

  }


};
