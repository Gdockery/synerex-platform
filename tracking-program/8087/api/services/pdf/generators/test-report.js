var PdfPrinter = require('pdfmake');
var moment = require('moment-timezone');

module.exports = function (printer) {
  const gray = '#868686',
    lightGrayBG = '#d9d9d9',
    darkGrayBg = '#808080',
    white = '#FFFFFF',
    offColor = '#00b0f0',
    onColor = '#45f545',
    green = '#006411',
    blueBG = '#00b0f0',
    xecoSavingsColor = '#1ac44a',
    noBordersCell = [false, false, false, false];

  return {
    generate: function (data, logoPath, brandName) {
      brandName = brandName || 'Synerex'; // Default fallback
      var log = sails.log;
      try {
        log.info('Starting test-report generation', 'Test ID:', data.test && data.test.id, 'Meter count:', data.testData && data.testData.length);

        log.debug('Building test cycles');
        var testCycles = getTestCycles(data.result.cycles, data.project.timeZoneId);
        log.debug('Test cycles built:', testCycles.length, 'rows');

        log.debug('Building charges rows');
        var chargesRows = getChargesRows(data.charges);
        log.debug('Charges rows built:', chargesRows.length);

        log.debug('Building test data rows');
        var testDataRows = getTestDataRows(data.testData, data.project.timeZoneId);
        log.debug('Processing test data, total records:', data.testData.length, 'Limited to:', testDataRows.length);
        log.debug('Test data rows built:', testDataRows.length);

        let docDefinition = {
          pageMargins: [50, 100, 50, 50],
          header: function (page) {
            return {
              margin: [50, 35, 50, 50],
              alignment: 'center',
              columns: [
                {
                  width: '*',
                  columns: [{
                    margin: [-150, 0, 0, 0],
                    image: logoPath,
                    width: 100,
                  }]
                },
                {
                  width: '*',
                  margin: [0, 0, 0, 0],
                  text: ' ',
                }
              ]
            };
          },
          footer: function (page) {
            return {
              margin: [50, 20, 50, 0],
              layout: 'noBorders',
              table: {
                widths: ['*', '*', '*'],
                body: [
                  [
                    {
                      text: [
                        'Prepared by ',
                        {
                          text: brandName + ' Energy Corporation',
                          style: {
                            bold: true
                          }
                        }
                      ],
                    },
                    {
                      text: 'Comprehensive Test Report',
                      style: {
                        bold: true,
                        alignment: 'center'
                      }
                    },
                    {
                      text: ``,
                      style: {
                        alignment: 'right',
                      }
                    }
                  ]
                ],
              },
              style: {
                fontSize: 6
              }
            };
          },
          content: [
            //------------------ SUMMARY CONCLUSION FROM ELECTRIC BILL ANALYSIS ------------------
            {
              margin: [0, 10, 0, 0],
              table: {
                widths: [0, '*', '*', 120, 70],
                body: [
                  [
                    {
                      border: noBordersCell,
                      text: `Facility Engineering Report as of ${data.date}`,
                      colSpan: 5,
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 10
                      }
                    },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' }
                  ],
                ],
              },
              style: {
                fontSize: 8
              },
            },
            {
              margin: [0, 10, 0, 0],
              layout: 'noBorders',
              width: '100%',
              table: {
                widths: [170, '*', 100],
                body: [
                  [
                    {
                      text: `Report Prepared For:`,
                      style: {
                        alignment: 'right',
                      }
                    },
                    {
                      margin: [-5, 0, 0, 0],
                      text: data.clientName,
                    },
                    {
                      text: ``,
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    }
                  ],
                  [
                    { text: '', },
                    {
                      margin: [-5, -2, 0, 0],
                      text: data.clientAddress.split('\n')[0],
                    },
                    { text: '', }
                  ],
                  [
                    { text: ``, },
                    {
                      margin: [-5, -2, 0, 0],
                      text: data.clientAddress.split('\n')[1],
                    },
                    { text: '', }
                  ]
                ],
              },
              style: {
                fontSize: 8,
                bold: true
              },
            },
            {
              margin: [0, 10, 0, 0],
              table: {
                widths: ['*', '*', '*', 140, '*'],
                body: [
                  [
                    {
                      border: noBordersCell,
                      text: `Facility Location: ${data.location}         Test Period: Start: ${data.testStartAt} End: ${data.testEndAt}`,
                      colSpan: 5,
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        color: 'black',
                        fontSize: 5
                      }
                    },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' }
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: `Power Quality Test Equipment`,
                      colSpan: 5,
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 8
                      }
                    },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' }
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: 'Identified Equipment:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    { border: noBordersCell, text: 'Switchgear 1' },
                    { border: noBordersCell, text: '' },
                    {
                      text: 'Table Sub-Meter Parameters:',
                      colSpan: 2,
                      style: {
                        alignment: 'right',
                        bold: true,
                        fontSize: 7
                      }
                    },
                    { border: noBordersCell, text: '' }
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: 'Power Test Equipment',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: 'DENT PowerScout 3HD Meter',
                      colSpan: 2,
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Power Channels:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '3-wire',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: 'Current Transformer Type:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: 'CT Type = RoCoil; Phase Shift = 0:000',
                      colSpan: 2,
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Line Frequency:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '60 Hz/Cycle',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    { border: noBordersCell, text: '', },
                    {
                      border: noBordersCell,
                      text: '-Power: Vhi: L1, Vlo: N; PT = 1.000; CT=5000.000',
                      colSpan: 2,
                      style: {
                        alignment: 'left',
                        fontSize: 5
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Integration Period:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '1-Sec. Cycle',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    { border: noBordersCell, text: '', },
                    {
                      border: noBordersCell,
                      text: '-Power: Vhi: L2, Vlo: N; PT = 1.000; CT=5000.000',
                      colSpan: 2,
                      style: {
                        alignment: 'left',
                        fontSize: 5
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Peak Demand Minutes:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '1-Minute',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    { border: noBordersCell, text: '', },
                    {
                      border: noBordersCell,
                      text: '-Power: Vhi: L3, Vlo: N; PT = 1.000; CT=5000.000',
                      colSpan: 2,
                      style: {
                        alignment: 'left',
                        fontSize: 5
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Test Time Duration (XPS Off/On):',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '1-Hour',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: 'Accuracy:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '0.2% (<0.1% typical) ANSI C12.20-2010 Class 0.2',
                      colSpan: 2,
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Equipment Switching (XPS Off/On):',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: 'CMS Portal',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: 'Waveform Sampling:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: '200 samples/60Hz waveform, 2 waveforms/second',
                      colSpan: 3,
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Firmware Version:',
                      style: {
                        alignment: 'right',
                        decoration: 'underline',
                        fontSize: 6
                      }
                    },
                    {
                      border: noBordersCell,
                      text: 'ES400.226',
                      style: {
                        alignment: 'left',
                        fontSize: 6
                      }
                    },
                  ],
                  [
                    {
                      border: noBordersCell,
                      text: `POWER QUALITY TESTING & INSPECTIONS OF ELECTRICITY CONSUMPTION TAKEN FROM IDENTIFIED ELECTRICAL EQUIPMENT AND SWITCH GEAR`,
                      colSpan: 5,
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 8
                      }
                    },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' }
                  ],
                ],
              },
              style: {
                fontSize: 9
              },
              //pagebreak: 'after',
            },
            {
              pageOrientation: 'landscape',
              pageBreak: 'after',
              margin: [0, 0, 0, 0],
              width: '100%',
              table: {
                widths: ['*', '*', '*', '*', '*', '*', '*', '*'],
                body: [
                  ...getTestCycles(data.result.cycles, data.project.timeZoneId),
                  [
                    {
                      margin: [0, 20, 0, 0],
                      border: noBordersCell,
                      text: '',
                      colSpan: 8,
                    },
                    { text: '', },
                    { text: 'Timestamp', },
                    { text: 'From: ', },
                    { text: '', },
                    { text: 'Thru', },
                    { text: '', },
                    { text: '', },
                  ],
                  [
                    {
                      text: 'Total Operational Savings',
                      colSpan: 8,
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: '#1ac44a',
                        color: 'white',
                        fontSize: 7
                      }
                    },
                    { text: '', },
                    { text: 'Timestamp', },
                    { text: 'From: ', },
                    { text: '', },
                    { text: 'Thru', },
                    { text: '', },
                    { text: '', },
                  ],
                  [
                    {
                      text: 'Test Cycle',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: '',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Timestamp',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: 'From: ',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: moment.tz(data.result.startedAt, data.project.timeZoneId).format('MMM DD, YYYY hh:mm A'),
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Thru',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: moment.tz(data.result.endAt, data.project.timeZoneId).format('MMM DD, YYYY hh:mm A'),
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                    {
                      text: '',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 5
                      }
                    },
                  ],
                  [
                    {
                      text: 'Total',
                      rowSpan: 4,
                      style: {
                        alignment: 'center',
                        fontSize: 14
                      }
                    },
                    {
                      text: '2-Hours',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Kw Peak',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Power Factor(%)',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Kvar',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Avg 15 Min Interval',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                    {
                      text: 'kWh',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                    {
                      text: 'Synerex',
                      style: {
                        alignment: 'center',
                        fillColor: lightGrayBG,
                        fontSize: 5
                      }
                    },
                  ],
                  [
                    { text: '', },
                    {
                      text: '1-Hour',
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOff.kwPeak, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOff.powerFactor, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOff.kvar, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOff.kva, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOff.kwh, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: 'OFF',
                      style: { alignment: 'center', fillColor: '#ff4d4d', }
                    },
                  ],
                  [
                    { text: '', },
                    {
                      text: '1-Hour',
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOn.kwPeak, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOn.powerFactor, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOn.kvar, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOn.kva, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: _.round(data.result.totals.xecoOn.kwh, 2),
                      style: { alignment: 'center', }
                    },
                    {
                      text: 'On',
                      style: { alignment: 'center', fillColor: '#1ac44a' }
                    },
                  ],
                  [
                    { text: '', },
                    {
                      text: 'Synerex Savings',
                      style: { alignment: 'center', fontSize: 7 }
                    },
                    {
                      text: _.round(data.result.percentSaved.kwPeak * 100, 2),
                      style: { alignment: 'center', fontSize: 7, bold: true, }
                    },
                    {
                      text: _.round(data.result.percentSaved.powerFactor, 2),
                      style: { alignment: 'center', fontSize: 7, bold: true, }
                    },
                    {
                      text: _.round(data.result.percentSaved.kvar * 100, 2),
                      style: { alignment: 'center', fontSize: 7, bold: true, }
                    },
                    {
                      text: _.round(data.result.percentSaved.kva * 100, 2),
                      style: { alignment: 'center', fontSize: 7, bold: true, }
                    },
                    {
                      text: _.round(data.result.percentSaved.kwh * 100, 2),
                      style: { alignment: 'center', fontSize: 7, bold: true, }
                    },
                    {
                      text: '',
                      style: { alignment: 'center', fontSize: 7 }
                    },
                  ],
                ],
              },
              style: {
                fontSize: 5,
              },
            },
            {
              pageOrientation: 'portrait',
              margin: [0, 10, 0, 0],
              table: {
                widths: [190, 85, 85, '*', '*', '*', '*', 85],
                body: [
                  [
                    {
                      border: noBordersCell,
                      text: 'DETAILED SAVINGS FROM ELECTRIC BILL ANALYSIS',
                      colSpan: 8,
                      style: {
                        alignment: 'center',
                        bold: true,
                        fillColor: 'black',
                        color: 'white',
                        fontSize: 12
                      }
                    },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' },
                    { text: '' }
                  ],
                  [
                    {
                      margin: [0, 10, 0, 0],
                      border: noBordersCell,
                      text: '',
                    },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' }
                  ],
                  [
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'Currency values based on ' + data.project.currencyCode,
                      style: { fontSize: 6, bold: true, alignment: 'right' }
                    },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' }
                  ],
                  [
                    {
                      border: [false, true, false, true],
                      text: 'Bill Charges',
                      style: { bold: true }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'Charge Cost',
                      style: { alignment: 'right', }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'Baseline Savings',
                      style: { alignment: 'right', }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'Metered Amount',
                      style: { alignment: 'right', }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'kWh/kw/kVar/Pf Saved',
                      style: { alignment: 'right', }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'I2R Loss ',
                      style: { alignment: 'right', }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'I2R Loss Savings',
                      style: { alignment: 'right', }
                    },
                    {
                      border: [false, true, false, true],
                      text: 'SYNEREX Savings ' + data.project.currencyCode,
                      style: {
                        alignment: 'right',
                        fillColor: xecoSavingsColor,
                        color: 'white',
                        bold: true
                      }
                    },
                  ],
                  [
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: '',
                      style: {
                        alignment: 'right',
                        fillColor: xecoSavingsColor,
                        color: 'white',
                        bold: true
                      }
                    },
                  ],
                  [
                    {
                      border: noBordersCell,
                      margin: [0, -5, 0, 0],
                      text: 'Customer Charge',
                      style: { fillColor: lightGrayBG, }
                    },
                    {
                      border: noBordersCell,
                      margin: [0, -5, 0, 0],
                      text: data.customerCharge,
                      style: { alignment: 'right', fillColor: lightGrayBG, }
                    },
                    { border: noBordersCell, text: '', style: { fillColor: lightGrayBG, } },
                    { border: noBordersCell, text: '', style: { fillColor: lightGrayBG, } },
                    { border: noBordersCell, text: '', style: { fillColor: lightGrayBG, } },
                    { border: noBordersCell, text: '', style: { fillColor: lightGrayBG, } },
                    { border: noBordersCell, text: '', style: { fillColor: lightGrayBG, } },
                    {
                      border: noBordersCell,
                      margin: [0, -5, 0, 0],
                      text: 'Breakdown',
                      style: {
                        alignment: 'right',
                        fillColor: xecoSavingsColor,
                        color: 'white',
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                  ],
                  ...getChargesRows(data.charges),
                  [
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '', },
                    {
                      border: [false, false, true, false],
                      text: 'Synerex Savings',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fontSize: 7,
                        fillColor: xecoSavingsColor,
                      }
                    }
                  ],
                  [
                    {
                      border: [false, true, false, true],
                      text: 'Total Itemized Charges:',
                      style: { bold: true }
                    },
                    {
                      border: [false, true, false, true],
                      text: data.billAmount,
                      style: { alignment: 'right', bold: true }
                    },
                    { border: [false, true, false, true], text: '' },
                    { border: [false, true, false, true], text: '' },
                    { border: [false, true, false, true], text: '' },
                    { border: [false, true, false, true], text: '' },
                    { border: [false, true, false, true], text: '', },
                    {
                      border: [false, true, false, true],
                      text: data.savings,
                      style: { alignment: 'center', bold: true }
                    }
                  ],
                  [
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '' }
                  ],
                  [
                    {
                      border: noBordersCell,
                      margin: [0, 5, 0, 0],
                      text: '',
                    },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '', }
                  ],
                  [
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    {
                      border: noBordersCell,
                      text: 'SYNEREX % Savings:',
                      style: { alignment: 'right', bold: true, },
                      colSpan: 2,
                    },
                    { border: noBordersCell, text: '', },
                    {
                      border: noBordersCell,
                      text: `${_.round(data.acutalSavingsPercent * 100, 2)}%`,
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                      }
                    },
                    { border: noBordersCell, text: '' }
                  ],
                  [
                    {
                      border: noBordersCell,
                      margin: [0, 10, 0, 0],
                      text: '',
                    },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '', }
                  ],
                  [
                    { border: noBordersCell, text: '' },
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '', },
                    { border: noBordersCell, text: '', },
                    {
                      border: noBordersCell,
                      text: 'Actual Savings:',
                      style: { alignment: 'right', bold: true },
                      colSpan: 2,
                    },
                    { border: noBordersCell, text: '', },
                    {
                      border: noBordersCell,
                      text: `${data.actualSavings}`,
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true
                      }
                    },
                    { border: noBordersCell, text: '' }
                  ],
                ],
              },
              style: {
                fontSize: 9
              },
              pageBreak: 'after',
            },
            {
              margin: [0, 20, 0, 20],
              width: '100%',
              table: {
                widths: ['*', 110, '*', '*', '*', '*', '*', '*'],
                body: [
                  [
                    {
                      border: noBordersCell,
                      margin: [0, 20, 0, 0],
                      text: 'Meter Data During Test',
                      colSpan: 8,
                      style: {
                        fontSize: 12,
                        bold: true,
                        alignment: 'center',
                      }
                    },
                    { text: '', },
                    { text: '', },
                    { text: '', },
                    { text: '', },
                    { text: '', },
                    { text: '', },
                    { text: '', },
                  ],
                  [
                    {
                      text: 'Meter Name',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'Recorded At',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'Voltage',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'Amperage',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'KW',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'KVA',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'Power Factor',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                    {
                      text: 'Synerex',
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white',
                        bold: true,
                        fontSize: 5,
                      },
                    },
                  ],
                  ...getTestDataRows(data.testData, data.project.timeZoneId),
                ],
              },
            },
          ]
        };

        log.debug('docDefinition created, validating...');
        log.debug('Test cycles sample:', testCycles.slice(0, 2));
        log.debug('Charges rows sample:', chargesRows.slice(0, 2));
        log.debug('Test data rows sample:', testDataRows.slice(0, 2));

        [testCycles, chargesRows, testDataRows].forEach((rows, index) => {
          rows.forEach((row, rowIdx) => {
            if (!Array.isArray(row)) {
              log.error(`Table ${index} row ${rowIdx} is not an array:`, row);
            }
            row.forEach((cell, cellIdx) => {
              if (cell === undefined || cell === null) {
                log.error(`Table ${index} row ${rowIdx} cell ${cellIdx} is ${cell}`);
              }
            });
          });
        });

        log.debug('Creating PDF document');
        var doc = printer.createPdfKitDocument(docDefinition);
        doc.end(); // Explicitly end the stream
        log.info('Test report PDF created');
        return doc;
      } catch (e) {
        log.error('Error in test-report generation:', e);
        throw e;
      }
    }
  };

  function getTestCycles(cycles, timeZone) {
    let dataRows = [];
    cycles.forEach(function (cycle) {
      let blank = [
        {
          border: noBordersCell,
          margin: [0, 12, 0, 0],
          text: '',
          colSpan: 8,
        },
        { text: '', },
        { text: '', },
        { text: '', },
        { text: '', },
        { text: '', },
        { text: '', },
        { text: '', },
      ];
      let row1 = [
        {
          text: 'Test Cyle',
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: '',
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: 'Timestamp',
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: 'From: ',
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: moment.tz(cycle.startedAt, timeZone).format('MMM DD, YYYY hh:mm A'),
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: 'Thru',
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: moment.tz(cycle.endedAt, timeZone).format('MMM DD, YYYY hh:mm A'),
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
        {
          text: '',
          style: {
            alignment: 'center',
            bold: true,
            fillColor: 'black',
            color: 'white',
            fontSize: 5
          }
        },
      ];
      let row2 = [
        {
          text: cycle.cycle,
          rowSpan: 4,
          style: {
            alignment: 'center',
            fontSize: 20
          }
        },
        {
          text: '2-Hours',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
        {
          text: 'Kw Peak',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
        {
          text: 'Power Factor(%)',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
        {
          text: 'Kvar',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
        {
          text: 'Avg 15 Min Interval',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
        {
          text: 'kWh',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
        {
          text: 'Synerex',
          style: {
            alignment: 'center',
            fillColor: lightGrayBG,
            fontSize: 5
          }
        },
      ];
      dataRows.push(blank);
      dataRows.push(row1);
      dataRows.push(row2);
      cycle.segments.forEach(function (segment) {
        let row = [
          { text: '', },
          {
            text: '1-Hour',
            style: { alignment: 'center', }
          },
          {
            text: _.round(segment.kwPeak, 2),
            style: { alignment: 'center', }
          },
          {
            text: _.round(segment.powerFactor, 2),
            style: { alignment: 'center', }
          },
          {
            text: _.round(segment.kvar, 2),
            style: { alignment: 'center', }
          },
          {
            text: _.round(segment.avgKw15MinInterval, 2),
            style: { alignment: 'center', }
          },
          {
            text: _.round(segment.kwh, 2),
            style: { alignment: 'center', }
          },
          {
            text: segment.segment == 1 ? 'Off' : 'On',
            style: {
              alignment: 'center',
              fillColor: segment.segment == 1 ? '#ff4d4d' : '#1ac44a'
            }
          },
        ];
        dataRows.push(row);
      });
      let row3 = [
        { text: '', },
        {
          text: 'Synerex Savings (%)',
          style: { alignment: 'center', fontSize: 6 }
        },
        {
          text: _.round(cycle.percentSaved.kwPeak * 100, 2),
          style: { alignment: 'center', fontSize: 5 }
        },
        {
          text: _.round(cycle.percentSaved.powerFactor * 100, 2),
          style: { alignment: 'center', fontSize: 5 }
        },
        {
          text: _.round(cycle.percentSaved.kvar * 100, 2),
          style: { alignment: 'center', fontSize: 5 }
        },
        {
          text: _.round(cycle.percentSaved.avgKw15MinInterval * 100, 2),
          style: { alignment: 'center', fontSize: 5 }
        },
        {
          text: _.round(cycle.percentSaved.kwh * 100, 2),
          style: { alignment: 'center', fontSize: 5 }
        },
        {
          text: '',
          style: { alignment: 'center', fontSize: 5 }
        },
      ];
      dataRows.push(row3);
    });
    return dataRows;
  }

  function getTestDataRows(testData, timeZone) {
    let dataRows = [];
    testData.forEach(function (record) {
      let row = [
        {
          border: [false, true, false, true],
          text: record.meter.name,
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, false],
          text: moment.tz(record.recordedAt, timeZone).format('MMM DD, YYYY hh:mm A'),
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, false],
          text: _.round(record.totalVolt),
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, false],
          text: _.round(record.totalAmp),
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, false],
          text: _.round(record.totalKw),
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, false],
          text: _.round(record.totalKva),
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, false],
          text: _.round(record.totalPf),
          style: { alignment: 'center', fontSize: 4, }
        },
        {
          border: [false, true, false, true],
          text: record.xecoSwitchedOn == 0 ? 'OFF' : 'ON',
          style: { alignment: 'center', fontSize: 4, }
        },
      ];
      dataRows.push(row);
    });
    return dataRows;
  }

  function getChargesRows(charges) {
    let chargesRows = [];
    charges.forEach(function (charge) {
      let chargeFillColor = white;
      if (!charge.relevant) {
        chargeFillColor = lightGrayBG;
      }
      let row = [
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.description,
          style: { fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.amount,
          style: { alignment: 'right', fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: `${charge.type}   ${charge.percentSavings}`,
          style: { alignment: 'right', fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.meterReading,
          style: { alignment: 'right', fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.savingsAmount,
          style: { alignment: 'right', fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.I2RLoss,
          style: { alignment: 'right', fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.I2RLossSavings,
          style: { alignment: 'right', fillColor: chargeFillColor, }
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.savings,
          style: {
            alignment: 'right',
            fillColor: xecoSavingsColor,
            color: 'white',
            bold: true,
          }
        }
      ];
      chargesRows.push(row);
    });

    for (let i = charges.length; i < 12; i++) {
      chargesRows.push([
        {
          border: noBordersCell,
          margin: [0, 5, 0, 0],
          text: '',
        },
        { border: noBordersCell, text: '' },
        { border: noBordersCell, text: '' },
        { border: noBordersCell, text: '' },
        /*{
          border: noBordersCell,
          text: '',
          style: { fillColor: xecoSavingsColor }
        },*/
        { border: noBordersCell, text: '', },
        { border: noBordersCell, text: '', },
        { border: noBordersCell, text: '', },
        {
          border: noBordersCell,
          text: '',
          style: { fillColor: xecoSavingsColor }
        },
        //{ border: noBordersCell, text: '', }
      ]);
    }
    return chargesRows;
  }
};
