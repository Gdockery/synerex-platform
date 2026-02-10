module.exports = function (printer) {
  const gray = '#c0c0c0';
  return {
    generate: generate
  };

  function generate (invoiceData) {
  
    let hasBorder = [0, 1, 3, 5];
    let docDefinition = {
      pageOrientation: 'landscape',
      content: [
        {
          pageBreak: 'after',
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
                    widths: [175, 400, 175],
                    body: [
                      [
                        {
                          text: '',
                          margin: [0, 0, 2, 0],
                        },
                        {
                          margin: [2, 0, 2, 0],
                          layout: 'noBorders',
                          table: {
                            widths: [300],
			                     heights: [25],
                            body: [[{
                              text: invoiceData.company.name,
                              margin: [2, 2, 0, 2],
                              style: 'header'
                            }],
                            [{
                              text: 'BUDGET REPORT',
                              margin: [2, 2, 2, 2],
                              style: 'invoiceNumber'
                            }]]
                          }
                        },
                        {
                          text: '',
                          layout: 'noBorders',
                          margin: [2, -5, 0, 0],
                          table: {
                            body: [
                              [
                                {
                                  text: 'BUDGET DATE',
                                  style: 'invoiceH'
                                }
                              ],
                              [
                                {
                                  text: `${invoiceData.startDate} -- ${invoiceData.toDate}`,
                                  style: 'invoiceNumber'
                                }
                              ],
                              [
                                {
                                  text: `KW PEAK Rate: ${invoiceData.kwPeakRate}       KWH Rate: ${invoiceData.kwhRate}`,
                                  style: 'invoiceDate'
                                }
                              ],
                            ]
                          }
                        }
                      ]
                    ]
                  }
                }
              ],
              // ------------ SUMMARY -----------
              [
                {
                  margin: [0, 5, 0, 0],
                  border: [true, false, true, false],
                  text: '',
                }
              ],
              [
                {
                  text: 'ESTIMATED COST BREAKDOWN',
                  style: [
                    'centerBold',
                    {
                      fontSize: 14,
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
                    widths: [440, 60, 80, 160],
                    body: [
                      [
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          border: [false, true, true, false],
                          text: 'Subtotal:',
                          style: [
                            'invertColors',
                            {
                              bold: true,
                              fontSize: 12,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          border: [false, true, false, false],
                          text: invoiceData.subtotal,
                          style: ['invertColors', {
                            bold: true,
                            fontSize: 13,
                            alignment: 'right'
                          }]
                        }
                      ],
                      [
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          text: '',
                          border: [false, false, false, false],
                        },
                        {
                          border: [false, true, true, false],
                          text: 'Tax:',
                          style: [
                            'invertColors',
                            {
                              bold: true,
                              fontSize: 12,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          border: [false, true, false, false],
                          text: invoiceData.tax,
                          style: {
                            bold: true,
                            fontSize: 13,
                            alignment: 'right',
                            fillColor: gray
                          }
                        }
                      ],
                      [
                        {
                          border: [false, false, false, false],
                          margin: [20, 0, 0, 0],
                          text: '',
                        },
                        {
                          border: [true, true, true, false],
                          colSpan: 2,
                          text: 'Total Cost',
                          style: {
                            bold: true,
                            fontSize: 12,
                            alignment: 'right',
                          }
                        },
                        {
                          text: ''
                        },
                        {
                          border: [true, true, false, false],
                          text: invoiceData.totalCost,
                          style: {
                            bold: true,
                            fontSize: 14,
                            alignment: 'right',
                          }
                        }
                      ]
                    ]
                  }
                }
              ]
            ]
          }
        },
        
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
          alignment: 'center'
        },
        invoiceH: {
          fontSize: 8,
          bold: true,
          alignment: 'center',
          decoration: 'underline'
        },
        invoiceDate: {
          fontSize: 9,
          bold: true,
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
          text: 'Estimated Energy Usage',
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 12,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
        {
          text: 'Actual Daily Avg',
          style: [
            'invertColors',
            {
              alignment: 'center',
              fontSize: 12,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
        {
          text: 'Estimated Budget Results',
          style: [
            'invertColors',
            {
              fontSize: 12,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
        {
          text: 'Estimated Cost',
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 12,
              fillColor: gray,
              color: 'black',
            }
          ]
        },
      ],
      [
        {
          text: 'KW Peak',
          style: [
            'centerBold',
            {
              fontSize: 13,
            }
          ]
        },
        {
          text: '--',
          style: 
            {
              alignment: 'center',
              fontSize: 13,
            }
        },
        {
          text: `${invoiceData.kwPeak}`,
          style: [
            {
              fontSize: 13,
            }
          ]
        },
        {
          text: `${invoiceData.kwPeakCost}`,
          style: [
            'centerBold',
            {
              fontSize: 13,
            }
          ]
        },
      ],
      [
        {
          text: 'KWH',
          style: [
            'centerBold',
            {
              fontSize: 13,
            }
          ]
        },
        {
          text: `${invoiceData.avgDailyKwhUsage}`,
          style: 
            {
              alignment: 'center',
              fontSize: 13,
            }
        },
        {
          text: `${invoiceData.kwhUsage}`,
          style: [
            {
              fontSize: 13,
            }
          ]
        },
        {
          text: `${invoiceData.kwhCost}`,
          style: [
            'centerBold',
            {
              fontSize: 13,
            }
          ]
        },
      ],
    ];

    return {
      margin: [-5, -2, -5, 0],
      table: {
        widths: [200, 190, 170, 180],
        body: body
      }
    };
  }

};
  