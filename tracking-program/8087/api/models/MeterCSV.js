/**
 * MeterCSV.js
 *
 * @description :: A stored meter data CSV.
 */

module.exports = {

  attributes: {

    // The type of meter CSV report that this record represents.
    // Use a constant from the `sails.config.constants.METER_CSV_TYPES` set.
    reportType: {
      type: 'number',
      required: true
    },

    // The title of the saved CSV report.
    title: {
      type: 'string',
      required: true
    },

    // The UUID of the saved report, used for retrieving a URL from S3.
    uuid: {
      type: 'string',
      required: true
    },

    // The project under which this report was generated.
    project: {
      model: 'project',
      required: true
    },

    // The earliest date represented in the report data.
    fromDate: {
      type: 'number',
      required: true
    },

    // The latest date represented in the report data.
    toDate: {
      type: 'number',
      required: true
    },

    // The power meters represented in the report data.
    meters: {
      collection: 'meter'
    },

    // The users who were emailed the report after it was generated.
    users: {
      collection: 'user'
    }

  },

};

