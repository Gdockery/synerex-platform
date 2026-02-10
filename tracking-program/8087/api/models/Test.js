/**
 * Test.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // The project that this switch command belongs to.
    project: {
      model: 'Project',
      required: true
    },

    // The switch commands that this test is using.
    switchCommands: {
      collection: 'SwitchCommand',
      via: 'test'
    },

    // The time to schedule the test for.
    startAt: {
      type: 'number',
      required: true
    },

    // The time that the test should be completed.
    // Useful for looking up which tests might have recently completed,
    // so that the automatic process can calculate the results.
    endAt: {
      type: 'number',
      required: true
    },

    // The length of time for the test to run, in hours.
    duration: {
      type: 'number'
    },

    // The interval between toggling the switches, in hours.
    interval: {
      type: 'number'
    },

    // Array of meter data row IDs to suppress from the report.
    hiddenMeterDataRowIds: {
      type: 'json',
      defaultsTo: null
    },

    // The report data for a completed test.
    reportData: {
      type: 'json',
      defaultsTo: null
    },

    // Whether or not this test has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    gateways: {
      collection: 'gateway',
      via: 'tests'
    },

    allswitchesset: {
	type: 'json',
	defaultsTo: null
    },

    // Whether this is a static test (results should not be recalculated).
    isStatic: {
      type: 'number',
      defaultsTo: 0
    }

  },

};

