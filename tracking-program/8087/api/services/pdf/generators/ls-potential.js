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
    let docDefinition = {
      pageMargins: [40, 40, 40, 40],
      pageSize: {width: 612, height: 1000},
      pageOrientation: 'landscape',
      content: [
        {
          margin: [0, 0, 0, 0],
          width: 150,
          image: logoPath,
          layout: 'noBorders',
          alignment: 'right'
        },
        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
          layout: 'noBorders',
          table: {
            widths: ['60%'],
            body: [
              [
                {
                  layout: 'noBorders',
                  style: {
                    fontSize: 9
                  },
                  table: {
                    body: [
                      [{
                        margin: [0, 10, 0, 0],
                        columns: [
                          {text: 'Client:', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientName}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        columns: [
                          {text: '', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientAddress}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        columns: [
                          {text: '', width: 60, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.clientCityStateZip}`, style: {fontSize: 8, bold: true}, alignment: 'left'}
                        ]
                      }],
                    ]
                  }
                },
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          alignment: 'right',
          border: [true, true, true, true],
          table: {
            body: [
              [
                {
                  layout: 'noBorders',
                  style: {
                    fontSize: 9
                  },
                  table: {
                    body: [
                      [{
                        margin: [10, 10, 10, 0],
                        text: 'SYNEREX Representative Contact',
                        style: {
                          bold: true,
                          fontSize: 8,
                          decoration: 'underline'
                        },
                        alignment: 'left'
                      }],
                      [{
                        style: {
                          fontSize: 9
                        },
                        margin: [10, 0, 10, 0],
                        columns: [
                          {text: 'Name: ', width: 120, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.repName}`, style: {bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        style: {
                          fontSize: 9
                        },
                        margin: [10, 0, 10, 0],
                        columns: [
                          {text: 'Email: ', width: 120, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.repEmail}`, style: {bold: true}, alignment: 'left'}
                        ]
                      }],
                      [{
                        style: {
                          fontSize: 9
                        },
                        margin: [10, 0, 10, 10],
                        columns: [
                          {text: 'Phone Number: ', width: 120, alignment: 'right', margin: [0, 1, 5, 0]},
                          {text: `${ceData.repPhone}`, style: {bold: true}, alignment: 'left'}
                        ]
                      }],
                    ]
                  }
                },
              ]
            ]
          }
        },
        {
          margin: [0, 20, 0, 0],
          alignment: 'center',
          table: {
            widths: ['100%'],
            body: [
              [{
                width: '100%',
                text: 'LOST SAVINGS POTENTIAL (LSP) TRACKER',
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
          border: noBordersCell,
          text: '',
        },
        //---------------------Main Table---------------------
        {
          layout: {
            fillColor: function (i, node) {
              if (i > 3) {
                return (i % 2 === 0) ? lightGrayBG : 'white';
              }
            }
          },
          table: {
            widths: [120, '*', 80, '*', 35, 45, '*', '*', '*', '*', 45, 45],
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
                  margin: [0, -3, 0, -3],
                  border: [true, true, true, false],
                  text: 'Future Savings',
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center',
                    bold: true,
                  },
                  colSpan: 3
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
                  text: ''
                },
                {
                  margin: [0, -3, 0, -3],
                  border: [true, false, true, false],
                  text: 'Annual CO\u00B2 Savings',
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'center',
                    bold: true,
                  },
                  colSpan: 2
                },
                {
                  text: ''
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: 'Facility Location',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Monthly kWh Consumption',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Analytics Date',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Minimum Savings %',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'R.O.I. (months)',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Days Lost',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Lost Savings Value',
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Daily',
                  style: {
                    alignment: 'center',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Monthly',
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                },
                {
                  border: noBordersCell,
                  text: 'Annual',
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                },
                {
                  border: noBordersCell,
                  text: 'CO\u00B2 Emission (Metric Tons)',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 6,
                    //fillColor: lightGrayBG
                  },
                },
                {
                  border: noBordersCell,
                  text: 'CO\u00B2 Savings',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 6,
                    //fillColor: lightGrayBG
                  },
                },
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
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: [true, false, true, false],
                  text: '',
                  colSpan: 2,
                  style: {
                    fillColor: 'white'
                  }
                },
                {
                  border: noBordersCell,
                  text: '',
                }
              ],
              ...generateRowValues(ceData.projects),
              [
                {
                  border: [false, true, false, false],
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
                  text: '',
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
                  text: '',
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
                  text: 'Total Lost Savings Potential:',
                  colSpan: 5,
                  style: {
                    fillColor: 'white',
                    fontSize: 8,
                    bold: true,
                    alignment: 'right'
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
                  text: ceData.totalLostSavings,
                  style: {
                    alignment: 'center',
                    fillColor: red,
                    color: 'white',
                    bold: true,
                    fontSize: 9,
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
                  text: '',
                  border: noBordersCell,
                },
                {
                  border: noBordersCell,
                  text: '',
                }
              ],
              /*[
                {
                  border: [false, false, false, true],
                  text: '',
                  colSpan: 9,
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
                  border: noBordersCell,
                  text: '',
                },
                {
                  text: '',
                  style: {
                    fillColor: 'white'
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: 'Total Lost Savings Potential:',
                  colSpan: 7,
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
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center',
                    bold: true,
                    fontSize: 10
                  }
                },
                {
                  border: noBordersCell,
                  table: {
                    widths: ['*'],
                    body: [[{
                      margin: [0, 2, 0, 2],
                      border: noBordersCell,
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
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: [true, true, true, true],
                  text: 'tt',
                  style: {
                    color: 'black',
                    fillColor: 'white',
                    alignment: 'center',
                    bold: true,
                    fontSize: 11
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
              ] */
            ]
          },
          style: {
            fontSize: 9,
          }
        },
      ]
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  function generateRowValues (projects) {
    return projects.map(function (project, i) {
      return [
        {
          border: noBordersCell,
          text: project.facilityLocation,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: project.kwhConsumed,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: project.reportDate,
          style: {
            bold: true,
            alignment: 'center',
          }
        },
        {
          border: noBordersCell,
          text: `${project.baselineSavingsPercent}%`,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: project.baselineROI,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: project.daysLost,
          style: {
            alignment: 'center'
          }
        },
        {
          border: noBordersCell,
          text: project.lostSavings,
          style: {
            bold: true,
            color: red,
            alignment: 'center',
            fontSize: 9
          }
        },
        {
          border: noBordersCell,
          text: project.dailySavings,
          style: {
            fillColor: darkGray ,
            color: 'white' ,
            alignment: 'center',
            bold: true
          }
        },
        {
          border: noBordersCell,
          text: project.monthlySavings,
          style: {
            fillColor: darkGray ,
            color: 'white' ,
            alignment: 'center',
            bold: true
          }
        },
        {
          border: noBordersCell,
          text: project.yearlySavings,
          style: {
            fillColor: darkGray ,
            color: 'white' ,
            alignment: 'center',
            bold: true
          }
        },
        {
          border: noBordersCell,
          text: project.co2Reduction,
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          border: [false, false, true, false],
          text: project.co2Savings,
          style: {
            bold: true,
            alignment: 'center'
          }
        }
      ]
    });
  }
};
