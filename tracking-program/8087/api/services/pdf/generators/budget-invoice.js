module.exports = function (printer) {
  const gray = '#c0c0c0';
  return {
    generate: generate
  };

  function generate (invoiceData, clientLogo) {
    console.log("in budget invoice");
    let hasBorder = [0, 1, 3, 5];
    let docDefinition = {
      pageOrientation: 'landscape',
      content: [
        {
          layout: {
            hLineWidth: function (i, node) {
              if (hasBorder.indexOf(i) !== -1 || i === node.table.body.length) {
                return 1;
              }
              return 0;
            }
          },
          table: {
            body: [
              // ------------ HEADER -----------
              [
                {
                  margin: [2, 2, 2, 2],
                  layout: 'noBorders',
                  table: {
                    widths: [130, 105, 300, 155],
                    body: [
                      [
                        {
                          margin: [2, 0, 2, 0],
                          image: clientLogo,
                          width: 100,
                          height: 40,
                        },
                        {
                          margin: [2, 0, 2, 0],
                          text:'',
                        },
                        {
                          margin: [2, 0, 2, 0],
                          layout: 'noBorders',
                          table: {
                           width: [300],
                           heights: [20],
                            body: [[{
                              text: `  ENERGY USAGE INVOICE  `,
                              margin: [2, 2, 0, 2],
                              style: 'header'
                            }]],
                            style: {
                              alignment: 'center',
                            },
                          },
                          style: {
                            alignment: 'center',
                          },
                        },
                        {
                          text: '',
                          layout: 'noBorders',
                          margin: [2, -5, 0, 0],
                          table: {
                            body: [
                              [
                                {
                                  text: `Invoice #: ${invoiceData.invoiceNumber}`,
                                  style: 'invoiceH'
                                }
                              ],
                              [
                                {
                                  text: `Invoice Date: ${invoiceData.invoiceDate}`,
                                  style: 'invoiceH'
                                }
                              ],
                              [
                                {
                                  text: `Project Date: ${invoiceData.invoiceStartDate} -- ${invoiceData.invoiceEndDate}`,
                                  style: 'invoiceDate'
                                }
                              ],
                            ]
                          }
                        },
                      ],
                    ],
                    style: {
                      alignment: 'center',
                    },
                  },
                  style: {
                    alignment: 'center',
                  },
                }
              ],
              // ------------ SUMMARY -----------
              [
                {
                  margin: [-10, -2, 0, -3],
                  table: {
                    widths: [200, 265, 200],
                    body: [
                      [
                        {
                          margin: [10, 2, 10, 2],
                          border: [false, false, false, false],
                          style: {
                            fontSize: 8
                          },
                          table: {
                            widths: [205],
                            border: [false, false, false, false],
                            body: [
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.company.legalName,
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.company.location,
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              /*[
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.company.address.split('\n')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],*/
                              [
                                {
                                  border: [false, true, false, true],
                                  // text: 'Xeco Energy Corporation'
                                  columns: [
                                    {
                                      width: '*',
                                      text: `Contact: ${invoiceData.company.contactName}`,
                                      style: {
                                        alignment: 'center',
                                        bold: true
                                      }
                                    },
                                    {
                                      width: '*',
                                      text: `Tel: ${invoiceData.company.phone}`,
                                      style: {
                                        alignment: 'center',
                                        bold: true
                                      }
                                    }
                                  ],
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                 }
                              ],      

                            ]
                          }
                        },
                        {
                          border: [false, false, false, false],
                          margin: [0, 0, 0, 0],
                          table: {
                            widths: [41, 226],
                            body: [
                              
                              [
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                  
                                },
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                  
                                },
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                  
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                  
                                },
                                {
                                  border: [false, false, false, false],
                                  text: ''
                                }
                              ],
                              [
                                {
                                  border: [true, false, false, false],
                                  text: '',
                                  
                                },
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                  
                                },
                                {
                                  border: [false, false, false, false],
                                  text: '',
                                }
                              ],
                            ]
                          }
                        },
                        {
                          margin: [40, 10, 10, 20],
                          border: [false, false, false, false],
                          style: {
                            fontSize: 8
                          },
                          table: {
                            widths: [185],
                            body: [
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, 0, 0, 0],
                                  text: 'TO:',
                                  style: {
                                    bold: true,
                                    fillColor: 'black',
                                    color: 'white'
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: `${invoiceData.client.name}`,
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.client.address.split('\n')[0],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.client.address.split('\n')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [-2, -6, 0, 0],
                                  table: {
                                    widths: [93],
                                    body: [
                                      [
                                        {
                                          border: [false, false, false, false],
                                          margin: [-2, -2, 0, 0],
                                          text: `Tel: ${invoiceData.client.phone}`,
                                          style: {
                                            bold: true
                                          }
                                        },
                                        
                                      ]
                                    ]
                                  }
                                }
                              ]

                            ]
                          }
                        },
                      ]
                    ]
                  }
                }
              ],
              [
                {
                  text: 'Itemized Project Energy Usage',
                  style: [
                    'centerBold',
                    'invertColors',
                    {
                      fontSize: 9
                    }
                  ]
                }
              ],
              [
                createBillTable(invoiceData)
              ],
              [
                {
                  margin: [-5, -4, -5, -2],
                  table: {
                    widths: [425, 60, 80, 165],
                    body: [
                      [
                        {
                          border: [false, true, true, false],
                          rowSpan: 2,
                          colSpan: 2,
                          text: 'Thank you for your business. We do expect payment within the terms set forth in the ' +
                          'Master Agreement, SOW or Proposal, so please process this invoice within that time. There ' +
                          'will be a 1.5% interest charge per month on late invoices.',
                          style: {
                            fillColor: gray,
                            fontSize: 7
                          }
                        },
                        {
                          text: ''
                        },
                        {
                          border: [false, true, true, false],
                          text: 'Subtotal:',
                          style: [
                            'invertColors',
                            {
                              bold: true,
                              fontSize: 9,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          border: [false, true, false, false],
                          text: invoiceData.subtotal,
                          style: ['invertColors', {
                            bold: true,
                            fontSize: 10,
                            alignment: 'right'
                          }]
                        }
                      ],
                      [
                        {
                          border: [false, true, false, false],
                          text: 'TERMS & CONDITIONS',
                          colSpan: 2,
                          style: {
                            bold: true,
                            fontSize: 8,
                            decoration: 'underline'
                          }
                        },
                        {
                          text: ''
                        },
                        {
                          border: [false, true, true, false],
                          text: 'Tax:',
                          style: [
                            'invertColors',
                            {
                              bold: true,
                              fontSize: 9,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          border: [false, true, false, false],
                          text: invoiceData.tax,
                          style: {
                            bold: true,
                            fontSize: 10,
                            alignment: 'right',
                            fillColor: gray
                          }
                        }
                      ],
                      [
                        {
                          border: [false, false, false, true],
                          margin: [20, 0, 0, 0],
                          text: '',
                        },
                        {
                          border: [true, true, true, true],
                          colSpan: 2,
                          text: 'Total Project Amount Due:',
                          style: {
                            bold: true,
                            fontSize: 9,
                            alignment: 'right',
                          }
                        },
                        {
                          text: '',
                        },
                        {
                          border: [true, true, false, true],
                          text: invoiceData.totalCost,
                          style: {
                            bold: true,
                            fontSize: 10,
                            alignment: 'right',
                          }
                        },
                      ]
                    ]
                  }
                }
              ],
              [
                {
                  margin: [-5, 0, -5, -2],
                  table: {
                    widths: [160, 230, 80, 150, 100],
                    body: [
                      [
                        {
        
                          border: [false, true, true, false],
                          colSpan: 5,
                          text: 'Energy Usage Meter Parameters',
                          style: [
                            'invertColors',
                            {
                              bold: true,
                              fontSize: 8,
                              alignment: 'center'
                            }
                          ]
                        },
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                      ],
                      [
                        {
                          margin: [0, 10, 0, -3],
                          border: [true, false , false, false],
                          text: 'Identifed Equipment',
                          style: {
                            bold: true,
                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, 10, 0, -3],
                          border: [false, false, false, false],
                          text: `Invoice Meters:`,
                          style: {
                            fontSize: 6,
                            bold: true,
                          }
                        },
                        {
                          margin: [0, 10, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, 10, 0, -3],
                          border: [false, false, false, false],
                          text: 'Meter Configurations',
                          colSpan: 2,
                          style: {
                            bold: true,
                            fontSize: 6,
                           
                          }
                        },
                        {
                          margin: [0, 10, 0, -3],
                          text: '',
                          
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, -3],
                          border: [true, false , false, false],
                          text: 'Power Test Equipment',
                          style: {
                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'DENT ELITEpro XC MeterData Logger',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Power Channels',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '3-Wires',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, -3],
                          border: [true, false , false, false],
                          text: 'Current Transformer Type',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'CT Type = RoCoil; Phase Shift = 0.000',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Line Frequency',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '60 Hz/Cycle',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, -3],
                          border: [true, false , false, false],
                          text: '',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '- Power Vhi: L1, Vlo: N; PT=1.000; CT=5000.000',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Integration Period:',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '1-Sec. Cycle',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, -3],
                          border: [true, false , false, false],
                          text: '',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '- Power Vhi: L2, Vlo: N; PT=1.000; CT=5000.000',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Peak Demand Minutes:',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '1-Minute',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, -3],
                          border: [true, false , false, false],
                          text: '',
                          style: {

                            fontSize: 6,
                            decoration: 'underline',
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '- Power Vhi: L3, Vlo: N; PT=1.000; CT=5000.000',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Test Time Duration (XPS Off/On):',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '1-Hour',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, -3],
                          border: [true, false , false, false],
                          text: 'Accuracy',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: '0.2% (<0.1% typical) ANSCI C12.20-2010 Class 0.2',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Equipment Switching (XPS Off/On):',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'CMS Portal',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, -3, 0, 10],
                          border: [true, false , false, false],
                          text: 'Waveform Sampling',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, 10],
                          border: [false, false, false, false],
                          text: '200 samples/60Hz waveform, 2 waveforms/second',
                          style: {

                            fontSize: 6,
                          }
                        },
                        {
                          margin: [0, -3, 0, 10],
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          margin: [0, -3, 0, -3],
                          border: [false, false, false, false],
                          text: 'Firmware Version',
                          style: {

                            fontSize: 6,

                          }
                        },
                        {
                          margin: [0, -3, 0, 10],
                          border: [false, false, false, false],
                          text: 'ES400.226',
                          style: {

                            fontSize: 6,
                            
                          }
                        }
                      ],
                    ]
                  }
                }
              ],
              
            ]
          }
        },
        
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          fillColor: gray,
          alignment: 'center'
        },
        invoiceH: {
          fontSize: 8,
          bold: true,
          alignment: 'center',
        },
        invoiceDate: {
          fontSize: 7,
          alignment: 'center'
        },
        invoiceNumber: {
          bold: true,
          alignment: 'center'
        },
        centerBold: {
          bold: true,
          alignment: 'center'
        },
        invertColors: {
          fillColor: 'black',
          color: 'white'
        },
        termsText: {
          fontSize: 7
        },
        termsSubtitle: {
          bold: true,
          fontSize: 7
        }
      }
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  function createBillTable (invoiceData) {
    let body = [
      [
        {
          text: 'Demand',
          border: [false,false,false,false],
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 8,
              fillColor: gray,
              alignment: 'left',
              color: 'black',
            }
          ]
        },
        {
          text: '',
          border: [false,false,false,false],
          style: [
            'invertColors',
            {
              alignment: 'center',
              fontSize: 8,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
        {
          text: '',
          border: [false,false,false,false],
          style: [
            'invertColors',
            {
              fontSize: 8,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
      ],

      [
        {
          text: 'Avg 15-Min Interval',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
        {
          text: `${invoiceData.avgKwh}`,
          style: 
            {
              alignment: 'center',
              fontSize: 8,
            }
        },
        {
          text: '',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
      ],
      [
        {
          text: 'Project Hours',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
        {
          text: `${invoiceData.hoursInProject}`,
          style: 
            {
              alignment: 'center',
              fontSize: 8,
            }
        },
        {
          text: '',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
      ],
      [
        {
          text: 'Project kWh Used',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
        {
          text: `${invoiceData.kwhUsage}`,
          style: 
            {
              alignment: 'center',
              fontSize: 8,
            }
        },
        {
          text: '',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
      ],
      [
        {
          text: 'kWh Rate',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
        {
          text: `${invoiceData.kwhRate}`,
          style: 
            {
              alignment: 'center',
              fontSize: 8,
            }
        },
        {
          text: '',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
      ],
      [
        {
          text: 'Total Project kWh Energy Cost:',
          colSpan: 2, 
          style: [
            {
              alignment: 'left',
              fontSize: 9,
              bold: true,
            }
          ]
        },
        {
          text: '',
          style: 
            {
              alignment: 'center',
              fontSize: 9,
            }
        },
        {
          text: `${invoiceData.kwhCost}`,
          style: [
            {
              alignment: 'center',
              fontSize: 9,
              bold: true,
            }
          ]
        },
      ],

      [
        {
          text: `SUPPLIER   ${invoiceData.company.electricCompany}`,
          border: [false,false,false,false],
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 8,
              fillColor: gray,
              alignment: 'left',
              color: 'black',
            }
          ]
        },
        {
          text: '',
          border: [false,false,false,false],
          style: [
            'invertColors',
            {
              alignment: 'center',
              fontSize: 8,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
        {
          text: '',
          border: [false,false,false,false],
          style: [
            'invertColors',
            {
              fontSize: 8,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
      ],

      [
        {
          text: 'KW Peak (During Project Period)',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
        {
          text: `${invoiceData.kwPeak}`,
          style: 
            {
              alignment: 'center',
              fontSize: 8,
            }
        },
        {
          text: '',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
      ],
      [
        {
          text: 'kW Peak Rate (During Project Hours)',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
        {
          text: `${invoiceData.kwPeakRate}`,
          style: 
            {
              alignment: 'center',
              fontSize: 8,
            }
        },
        {
          text: '',
          style: [
            {
              fontSize: 8,
            }
          ]
        },
      ],
      [
        {
          text: 'Total Project kW Peak Energy Cost:',
          colSpan: 2, 
          style: [
            {
              alignment: 'left',
              fontSize: 9,
              bold: true,
            }
          ]
        },
        {
          text: '',
          style: 
            {
              alignment: 'center',
              fontSize: 9,
            }
        },
        {
          text: `${invoiceData.kwPeakCost}`,
          style: [
            {
              alignment: 'center',
              fontSize: 9,
              bold: true, 
            }
          ]
        },
      ],
    ];

    return {
      margin: [-5, -2, -5, 0],
      table: {
        widths: [255, 240, 245],
        body: body
      }
    };
  }


};
  