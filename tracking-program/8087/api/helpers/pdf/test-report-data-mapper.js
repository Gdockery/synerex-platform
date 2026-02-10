module.exports = {
  friendlyName: 'Test Report Data Mapper',
  description: 'Maps data into PDF generator structure for test reports.',

  inputs: {
    project: {
      type: 'number',
      example: 872,
      required: true,
      description: 'The project ID'
    },
    test: {
      type: 'number',
      example: 7958112,
      required: true,
      description: 'The test ID'
    },
    metersToReport: {
      type: 'ref',
      description: 'Array of meter IDs to include in the report (optional)',
      example: [236345]
    },
    token: {
      type: 'string',
      required: true,
      description: 'The document share token'
    }
  },

  exits: {
    success: {
      description: 'Data mapped successfully',
      outputType: 'ref'
    },
    badRequest: {
      description: 'Invalid input provided',
      responseType: 'badRequest'
    },
    notFound: {
      description: 'Test or project not found',
      responseType: 'notFound'
    },
    forbidden: {
      description: 'Invalid token',
      responseType: 'forbidden'
    },
    error: {
      description: 'An error occurred while mapping data'
    }
  },

  fn: function(inputs, exits) {
    var log = sails.log;
    var Moment = require('moment-timezone');

    log.info('Starting test-report-data-mapper', 'Inputs:', inputs);

    // Validate token
    if (!inputs.token || inputs.token !== 'e83093baa4ced485fc2fde130523d26a') {
      log.warn('Invalid token:', inputs.token);
      return exits.forbidden('Invalid or missing token');
    }

    log.debug('Fetching Xeco and Project data');
    return Promise.all([
      Xeco.find(),
      Project.findOne({ id: inputs.project }).populate('client')
    ])
    .then(function(results) {
      var xecos = results[0];
      var project = results[1];
      log.debug('Xeco count:', xecos.length, 'Project:', project ? 'found' : 'not found');

      if (!xecos.length) {
        throw new Error('No Xeco records found');
      }
      if (!project) {
        log.warn('Project not found:', inputs.project);
        return exits.notFound('Project not found');
      }

      var xeco = xecos[0];
      log.debug('Fetching Test:', inputs.test);
      return Test.findOne({ id: inputs.test })
        .then(function(test) {
          if (!test) {
            log.warn('Test not found:', inputs.test);
            return exits.notFound('Test not found');
          }

          log.debug('Fetching Meters for project:', inputs.project);
          return Meter.find({
            project: inputs.project,
            isDeleted: false,
            isReporting: true
          })
          .select(['id'])
          .then(function(meters) {
            log.debug('Meters found:', meters.length);

            var meterIds = inputs.metersToReport && inputs.metersToReport.length
              ? inputs.metersToReport.toString()
              : meters.map(function(m) { return m.id; }).toString();
            log.debug('Meter IDs:', meterIds);

            log.debug('Calculating test results');
            sails.helpers.web.test.calculateTestResults({
              testId: test.id,
              meters: meterIds
            }).exec(function(err, results) {
              if (err) {
                log.error('Error calculating test results:', err);
                return exits.error(err);
              }
              var determineSegmentInfo = createSegmentInfoCalculator(test);
              var meterIdsArray = _.pluck(meters, 'id');

              log.debug('Fetching meter readings');
              return getMeterReadings(meterIdsArray, test)
                .then(function(meterData) {
                  log.debug('Meter readings retrieved:', meterData.length);
                  var processedData = processBillingData(project, test, results, meterData, determineSegmentInfo);
                  log.debug('Data processed');
                  return exits.success(processedData);
                });
            });
          });
        });
    })
    .catch(function(err) {
      log.error('Error in test-report-data-mapper:', err);
      return exits.error(err);
    });
  }
};

function createSegmentInfoCalculator(test) {
  var segmentTimes = _.map(_.range(0, test.duration / test.interval), function(segNum) {
    return test.startAt + (segNum * test.interval * 60 * 60 * 1000);
  });

  return function(time) {
    for (var i = segmentTimes.length - 1; i >= 0; i--) {
      if (time >= segmentTimes[i]) {
        return {
          segment: (i % 2) + 1,
          cycle: Math.floor(i / 2) + 1,
          xecoSwitchedOn: i % 2
        };
      }
    }
  };
}

function getMeterReadings(meterIds, test) {
  var startTime = test.startAt;
  var endTime = startTime + (test.duration * 60 * 60 * 1000);

  var criteria = {
    and: [
      { meter: meterIds },
      { recordedAt: { '>=': startTime } },
      { recordedAt: { '<': endTime } },
      { totalPf: { '>': 0 } },
      { totalKw: { '>': 0 } },
      { totalKva: { '>': 0 } }
    ]
  };

  return MeterData.find(criteria).populate('meter');
}

function processBillingData(project, test, results, meterData, determineSegmentInfo) {
  var Moment = require('moment-timezone');
  var currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  var numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  var allCharges = [];
  project.electricBillAnalysis.meterBills.forEach(function(bill) {
    if (bill) {
      bill.lineItems.forEach(function(lineItem) {
        allCharges.push(lineItem);
      });
    }
  });

  var pfRatio = project.initialPf / project.lastTotalPf;
  var I2RLossRatio = ((pfRatio * pfRatio - 1) * -1) * (5 / 100);

  var charges = allCharges.map(function(charge) {
    return {
      description: charge.name,
      amount: currencyFormatter.format(charge.cost),
      savings: calculateSavings(charge, results),
      type: charge.type,
      relevant: ['kwh', 'kw', 'x', 'kvar', 'tax'].indexOf(charge.type) !== -1,
      I2RLoss: calculateI2RLoss(charge, results, I2RLossRatio),
      I2RLossSavings: calculateI2RLossSavings(charge, results, I2RLossRatio),
      savingsAmount: calculateSavingsAmount(charge, results),
      meterReading: parseFloat(charge.meterReading) > 1 ? parseFloat(charge.meterReading) : '',
      percentSavings: calculatePercentSavings(charge, results),
      reference: 2
    };
  });

  var totals = charges.reduce(function(acc, charge) {
    return {
      totalSavings: acc.totalSavings + (charge.savings !== '' ? charge.savings : 0),
      totalI2RLossSavings: acc.totalI2RLossSavings + (charge.I2RLossSavings !== '' ? charge.I2RLossSavings : 0)
    };
  }, { totalSavings: 0, totalI2RLossSavings: 0 });

  var actualSavings = totals.totalSavings + totals.totalI2RLossSavings;
  var acutalSavingsPercent = actualSavings / parseFloat(project.electricBillAnalysis.billAmount);

  return {
    test: test,
    result: results,
    project: project,
    acutalSavingsPercent: acutalSavingsPercent,
    actualSavings: currencyFormatter.format(actualSavings),
    billAmount: currencyFormatter.format(project.electricBillAnalysis.billAmount),
    savings: currencyFormatter.format(totals.totalSavings),
    customerCharge: currencyFormatter.format(project.electricBillAnalysis.customerCharge),
    charges: charges,
    testStartAt: Moment.tz(test.startAt, project.timeZoneId).format('MMMM DD, YYYY hh:mm A'),
    testEndAt: Moment.tz(test.endAt || (test.startAt + (test.duration * 60 * 60 * 1000)), project.timeZoneId).format('MMMM DD, YYYY hh:mm A'),
    projectCurrency: project.currencyCode,
    date: Moment.tz(new Moment(), project.timeZoneId).format('MMMM DD, YYYY'),
    reportNumber: project.proposalNumber,
    clientName: project.client.name,
    clientAddress: project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
    clientAccount: project.electricBillAnalysis.accountNumber,
    clientSupplier: project.electricBillAnalysis.electricCompanyName,
    location: project.location,
    preparedFor: project.client.legalName + " \n" + project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
    preparedBy: 'Xeco Energy',
    attn: project.client.contactName + ', ' + project.client.contactTitle,
    testData: _.map(meterData, function(row) {
      return _.extend(row, { name: row.meter.name }, determineSegmentInfo(row.recordedAt));
    })
  };
}

function calculateSavings(charge, results) {
  if (charge.type === "kwh" || charge.type === "tax") {
    return _.round(results.percentSaved.kwh * charge.cost, 2);
  } else if (charge.type === "kw") {
    return _.round(results.percentSaved.kwPeak * charge.cost, 2);
  } else if (charge.type === "x") {
    return _.round(results.percentSaved.powerFactor * -0.032364 * charge.cost, 2);
  }
  return '';
}

function calculateI2RLoss(charge, results, I2RLossRatio) {
  if (charge.type === "kwh") {
    return _.round(results.percentSaved.kwh * parseFloat(charge.meterReading) * I2RLossRatio, 2);
  } else if (charge.type === "kw") {
    return _.round(results.percentSaved.kwPeak * parseFloat(charge.meterReading) * I2RLossRatio, 2);
  }
  return '';
}

function calculateI2RLossSavings(charge, results, I2RLossRatio) {
  if (charge.type === "kwh") {
    return _.round(results.percentSaved.kwh * charge.cost * I2RLossRatio, 2);
  } else if (charge.type === "kw") {
    return _.round(results.percentSaved.kwPeak * charge.cost * I2RLossRatio, 2);
  }
  return '';
}

function calculateSavingsAmount(charge, results) {
  if (charge.type === "kwh" || charge.type === "tax") {
    return _.round(results.percentSaved.kwh * parseFloat(charge.meterReading), 2);
  } else if (charge.type === "kw") {
    return _.round(results.percentSaved.kwPeak * parseFloat(charge.meterReading), 2);
  }
  return '';
}

function calculatePercentSavings(charge, results) {
  if (charge.type === "kwh") {
    return _.round(results.percentSaved.kwh * 100, 2) + '%';
  } else if (charge.type === "kw") {
    return _.round(results.percentSaved.kwPeak * 100, 2) + '%';
  } else if (charge.type === "x") {
    return _.round(results.percentSaved.powerFactor * 0.032364 * 100, 2) + '%';
  }
  return '';
}
