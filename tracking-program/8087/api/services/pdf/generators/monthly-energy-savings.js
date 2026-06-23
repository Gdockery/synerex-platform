module.exports = function (printer) {

  const gray = '#868686',
    lightGrayBG = '#d9d9d9',
    darkGray = '#595959',
    green = '#00b050',
    red = '#c00000',
    blueBG = '#00b0f0',
    xecoSavingsColor = '#333333',
    darkGreen = '#363600',
    noBordersCell = [false, false, false, false];

  return {
    generate: generate
  };

  function generate (ceData, logoPath) {
    if (Object.keys(ceData.reportsCalculations).length < 8) {
      ceData.reportsCalculations =
        [...ceData.reportsCalculations,
          ...Array(11 - Object.keys(ceData.reportsCalculations).length).fill({

            month: '',
            billWithoutXeco: '',
            currentBill: '',
            kwhReduction: '',
            kwhSavingsDol: '',
            kwPeakSavings: '',
            kwPeakSavingsDol: '',
            powerLossKwh: '',
            powerLossSavings: '',
            powerFactorLossSavings: '',
            totalSavings: '',
            totalSavingsPercent: '',
            co2Reduction: '',
            co2Rate: '',
            co2Value: ''
          })
        ];
    }
    if (Object.keys(ceData.reportsCalculations).length < 8) {
      ceData.reportsCalculations =
        [...ceData.reportsCalculations,
          ...Array(8 - Object.keys(ceData.reportsCalculations).length).fill({
            billCycle: '',
            kvaUsed: '',
            kwPeak: '',
            availableCapacity: '',
            availableKvaCapacity: '',
            btuReduction: '',
            thermsReduction: '',
            horsepowerReduction: ''
          })
        ];
    }

    let docDefinition = {
      pageMargins: [50, 20, 50, 20],
      pageSize: {width: 612, height: 1000},
      pageOrientation: 'landscape',
      content: [
        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
          layout: 'noBorders',
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  layout: 'noBorders',
                  style: {
                    fontSize: 6
                  },
                  table: {
                    body: [
                      [{
                        width: 80,
                        image: logoPath,
                        alignment: 'left'
                      }],
                      [{
                        margin: [0, 10, 0, 0],
                        columns: [
                          {text: 'Client:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientName}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        columns: [
                          {text: 'Address:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientAddress}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        columns: [
                          {text: 'City/State/Zip:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientCityStateZip}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
          
                      [{
                        style: {
                          bold: true,
                          fontSize: 8,
                        },
                        columns: [
                          {text: 'Facility Location: ', width: 80, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.facilityLocation}`, style: {bold: true}, alignment: 'left'}
                        ]
                      }],
                    ]
                  }
                },
                {
                  alignment: 'right',
                  width: '*',
                  style: {
                    fontSize: 8
                  },
                  layout: 'noBorders',
                  table: {
                    widths: ['100%'],
                    body: [
                      [{
                        margin: [0, 0, 5, 0],
                        width: '*',
                        text: `Statement Date: ${ceData.statementDate} `,
                        alignment: 'right',
                        style: {
                          bold: true,
                          fontSize: 8
                        }
                      }],
                      [{
                        margin: [210, 0, 0, 0],
                        table: {
                          body: [
                            [{
                              style: {
                                fillColor: 'black',
                                alignment: 'center',
                                bold: true,
                                color: 'white',
                                fontSize: 8
                              },
                              margin: [40, 0, 40, 0],
                              text: 'UTILITY METER/TARIFF INFORMATION'
                            }],
                            [
                              {
                                style: {
                                  fillColor: lightGrayBG,
                                  fontSize: 6
                                },
                                layout: 'noBorders',
                                table: {
                                  body: [
                                    [{
                                      style: {
                                        fillColor: lightGrayBG
                                      },
                                      columns: [
                                        {
                                          text: 'Electric Company:',
                                          width: 100,
                                          alignment: 'right',
                                          margin: [0, 1, 5, 0]
                                        },
                                        {
                                          text: `${ceData.electricCompany}`,
                                          style: {fontSize: 6, bold: true},
                                          alignment: 'left'
                                        }
                                      ]
                                    }],
                                    [{
                                      style: {
                                        fillColor: lightGrayBG
                                      },
                                      columns: [
                                        {
                                          text: 'Tariff:',
                                          width: 100,
                                          alignment: 'right',
                                          margin: [0, 1, 5, 0]
                                        },
                                        {
                                          text: `${ceData.tariff}`,
                                          style: {fontSize: 6, bold: true},
                                          alignment: 'left'
                                        }
                                      ]
                                    }],
                                    [{
                                      style: {
                                        fillColor: lightGrayBG
                                      },
                                      columns: [
                                        {text: 'Meter No.:', width: 100, alignment: 'right', margin: [0, 1, 5, 0]},
                                        {text: `${ceData.meterNo}`, style: {fontSize: 6, bold: true}, alignment: 'left'}
                                      ]
                                    }],
                                    [{
                                      style: {
                                        fillColor: lightGrayBG
                                      },
                                      columns: [
                                        {text: 'Acct No.:', width: 100, alignment: 'right', margin: [0, 1, 5, 0]},
                                        {text: `${ceData.acctNo}`, style: {fontSize: 6, bold: true}, alignment: 'left'}
                                      ]
                                    }]
                                  ]
                                }
                              }
                            ],
                          ]
                        }
                      }],
                      [{
                        margin: [210, 1, 0, 0],
                        table: {
                          body: [
                            [{
                              style: {
                                fillColor: 'grey',
                                alignment: 'center',
                                bold: true,
                                color: 'white',
                                fontSize: 8
                              },
                              margin: [55, 0, 55, 0],
                              text: 'CURRENT PROJECT STATISTICS'
                            }],
                            [
                              {
                                style: {
                                  fillColor: 'black',
                                  bold: true,
                                  fontSize: 6
                                },
                                layout: 'noBorders',
                                table: {
                                  body: [
                                    [{
                                      style: {
                                        fillColor: 'black',
                                        color: 'white'
                                      },
                                      columns: [
                                        {text: `Proj'd R.O.I.:`, width: 60, alignment: 'right', margin: [0, 0, 5, 0]},
                                        {text: `${ceData.projROI}`, width: 20, alignment: 'center'},
                                        {text: `Months`, alignment: 'left', margin: [5, 0, 5, 0]},
                                        {
                                          text: `Cost of Project:`,
                                          width: 'auto',
                                          alignment: 'right',
                                          margin: [12, 0, 5, 0]
                                        },
                                        {text: `${ceData.projectCost}`, alignment: 'left'}
                                      ]
                                    }],
                                    [{
                                      style: {
                                        fillColor: 'black',
                                        color: 'white'
                                      },
                                      columns: [
                                        {
                                          text: `Avg. Bill per Month:`,
                                          width: 70,
                                          alignment: 'right',
                                          margin: [0, 0, 5, 0]
                                        },
                                        {text: `${ceData.avgBillPerMonth}`, width: 50, alignment: 'center'},
                                        {
                                          text: `Avg. Savings per Mth.:`,
                                          width: 82.5,
                                          alignment: 'right',
                                          margin: [5, 0, 5, 0]
                                        },
                                        {text: `${ceData.savingsPerMonth}`, alignment: 'left'}
                                      ]
                                    }],
                                    [{
                                      style: {
                                        fillColor: 'black',
                                        color: 'white',
                                        fontSize: 8,
                                      },
                                      columns: [
                                        {
                                          text: `Current Power Factor: `,
                                          width: 170,
                                          alignment: 'right',
                                          margin: [0, 0, 5, 0]
                                        },
                                        {text: `${ceData.powerFactor}%`, width: 25, alignment: 'left'},
                                        
                                      ]
                                    }],
                                    [{
                                      style: {
                                        fillColor: 'black',
                                        color: 'white',
                                        fontSize: 10,
                                      },
                                      columns: [
                                        {
                                          text: `Total Savings To Date: `,
                                          width: 140,
                                          alignment: 'right',
                                          margin: [0, 0, 5, 0]
                                        },
                                        {text: ceData.totals.savingsToDate, alignment: 'left'},
                                        
                                      ]
                                    }],
                                  ]
                                }
                              }
                            ],
                          ]
                        }
                      }],
                      [{
                        margin: [0, 0, 5, 0],
                        width: '*',
                        text: `Facility Location: ${ceData.facilityLocation} `,
                        alignment: 'right',
                        style: {
                          bold: true,
                          fontSize: 8
                        }
                      }],
                    ]
                  }
                },
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
          table: {
            widths: ['100%'],
            body: [
              [{
                width: '100%',
                text: 'ACCUMULATED PROJECT SAVINGS REPORT',
                style: {
                  fillColor: lightGrayBG,
                  color: 'black',
                  fontSize: 12,
                  bold: true
                },
              }],
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
          layout: {
            vLineColor: function (i, node) {
              return 'white';
            },
            hLineColor: function (i, node) {
              return (i === 1 ) ? 'black' : 'white';
            }
          },
          table: {
            widths: ['100%'],
            body: [
              [{
                text: 'NOTE: This Report is a summary of month-to-month accumulated savings since the implimentation of the Synerex solution.',
                style: {
                  fontSize: 7,
                  bold: true
                },
              }]
            ]
          }
        },
        //---------------------Main Table---------------------
        {
          pageBreak: 'after',
          layout: {
            fillColor: function (i, node) {
              if (i > 3) {
                return (i % 2 === 0) ? lightGrayBG : 'white';
              }
            }
          },
          table: {
            widths: [15, 30, '*', '*', '*', '*', '*', '*', '*', '*', '*', 72, 35, 45, 43, 45],
            body: [
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [1, -3, -5, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 5, 0, 0],
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 5, 0, 0],
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  margin: [0, -3, 0, -3],
                  border: [true, true, true, false],
                  text: 'CO\u00B2 Market Trading',
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center',
                    bold: true,
                  },
                  colSpan: 3
                },
                {
                  text: ''
                },
                {
                  text: ''
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [0, 5, 0, 0],
                  border: noBordersCell,
                  text: 'Month',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Electric Bill w/o Synerex',
                  style: {
                    fillColor: red,
                    color: 'white',
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Current\nElectric Bill',
                  style: {
                    fillColor: green,
                    color: 'white',
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  margin: [0, 5, 0, 0],
                  border: noBordersCell,
                  text: 'kWh Reduction',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: 'kWh Savings',
                      style: {
                        fontSize: 6,
                        alignment: 'center',
                        bold: true
                      }
                    }]]
                  },
                },
                {
                  border: noBordersCell,
                  text: 'kW Peak Savings',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: 'kW Peak Savings',
                      style: {
                        fontSize: 6,
                        alignment: 'center',
                        bold: true
                      }
                    }]]
                  }
                },
                {
                  border: noBordersCell,
                  text: 'I\u00B2R Loss (in kWh\'s)',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: 'I\u00B2R Loss Savings',
                      style: {
                        fontSize: 6,
                        alignment: 'center',
                        bold: true
                      }
                    }]]
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Power Factor Savings',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  margin: [1, -3, -5, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, -5, 0, 0],
                      text: 'Synerex Savings',
                      style: {
                        fillColor: 'black',
                        color: 'white',
                        alignment: 'center',
                        bold: true
                      }
                    }]]
                  }
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, -5, 0, 0],
                      text: '%',
                      style: {
                        fillColor: 'black',
                        color: 'white',
                        alignment: 'center',
                        bold: true,
                        fontSize: 16
                      }
                    }]]
                  }
                },
                {
                  margin: [-5, 0, -5, 0],
                  border: [true, false, false, false],
                  text: 'CO\u00B2 Reduction (in Metric Tons)',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 6,
                    fillColor: lightGrayBG
                  },
                },
                {
                  margin: [0, 7, 0, 0],
                  border: noBordersCell,
                  text: 'x Rate =',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 6,
                    fillColor: lightGrayBG
                  },
                },
                {
                  margin: [0, 5, 0, 0],
                  border: [false, false, true, false],
                  text: 'CO\u00B2  Value ($)',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 6,
                    fillColor: lightGrayBG
                  },
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {

                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  margin: [1, -3, -5, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, -5, 0, 0],
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, -5, 0, 0],
                      text: '',
                      style: {
                        fillColor: 'black'
                      }
                    }]]
                  }
                },
                {
                  margin: [-5, 0, -5, 0],
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  text: '',
                  style: {
                    fillColor: 'black'
                  }
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                  colSpan: 13
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: [true, false, true, false],
                  text: '',
                  colSpan: 3
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                }
              ],
              ...generateRowValues(ceData.reportsCalculations),
              [
                {
                  border: [false, false, false, true],
                  text: '',
                  colSpan: 12,
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: darkGray,
                      }
                    }]]
                  }
                },
                {
                  border: [true, false, true, false],
                  text: '',
                  colSpan: 3,
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                  colSpan: 12,
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: darkGray,
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  margin: [0, 0, -5, 0],
                  text: 'Carbon Credit\nTrading Value:',
                  rowSpan: 2,
                  style: {
                    fillColor: 'black',
                    color: 'white',
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  text: '',
                  style: {
                    fillColor: 'black',
                  },
                  rowSpan: 2
                },
                {
                  margin: [0, 3, 0, 0],
                  text: ceData.totals.carbonCreditTradingValue,
                  rowSpan: 2,
                  style: {
                    fillColor: 'black',
                    color: 'white',
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: 'Totals:',
                  style: {
                    fillColor: 'white',
                    fontSize: 7,
                    bold: true,
                    alignment: 'center'
                  }
                },
                {
                  text: ceData.totals.billWithoutXeco,
                  style: {
                    fillColor: red,
                    color: 'white',
                    fontSize: 6,
                    bold: true,
                    alignment: 'center'
                  }
                },
                {
                  text: ceData.totals.currentBill,
                  style: {
                    fillColor: green,
                    color: 'white',
                    fontSize: 6,
                    bold: true,
                    alignment: 'center'
                  }
                },
                {
                  margin: [-5, -3, 1, -4],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.kwhReduction,
                      style: {
                        alignment: 'center'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.kwhSavingsDol,
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.kwPeakSavings,
                      style: {
                        alignment: 'center',
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.kwPeakSavingsDol,
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.powerLossKwh,
                      style: {
                        alignment: 'center'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.powerLossSavings,
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  margin: [-5, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      text: ceData.totals.powerFactorLossSavings,
                      style: {
                        alignment: 'center',
                        fillColor: 'black',
                        color: 'white'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white',
                    fontSize: 6,
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 12, 0, 0],
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: darkGray,
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  text: '',
                  colSpan: 3,
                  style: {
                    fillColor: 'black'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                }
              ],
              [
                {
                  border: [false, false, false, true],
                  text: '',
                  colSpan: 12,
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      border: noBordersCell,
                      text: '',
                      style: {
                        fillColor: darkGray,
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white'
                  },
                },
                {
                  text: '',
                  style: {
                    fillColor: 'white'
                  },
                  colSpan: 3
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: 'Total Accumulated Savings to Date:',
                  colSpan: 11,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'right',
                    bold: true,
                    fontSize: 10
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: ceData.totals.savingsToDate,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center',
                    bold: true,
                    fontSize: 10
                  }
                },
                {
                  margin: [1, -3, 1, -3],
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      border: noBordersCell,
                      text: ceData.totals.percentageSavingsToDate,
                      style: {
                        fillColor: darkGray,
                        color: 'white',
                        alignment: 'center'
                      }
                    }]]
                  },
                  style: {
                    fillColor: 'white'
                  },
                },
                {
                  border: [true, true, true, true],
                  text: ceData.totals.co2Reduction,
                  style: {
                    color: 'black',
                    fillColor: 'white',
                    alignment: 'center',
                    bold: true,
                    fontSize: 11
                  },
                  colSpan: 3
                },
                {
                  border: noBordersCell,
                  text: '',
                  
                },
                {
                  border: noBordersCell,
                  text: '',
                },
              ]
            ]
          },
          style: {
            fontSize: 8,
          }
        },
        //---------------------Second Table---------------------

        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
          layout: 'noBorders',
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  layout: 'noBorders',
                  style: {
                    fontSize: 6
                  },
                  table: {
                    body: [
                      [{
                        width: 80,
                        image: logoPath,
                        alignment: 'left'
                      }],
                      [{
                        margin: [0, 10, 0, 0],
                        columns: [
                          {text: 'Client:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientName}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        columns: [
                          {text: 'Address:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientAddress}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        columns: [
                          {text: 'City/State/Zip:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientCityStateZip}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }]
                    ]
                  }
                },
                {
                  alignment: 'right',
                  width: '*',
                  style: {
                    fontSize: 8
                  },
                  layout: 'noBorders',
                  table: {
                    widths: ['100%'],
                    body: [
                      [{
                        margin: [0, 90, 5, 10],
                        width: '*',
                        text: `Facility Location: ${ceData.facilityLocation} `,
                        alignment: 'right',
                        style: {
                          bold: true,
                          fontSize: 8
                        }
                      }],
                    ]
                  }
                },
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
          table: {
            widths: ['100%'],
            body: [
              [{
                width: '100%',
                text: 'STRATEGIC OPERATIONS & PERFORMANCE STATISTICS',
                style: {
                  fillColor: 'black',
                  color: 'white',
                  fontSize: 12,
                  bold: true
                },
              }],
            ]
          }
        },
        {
          margin: [0, 20, 0, 0],
          layout: {
            fillColor: function (i, node) {
              if (i > 3 && i < 19) {
                return (i % 2 === 0) ? lightGrayBG : 'white';
              }
            }
          },
          table: {
            widths: [80, 140, 82, 110, 59, 24, 80, 90, 85, '*'],
            body: [
              [
                {
                  text: 'MAIN Transformer kVA Capacity',
                  style: {
                    fillColor: 'black',
                    color: 'white',
                    fontSize: 11,
                    bold: true,
                    alignment: 'center'
                  },
                  colSpan: 5
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  margin: [0, 0, 0, 0],
                  text: 'Electrical Network (Saving Conversions from Power to Heat Flow)',
                  style: {
                    fillColor: gray,
                    color: 'white',
                    fontSize: 11,
                    bold: true,
                    alignment: 'center'
                  },
                  colSpan: 4
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [-5, -3, 7, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        border: noBordersCell,
                        text: '',
                        style: {
                          fillColor: 'black'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [12, -3, 7, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        border: noBordersCell,
                        text: '',
                        style: {
                          fillColor: 'black'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [10, -3, 5, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        border: noBordersCell,
                        text: '',
                        style: {
                          fillColor: 'black'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [6, -3, 7, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        border: noBordersCell,
                        text: '',
                        style: {
                          fillColor: 'black'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [6, -3, -6, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        border: noBordersCell,
                        text: '',
                        style: {
                          fillColor: 'black'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [-5, -3, 8, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        margin: [-3, 0, -3, 0],
                        text: 'Bill Month',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  },
                },
                {
                  border: noBordersCell,
                  margin: [12, -3, 8, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        margin: [0, 5, 0, 5],
                        text: 'Avg kVA Usage for Month',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [10, -3, 7, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        margin: [0, 5, 0, 5],
                        text: 'kW Peak',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [6, -3, 8, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        text: 'Available Xfmr. Capacity (Based on 1 Yr. MAX PK)',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [6, -3, -5, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        text: 'Available kVA Capacity (%)',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -1, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        text: 'BTU Reduction Equivalency',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [0, -3, -1, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        text: 'Therms/Hour (thm) Reduction Equivalency',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [0, -3, -1, -3],
                  table: {
                    widths: ['*'],
                    body: [
                      [{
                        margin: [-3, 0, -3, 0],
                        text: 'Horsepower (hp) Reduction Equivalency',
                        style: {
                          fontSize: 7,
                          bold: true,
                          alignment: 'center'
                        }
                      }]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
              ...generatePerformanceStatisticsRows(ceData.reportsCalculations),
              [
                {
                  border: noBordersCell,
                  margin: [-4, 0, 0, 5],
                  canvas: [{type: 'line', x1: 0, y1: 5, x2: 448, y2: 5, lineWidth: 3}],
                  colSpan: 4
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-4, 0, 0, 5],
                  canvas: [{type: 'line', x1: 0, y1: 5, x2: 400, y2: 5, lineWidth: 3}],
                  colSpan: 5
                },
                {
                  text: ''
                },
                {
                  text: ''
                },
                {
                  text: ''
                },
                {
                  text: ''
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 3],
                  text: 'Average Recommended Transformer Availability:',
                  style: {
                    color: 'white',
                    bold: true,
                    fillColor: 'black',
                    alignment: 'center',
                    fontSize: 11
                  },
                  colSpan: 3
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, 8, -4],
                  table: {
                    widths: ['*'],
                    body: [
                      [
                        {
                          margin: [0, 0, 0, 3],
                          text: ceData.averageRecommendedTransformerAvailability,
                          style: {
                            color: 'white',
                            bold: true,
                            fillColor: 'black',
                            alignment: 'right',
                            fontSize: 11
                          }
                        }
                      ]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [6, -3, -5, -4],
                  table: {
                    widths: ['*'],
                    body: [
                      [
                        {
                          margin: [0, 0, 0, 3],
                          text: ceData.totalAvailableKvaCapacity,
                          style: {
                            color: 'white',
                            bold: true,
                            fillColor: 'black',
                            alignment: 'center',
                            fontSize: 11
                          }
                        }
                      ]
                    ]
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-4, 0, 0, 3],
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ]
            ]
          },
          style: {
            fontSize: 9,
          }
        },
        {
          margin:[0,10,0,0],
          table: {
            widths:[498],
            body: [[{
              text: [
                {
                  text: 'NOTE:',
                  style:{
                    decoration: 'underline'
                  }
                },
                ' KVA Transformer capacity increase is based on the reduction of DEMAND in the facility from the' +
                ' last 12-months of kW Peak from Bill. The increased capacity is in addition to the full capacity' +
                ' rating of the facility MAIN transformer.The 12-Month kW Peak method is used since it represents' +
                ' 100% operational with no outages.'
              ],
              style:{
                bold: true,
                fontSize: 8
              }
            }]]
          }
        }
      ]
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  function generateRowValues (values) {
    return values.map(function (value, i) {
      return [
        {
          border: noBordersCell,
          text: i + 1,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.month,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.billWithoutXeco,
          style: {
            bold: true,
            alignment: 'center',
            color: red
          }
        },
        {
          border: noBordersCell,
          text: value.totalBill,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.kwhReduction,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.kwhSavingsDol,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.kwPeakSavings,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.kwPeakSavingsDol,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.powerLossKwh,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.powerLossSavings,
          style: {
            bold: true,
            alignment: 'center',
          }
        },
        {
          border: noBordersCell,
          text: value.powerFactorLossSavings,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.totalSavings,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          margin: [1, -3, 1, -3],
          border: noBordersCell,
          table: {
            widths: ['*'],
            body: [[{
              border: noBordersCell,
              margin: [0, 0, 0, value.totalSavingsPercent ? 0 : 11],
              text: value.totalSavingsPercent,
              style: {
                fillColor: (i % 2 === 0) ? darkGray : 'white',
                color: (i % 2 === 0) ? 'white' : darkGray,
                alignment: 'center',
                bold: true
              }
            }]]
          },
          style: {
            alignment: 'center',
            fillColor: 'white'
          }
        },
        {
          border: [true, false, false, false],
          text: value.co2Reduction,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.co2Rate,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: [false, false, true, false],
          text: value.co2Value,
          style: {
            bold: true,
            alignment: 'center'
          }
        }
      ]
    });
  }

  function generatePerformanceStatisticsRows (values) {
    return values.map(function (value, i) {
      return [
        {
          border: noBordersCell,
          margin: [-5, -3, 0, -3],
          table: {
            widths: [20, 57],
            body: [[
              {
                border: noBordersCell,
                text: i + 1,
                style: {
                  alignment: 'right'
                }
              },
              {
                border: noBordersCell,
                text: value.billCycle,
                style: {
                  alignment: 'center'
                }
              }
            ]]
          },
          style: {
            bold: true
          }
        },
        {
          border: noBordersCell,
          text: value.kvaUsed,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.kwPeak,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.availableCapacity,
          style: {
            alignment: 'center',
            bold: true
          }
        },
        {
          border: noBordersCell,
          margin: [6, -3, -5, -3],
          table: {
            widths: '*',
            body: [[{
              border: noBordersCell,
              margin: [0, value.availableKvaCapacity ? 0 : 12, 0, 0],
              text: value.availableKvaCapacity,
              style: {
                alignment: 'center',
                fillColor: (i % 2 === 0) ? 'black' : 'white',
                color: (i % 2 === 0) ? 'white' : 'black',
                bold: true
              }
            }]]
          }
        },
        {
          border: noBordersCell,
          text: '',
          style: {
            fillColor: 'white'
          }
        },
        {
          border: noBordersCell,
          text: value.btuReduction,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.thermsReduction,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: value.horsepowerReduction,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: ''
        }
      ]
    })
  }
};
