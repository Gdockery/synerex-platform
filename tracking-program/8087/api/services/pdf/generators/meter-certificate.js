module.exports = function (printer) {

  const gray = '#808080',
    darkGray = '#404040',
    lightGray = '#a0a0a0',
    titleBlue = '#365f91',
    titleUnderlineBlue = '#8eaed4',
    bulletBlue = '#477685',
    green = '#007f00',
    signatureBlue = '#365F90',
    xecoSavingsColor = '#333333',
    noBordersCell = [false, false, false, false];
    allBorders = [true, true, true, true];

  return {
    generate: generate
  };

  function generate (data, logo) {
    console.log("in generator js");
    let docDefinition = {
      pageMargins: [40, 40, 40, 40],
      fontSize: 9,
      content: [
        //------------------- Cover -------------------
        //-------------------Page 2-------------------
        {
          image: logo,
          width: 250,
        },
        {
          margin: [0, -200, 0, 0],
          border: noBordersCell,
          stack: [
            {
              text: 'Phone: 541.388.4774',
            },
            {
              text: 'Fax: 541.385.9333',
            },
            {
              text: '925 SW Emkay Drive',
            },
            {
              text: 'Bend, OR 97702 USA',
            },
            {
              text: 'www.DENTInstruments.com',
            },
          ],
          alignment: 'right',
          style: {
            fontSize: 9,
          }
        },
        {
          margin: [0, 70, 0, 0],
          table: {
            widths: ['*', 'auto', '*'],
            body: [
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [0, 0, 0, 20],
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'Power Scout Certificate of Calibration',
                      
                      style: {
                        alignment: 'center',
                        bold: true,
                        fontSize: 20,
                      }
                    },
                  ]
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: [150,100, 240],
            style:{
              fontSize: 8,
            },
            border: [true, true, true, false],
            body: [
              [ 
                {
                  border: [true, true, false, false],
                  text: [
                    {
                      text: 'Date: ',
                      style: {
                        bold: true
                      }
                    },
                    'October 06 2016',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
                {
                  border: [false, true, false, false],
                  text: [
                    {
                      text: 'Time: ',
                      style: {
                        bold: true
                      }
                    },
                    '11:43',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
                {
                  border: [false, true, true, false],
                  text: [
                    {
                      text: 'Serial Number: ',
                      style: {
                        bold: true
                      }
                    },
                    data,
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
              ],
              [ 
                {
                  border: [true, false, false, false],
                  text: [
                    {
                      text: 'Technician: ',
                      style: {
                        bold: true
                      }
                    },
                    'CAW',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
                {
                  border: [false, false, false, false],
                  text: [
                    {
                      text: 'Part#: ',
                      style: {
                        bold: true
                      }
                    },
                    'PS3037-S-N',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
                {
                  border: [false, false, true, false],
                  text: [
                    {
                      text: 'Description: ',
                      style: {
                        bold: true
                      }
                    },
                    'Firmware Version: 4.73',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
              ],
              [ 
                {
                  border: [true, false, false, true],
                  text: [
                    {
                      text: 'MAC ID ADDRESS: ',
                      style: {
                        bold: true
                      }
                    },
                    ' ',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
                {
                  border: [false, false, false, true],
                  text: [
                    {
                      text: ' ',
                      style: {
                        bold: true
                      }
                    },
                    ' ',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
                {
                  border: [false, false, true, true],
                  text: [
                    {
                      text: 'Description: ',
                      style: {
                        bold: true
                      }
                    },
                    'PS2027 Serial Modbus No Display Set 200A CTs',
                  ],
                  style: {
                    alignment: 'left',
                  }
                },
              ],
              
            ],
          },
        },
        {
          margin: [0, 20, 0, 20],
          text: 'Logger Measurements',
          style: {
            fontSize: 10,
            bold: true,
          }
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: [100,100, 100, 100, 80],
            body: [
              [ 
                {
                  border: [true, true, false, false],
                  text: 'Volts Measurement ',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, true, false, false],
                  text: 'Voltage Reading',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, true, false, false],
                  text: 'Voltage Reference',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, true, false, false],
                  text: 'Percent Error',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'Pass/Error',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
              ],
              [ 
                {
                  border: [true, false, false, false],
                  text: 'L1 Measurement ',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, false, false, false],
                  text: '310.241',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '310.661',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '0.135',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'PASS',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
              ],
              [ 
                {
                  border: [true, false, false, false],
                  text: 'L1 Measurement ',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, false, false, false],
                  text: '310.241',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '310.661',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '0.135',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'PASS',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
              ],
              [ 
                {
                  border: [true, false, false, true],
                  text: 'L1 Measurement ',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, false, false, true],
                  text: '310.241',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '310.661',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '0.135',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, true, true],
                  text: 'PASS',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
              ],
            ],
          },
        },
        {
          margin: [0, 20, 0, 0],
          table: {
            widths: [100,100, 100, 100, 80],
            body: [
              [ 
                {
                  border: [true, true, false, false],
                  text: 'Volts Measurement ',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, true, false, false],
                  text: 'Voltage Reading',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, true, false, false],
                  text: 'Voltage Reference',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, true, false, false],
                  text: 'Percent Error',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'Pass/Error',
                  style: {
                    bold: true,
                    alignment: 'left',
                    fontSize: 8,
                  },
                },
              ],
              [ 
                {
                  border: [true, false, false, false],
                  text: 'L1 Measurement ',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, false, false, false],
                  text: '310.241',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '310.661',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '0.135',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'PASS',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
              ],
              [ 
                {
                  border: [true, false, false, false],
                  text: 'L1 Measurement ',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, false, false, false],
                  text: '310.241',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '310.661',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '0.135',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'PASS',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
              ],
              [ 
                {
                  border: [true, false, false, true],
                  text: 'L1 Measurement ',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 8,
                  }
                },
                {
                  border: [false, false, false, true],
                  text: '310.241',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '310.661',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '0.135',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
                {
                  border: [false, false, true, true],
                  text: 'PASS',
                  style: {
                    alignment: 'right',
                    fontSize: 8,
                  },
                },
              ],
            ],
          },
        },
        {
          margin: [0, 20, 0, 0],
          text: 'Calibration Reference Instruments Used',
          style: {
            fontSize: 10,
            bold: true, 
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'DMM: Agilent Technologies 34461A, Serial #: MY53202979',
          style: {
            fontSize: 10,
            bold: true, 
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: 'DMM: Agilent Technologies 34411A, Serial #: MY48004275',
          style: {
            fontSize: 10,
            bold: true, 
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: 'The calibration of this device is traceable to the Nationa Institute of Stabdards and Technology(NIST) using the above reference instruments',
          style: {
            fontSize: 10, 
            bold: true,
          }
        },
        //-------------------Page 4 - Index-------------------
        
      ],
      styles: {
        title: {
          fontSize: 8,
          bold: true,
        }
      }
    };

    return printer.createPdfKitDocument(docDefinition);
  }
};

