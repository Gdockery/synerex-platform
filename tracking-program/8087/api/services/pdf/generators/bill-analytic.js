module.exports = function (printer) {

  const gray = '#868686',
    lightGrayBG = '#d9d9d9',
    darkGrayBg = '#808080',
    green = '#006411',
    blueBG = '#00b0f0',
    xecoSavingsColor = '#333333',
    noBordersCell = [false, false, false, false];

  return {
    generate: generate
  };

  function generate (billData, coverPath, logoPath, exclusivePath) { 
    function numberWithCommas(x) {
      let str = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

      if (str.toString().indexOf(".") == -1) {
        str = str + '.00';
      }
      else if (str.toString().indexOf(".") == str.toString().length - 2) {
        str = str + '0';
      }
      return str;
    }
    
    let totalCost = parseFloat(billData.estimatedSavings.xecoEquipmentCost.replace(/,/g, '')) + 
      parseFloat(billData.estimatedSavings.partCost.replace(/,/g, '')) + 
      parseFloat(billData.estimatedSavings.projectManagementCost.replace(/,/g, '')) + 
      parseFloat(billData.estimatedSavings.meteringFee.replace(/,/g, '')) + 
      parseFloat(billData.estimatedSavings.discount.replace(/,/g, ''));
      //console.log('billData, coverPath, logoPath, exclusivePath');

    let tax = totalCost * billData.estimatedSavings.salesTax;

    totalCost = totalCost + tax;

    let totalCostStr = _.round(totalCost * 100) / 100;
    totalCostStr = numberWithCommas(totalCostStr);

    let taxStr = _.round(tax * 100) / 100;
    taxStr = numberWithCommas(taxStr);

    // take out discount line item, take the cost off the equipment
    let discountedEquipmentCost = _.round((parseFloat(billData.estimatedSavings.xecoEquipmentCost.replace(/,/g, '')) +
      parseFloat(billData.estimatedSavings.discount.replace(/,/g, ''))) * 100) / 100;
    let discountedEquipmentCostStr = numberWithCommas(discountedEquipmentCost);

    let estimatedROI = _.round(((totalCost * 12) / parseFloat(billData.estimatedSavings.annualSavings.replace(/,/g, ''))));
    
    let docDefinition = {
      pageMargins: [50, 100, 50, 50],
      header: function (page) {
        if (page != 1) {
          return {
            margin: [50, 35, 50, 50], 
            alignment: 'right',
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
          }
        }
      },
      footer: function (page) {
        if (page != 1) {
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
                        text: 'Xeco Energy Corporation',
                        style: {
                          bold: true
                        }
                      }
                    ],
                  },
                  {
                    text: 'Client Bill Analytic Services',
                    style: {
                      bold: true,
                      alignment: 'center'
                    }
                  },
                  {
                    text: `VERSION: ${billData.version}`,
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
          }
        }
      },
      content: [
        //------------------ cover ------------------
        {
          absolutePosition: {x: 41, y: 35},
          image: coverPath,
          width: 510,
          height: 750
        },
        {
          absolutePosition: {x: 370, y: 50},
          text: `Report No.: ${billData.reportNumber}-A`,
          style: {
            bold: true,
          }
        },
        {
          absolutePosition: {x: 100, y: 570},
          text: [
            `Prepared for: `,
            {
              text: billData.clientName,
              style: {
                bold: true
              }
            }
          ],
          style: {
            fontSize: 10
          }
        },
        {
          absolutePosition: {x: 165, y: 585},
          text: billData.clientAddress,
          style: {
            fontSize: 10,
            bold: true
          }
        },
        {
          pageBreak: 'after',
          absolutePosition: {x: 120, y: 613},
          text: [
            `Location: `,
            {
              text: billData.location,
              style: {
                bold: true
              }
            }
          ],
          style: {
            fontSize: 10
          }
        },
        //------------------ first page content ------------------
        {
          margin: [0, 20, 0, 0],
          layout: 'noBorders',
          width: '100%',
          table: {
            widths: [75, '*', 100],
            body: [
              [
                {
                  text: `Prepared for:`,
                  style: {
                    fontSize: 11,
                    bold: true,
                    alignment: 'right',
                  }
                },
                {
                  margin: [-5, 1, 0, 0],
                  text: billData.clientName,
                  style: {
                    fontSize: 10
                  },
                },
                {
                  text: billData.date,
		              style: {
                    fontSize: 8
                  },
                }
              ],
              [
                {
                  text: ``,
                },
                {
                  margin: [-5, 0, 0, 0],
                  text: billData.clientAddress.split('\n')[0],
                  style: {
                    fontSize: 10
                  },
                },
                {
                  text: '',
                }
              ],
              [
                {
                  text: ``,
                },
                {
                  margin: [-5, 0, 0, 0],
                  text: billData.clientAddress.split('\n')[1],
                  style: {
                    fontSize: 10
                  },
                },
                {
                  text: '',
                }
              ],
              [
                {
                  margin: [0, 0, 0, 0],
                  text: `Attn:`,
                  style: {
                    alignment: 'right',
                    bold: true,
                    fontSize: 11,
                  }
                },
                {
                  margin: [-5, 1, 0, 0],
                  text: billData.attn,
                  style: {
                    bold: true,
                    fontSize: 10
                  },
                },
                {
                  text: '',
                }
              ],
              [
                {
                  margin: [0, 5, 0, 0],
                  text: `Re: `,
                  style: {
                    alignment: 'right',
                    bold: true,
                    fontSize: 11,
                  }
                },
                {
                  margin: [-7, 6, 0, 0],
                  text: billData.reference,
                  style: {
                    bold: true,
                    fontSize: 10
                  },
                },
                {
                  text: '',
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Thank you for giving us the opportunity to provide a complete analysis of your current electrical ' +
          'service and charges. Enclosed is a comprehensive XECO Analytics Report detailing both the billing methods ' +
          'and electricity consumption for your review.',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'XECO is a full service independent testing, energy management company and provider of exclusive ' +
          'technology hardware designed to improve the characteristics of your facility’s complete electrical network ' +
          'environment.',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Our mission is to provide an independent technical service to enhance the safety, reliability and ' +
          'efficiency of electrical consumption.',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'A XECO Analytic Report has been prepared based on your monthly Utility Bill. The results are as' +
          ' follows:',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          table: {
            widths: ['10%', '*', '10%'],
            body: [
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: [false, true, false, false],
                  width: '*',
                  columns: [
                    {
                      width: '90%',
                      text: 'Minimum XECO BASELINE SAVINGS:',
                    },
                    {
                      width: '*',
                      alignment: 'right',
                      text: `${billData.baselineSavingsPercent}%`,
                      style: {
                        decoration: 'underline'
                      }
                    }
                  ],
                  style: {
                    bold: true,
                    fontSize: 10
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
                  width: '*',
                  border: noBordersCell,
                  columns: [
                    {
                      width: '90%',
                      text: 'Baseline R.O.I. (Months):',
                    },
                    {
                      width: '*',
                      alignment: 'right',
                      text: billData.baselineROI,
                      style: {
                        decoration: 'underline'
                      }
                    }
                  ],
                  style: {
                    bold: true,
                    fontSize: 10
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
                  border: [false, false, false, true],
                  width: '*',
                  columns: [
                    {
                      width: '90%',
                      text: 'Recommended number of XECO units to install in the facility:',
                    },
                    {
                      width: '*',
                      alignment: 'right',
                      text: billData.recommendedUnits,
                      style: {
                        decoration: 'underline'
                      }
                    }
                  ],
                  style: {
                    bold: true,
                    fontSize: 10
                  }
                },
                {
                  border: noBordersCell,
                  text: ''
                },
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Once our engineering team is deployed in your facility, we will break down the consumption of energy ' +
          'by equipment being used in the facility. Detailed engineering data will be compiled throughout the facility ' +
          'and comprehensive engineering reports will be prepared for review upon completion.',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'We look forward to having the opportunity of providing a complete systems review, inspection, power ' +
          'quality testing and installation proposal for your review.',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Again, thank you for the opportunity to provide our advanced engineering services to your facility.',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Respectfully Submitted,',
          style: {
            alignment: 'justify',
            fontSize: 11
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: `${billData.preparedBy}, Certified Project Manager`,
          style: {
            fontSize: 11,
            bold: true
          }
        },
        {
          margin: [0, 40, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  border: [false, true, false, false],
                  text: 'Xeco Energy Corporation - 1393 North Bennett Circle - Farmington, Utah 84025 - U.S.A. -' +
                  ' website: xecoenergy.com',
                  style: {
                    color: gray,
                    fontSize: 8,
                    bold: true,
                    alignment: 'center'
                  }
                }
              ]
            ]
          },
          pageBreak: 'after',
        },
        //------------------ electrical bill analysis ------------------
        {
          margin: [0, 10, 0, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'ELECTRIC BILL ANALYSIS',
                  style: {
                    alignment: 'center',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 16
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: `Report No.: ${billData.reportNumber}-A`,
          width: '*',
          style: {
            bold: true,
            width: '*',
            alignment: 'right',
            fontSize: 10
          }
        },
        {
          margin: [0, 70, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}]
        },
        {
          margin: [0, 15, 0, 0],
          width: '100%',
          table: {
            widths: [150, '*'],
            body: [
              [
                {
                  border: [true, true, false, false],
                  margin: [0, -5, 0, 0],
                  text: `Prepared for:`,
                  style: {
                    fontSize: 11,
                    alignment: 'right',
                  }
                },
                {
                  border: [false, true, true, false],
                  margin: [0, -4, 0, 0],
                  text: billData.clientName,
                  style: {
                    bold: true,
                    fontSize: 11
                  }
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: ``,
                },
                {
                  border: [false, false, true, false],
                  margin: [0, -5, 0, 0],
                  text: billData.clientAddress.split('\n')[0],
                  style: {
                    bold: true,
                    fontSize: 11
                  }
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: ``,
                },
                {
                  border: [false, false, true, false],
                  margin: [0, -5, 0, 0],
                  text: billData.clientAddress.split('\n')[1],
                  style: {
                    bold: true,
                    fontSize: 11
                  }
                }
              ],
              [
                {
                  border: [true, false, false, true],
                  margin: [0, -5, 0, 0],
                  text: `Attention:`,
                  style: {
                    alignment: 'right',
                    fontSize: 11,
                  }
                },
                {
                  border: [false, false, true, true],
                  margin: [0, -5, 0, 0],
                  text: billData.attn,
                  style: {
                    bold: true,
                    fontSize: 11
                  }
                }
              ],
              [
                {
                  border: [false, false, false, true],
                  margin: [0, 10, 0, 0],
                  text: ``,
                },
                {
                  border: [false, false, false, true],
                  margin: [0, 10, 0, 0],
                  text: ``,
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 10, 0, 0],
                  text: `Reference:`,
                  style: {
                    alignment: 'right',
                    bold: true,
                    fontSize: 9,
                  }
                },
                {
                  border: noBordersCell,
                  margin: [0, 10, 0, 0],
                  text: billData.reference,
                  style: {
                    bold: true,
                    fontSize: 7,
                    decoration: 'underline'
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, -5, 0, 0],
                  text: `Location:`,
                  style: {
                    alignment: 'right',
                    bold: true,
                    fontSize: 9,
                  }
                },
                {
                  border: noBordersCell,
                  margin: [0, -5, 0, 0],
                  text: billData.location,
                  style: {
                    bold: true,
                    fontSize: 9,
                    decoration: 'underline'
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 25, 0, 0],
          image: exclusivePath,
          width: 495
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  border: noBordersCell,
                  text: 'XECO UTILITY BILL ANALYTIC',
                  style: {
                    color: 'white',
                    fillColor: blueBG
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 10, 0, 0],
                  text: ''
                }
              ],
              [
                {
                  stack: [
                    'The information contained in this Analytical Report is for general information purposes only.' +
                    ' The information is provided by Xeco Energy Corporation. and while we endeavour to present' +
                    ' accurate and correct information, we make no representations or warranties ofany kind, express' +
                    ' or implied, about the completeness, accuracy, reliability, suitability or availability with' +
                    ' respect to this report or the information, products, services, or related information' +
                    ' contained in this report for any purpose. Any reliance you place on such information is' +
                    ' therefore strictly at your own risk.',
                    {
                      margin: [0, 10, 0, 0],
                      text: 'In no event will we be liable for any loss or damage including without limitation,' +
                      ' indirect or consequential loss or damage, or any loss or damage whatsoever arising from' +
                      ' loss of data or profits arising out of, or in connection with, the use of this report.',
                    }
                  ],
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'justify',
                    fontSize: 9
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 80, 0, 0],
          text: '©Copyright 2019 to Present by Xeco Energy Corporation. All rights reserved. Federal copyright law' +
          ' prohibits unauthorized reproduction by any means and imposes fines up to $25,000 for violation. This' +
          ' material may not be duplicated for any profit-driven enterprise.',
          style: {
            fontSize: 7
          },
          pageBreak: 'after'
        },
        //------------------ SUMMARY CONCLUSION FROM ELECTRIC BILL ANALYSIS ------------------
        {
          margin: [0, 5, 0, 0],
          layout: 'noBorders',
          width: '100%',
          table: {
            widths: [60, '*', 180],
            body: [
              [
                {
                  text: `Company:`,
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  margin: [-5, 0, 0, 0],
                  text: billData.clientName,
                },
                {
                  text: `Location: ${billData.location}`,
                  style: {
                    bold: true,
                    decoration: 'underline'
                  }
                }
              ],
              [
                {
                  text: '',
                },
                {
                  margin: [-5, -2, 0, 0],
                  text: billData.clientAddress.split('\n')[0],
                },
                {
                  text: '',
                }
              ],
              [
                {
                  text: ``,
                },
                {
                  margin: [-5, -2, 0, 0],
                  text: billData.clientAddress.split('\n')[1],
                },
                {
                  text: '',
                }
              ]
            ],
          },
          style: {
            fontSize: 8,
            bold: true
          },
        },
        {
          margin: [0, 5, 0, 0],
          table: {
            widths: [0, '*', '*', 85, 80],
            body: [
              [
                {
                  border: noBordersCell,
                  text: 'SUMMARY CONCLUSION FROM ELECTRIC BILL ANALYSIS',
                  colSpan: 5,
                  style: {
                    alignment: 'center',
                    bold: true,
                    fillColor: 'black',
                    color: 'white',
                    fontSize: 12
                  }
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
                  text: 'Estimated Savings Analysis from Client\'s Electric Bill (Prior to \'Walk-Thru\')',
                  colSpan: 5,
                  style: {
                    alignment: 'center',
                    bold: true,
                    fillColor: darkGrayBg,
                    color: 'white'
                  }
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
                  margin: [0, 10, 0, 0],
                  border: noBordersCell,
                  text: '',
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
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: 'Currency values based on ' + billData.projectCurrency,
                  style: {
                    fontSize: 6,
                    bold: true,
                    alignment: 'right'
                  }
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
                  text: ''
                },
                {
                  border: [false, true, false, true],
                  text: 'Month End Charge:',
                  style: {
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  text: billData.estimatedSavings.monthEndCharge,
                  style: {
                    alignment: 'right',
                    bold: true
                  }
                },
                {
                  border: [false, false, false, false],
                  text: 'XECO Savings ' + billData.projectCurrency,
                  style: {
                    alignment: 'right',
                    fillColor: xecoSavingsColor,
                    color: 'white',
                    bold: true
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
                  text: '',
                },
                {
                  border: [false, true, false, false],
                  margin: [-5, -5, -25, 0],
                  //canvas: [{type: 'line', x1: 0, y1: 5, x2: 350, y2: 5, lineWidth: 1}],
                  colSpan: 2,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
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
                  margin: [0, -5, 0, 0],
                  text: 'Customer Charge',
                  style: {
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  margin: [0, -5, 0, 0],
                  text: billData.estimatedSavings.customerCharge,
                  style: {
                    alignment: 'right',
                    bold: true
                  }
                },
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
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
              ...getChargesRows(billData.estimatedSavings.charges),
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
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: xecoSavingsColor
                  }
                },
                {
                  border: [false, true, true, false],
                  text: 'Estimated Bill with',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 7
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
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    fillColor: xecoSavingsColor
                  }
                },
                {
                  border: [false, false, true, false],
                  text: 'Xeco Savings',
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 7
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: [false, true, false, true],
                  text: 'Total Itemized Charges:',
                  style: {
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  text: billData.estimatedSavings.totalCharges,
                  style: {
                    alignment: 'right',
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  text: billData.estimatedSavings.totalSavings,
                  style: {
                    alignment: 'right',
                    fillColor: lightGrayBG,
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  text: billData.estimatedSavings.bill,
                  style: {
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
                  margin: [-5, -5, -50, 0],
                  canvas: [{type: 'line', x1: 0, y1: 5, x2: 432, y2: 5, lineWidth: 1}],
                  colSpan: 4
                  // text: ''
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 5, 0, 0],
                  text: '',
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
                  margin: [-5, 0, -5, 0],
                  text: 'Gauranteed % Savings',
                  style: {
                    alignment: 'center',
                    bold: true,
                    color: 'black',
                    fontSize: 7
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, -5, 0],
                  text: 'Improvement Potential',
                  style: {
                    alignment: 'center',
                    bold: true,
                    color: 'black',
                    fontSize: 7
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: 'Baseline % Savings:',
                  style: {
                    alignment: 'right',
                    bold: true,
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: `${billData.baselineSavingsPercent}%`,
                  style: {
                    alignment: 'center',
                    fillColor: 'black',
                    color: 'white',
                    bold: true,
                  }
                },
                {
                  text: `${billData.estimatedSavingsPercent}%`,
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 10, 0, 0],
                  text: '',
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
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: 'Estimated Annual Savings:',
                  style: {
                    alignment: 'right',
                    bold: true
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: `${billData.estimatedSavings.annualSavings}`,
                  style: {
                    alignment: 'center',
                    fillColor: 'black',
                    color: 'white',
                    bold: true
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
                  margin: [0, 5, 0, 0],
                  border: noBordersCell,
                  text: 'Estimated Cost for XECO Equipment & Parts:',
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [0, 5, 0, 0],
                  border: noBordersCell,
                  text: billData.estimatedSavings.xecoEquipmentCost,
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
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
                  text: 'Project Management/Engineering/Installation:',
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {

                  border: noBordersCell,
                  text: billData.estimatedSavings.projectManagementCost,
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
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
                  text: ' Annual Metering/Server Fee:',
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {

                  border: noBordersCell,
                  text: billData.estimatedSavings.meteringFee,
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
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
                  text: 'Shipping Costs:',
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {

                  border: noBordersCell,
                  text: billData.estimatedSavings.shippingFee,
                  style: {
                    alignment: 'right',
                    italics: true,
                    fontSize: 7
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
                  text: 'Estimated Tax:',
                  style: {
                    alignment: 'right',
                    bold: true,
                    color: 'black',
                    fontSize: 7
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {

                  border: noBordersCell,
                  text: billData.estimatedSavings.salesTax,
                  style: {
                    alignment: 'right',
                    bold: true,
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, -5, 0],
                  text: 'Estimated Xeco Units',
                  style: {
                    alignment: 'center',
                    bold: true,
                    color: 'black',
                    fontSize: 7
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: 'Total Estimated Cost of Project:',
                  style: {
                    alignment: 'right',
                    bold: true
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  text: billData.estimatedSavings.totalCost,
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                },
                {
                  text: billData.recommendedUnits,
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 10, 0, 0],
                  text: '',
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
                  text: 'Baseline R.O.I (Months):',
                  style: {
                    alignment: 'right',
                    bold: true
                  },
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, -5, 0],
                  text: 'Potential ROI',
                  style: {
                    alignment: 'center',
                    bold: true,
                    color: 'black',
                    fontSize: 7
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: '',
                  style: {
                    alignment: 'right',
                    bold: true
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  text: billData.baselineROI,
                  style: {
                    alignment: 'center',
                    fillColor: 'black',
                    color: 'white',
                    bold: true,
                  }
                },
                {
                  text: billData.estimatedROI,
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 10, 0, 0],
                  text: '',
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
                  text: ''
                },
                {
                  border: [true, true, false, false],
                  text: 'Estimated CO2 Reduction in Facility (Metric Tons):',
                  style: {
                    alignment: 'right',
                    bold: true,
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  text: billData.estimatedSavings.co2Reduction,
                  style: {
                    alignment: 'center',
                    fillColor: 'black',
                    color: 'white',
                    bold: true,
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
                  border: [true, false, true, true],
                  margin: [0, 0, 0, -2],
                  text: 'Note: CO2 calculations are based on EPA calculations',
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG,
                    italics: true
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
                {
                  border: noBordersCell,
                  text: ''
                }
              ],
            ],
          },
          style: {
            fontSize: 9
          },
          pageBreak: 'after',
        },
        //------------------ XECO Bill Analytics Detail Worksheet ------------------
        
        {
          margin: [0, 0, 0, 0 ],
          width: '*',
          text: 'XECO Bill Analytics Detail Worksheet',
          style: {
            alignment: 'center',
            bold: true,
            fontSize: 12
          }
        },
        {
          margin: [0, 10, 0, 0],
          layout: 'noBorders',
          width: '100%',
          table: {
            widths: [60, '*', 180],
            body: [
              [
                {
                  text: `Company:`,
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  margin: [-5, 0, 0, 0],
                  text: billData.clientName,
                },
                {
                  text: [
                    `Location:`,
                    {
                      text: billData.location,
                    },
                  ],
                  style: {
                    bold: true,
                    decoration: 'underline'
                  }
                }
              ],
              [
                {
                  text: '',
                },
                {
                  margin: [-5, -2, 0, 0],
                  text: billData.clientAddress.split('\n')[0],
                },
                {
                  text: '',
                }
              ],
              [
                {
                  text: ``,
                },
                {
                  margin: [-5, -2, 0, 0],
                  text: billData.clientAddress.split('\n')[1],
                },
                {
                  text: '',
                }
              ]
            ],
          },
          style: {
            fontSize: 8,
            bold: true
          },
        },
        {
          pageBreak: 'after',
          table: {
            widths: ['*', '*', '*', '*', '*', '*'],
            body: [
              [
                {
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'Reference:',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    {
                      text: billData.reference,
                      style: {
                        fontSize: 8,
                      }
                    }
                  ],
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'Report Date:',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    {
                      text: billData.reportDate,
                      style: {
                        fontSize: 8,
                      }
                    }
                  ],
                  style: {
                    alignment: 'right'
                  },
		              rowSpan: 2,
                },
                {
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'Supplier:',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    {
                      text: billData.clientSupplier,
                      style: {
                        fontSize: 8,
                      }
                    }
                  ],
                  style: {
                    alignment: 'center'
                  },
		              rowSpan: 2,
                },
                {
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'Account:',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    {
                      text: billData.clientAccount,
                      style: {
                        fontSize: 8,
                      }
                    }
                  ],
                  style: {
                    alignment: 'right'
                  },
		              rowSpan: 2,
                  colSpan: 2,
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'Energy Audit By:',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    {
                      text: billData.auditedBy,
                      style: {
                        fontSize: 8,
                      }
                    }
                  ],
                  style: {
                    alignment: 'center'
                  },
		              rowSpan: 2,
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: 'Currency values based on ' + billData.projectCurrency,
                  colSpan: 6,
                  style: {
                    fontSize: 6,
                    bold: true,
                    alignment: 'right'
                  }
                },
              ],
              [
                {
                  margin: [0, -4, 0, -4],
                  text: 'Electric Bill Evaluation/Analysis',
                  colSpan: 6,
                  style: {
                    bold: true,
                    alignment: 'center',
                    fontSize: 12,
                    color: 'white',
                    fillColor: darkGrayBg
                  }
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [-3, -2, -3, -2],
                  text: 'REFERENCE #1',
                  style: {
                    bold: true,
                    fontSize: 11,
                    color: 'white',
                    fillColor: 'black'
                  }
                },
                {
                  border: [false, false, true, false],
                  margin: [0, -2, 0, -2],
                  text: 'ELECTRICITY CONSUMPTION DATA',
                  colSpan: 5,
                  style: {
                    bold: true,
                    fontSize: 11,
                    color: 'white',
                    fillColor: 'black'
                  }
                }
              ],
              [
                {
                  margin: [-3, 0, -3, 0],
                  border: [true, false, false, false],
                  text: 'Bill',
                  style: {
                    fontSize: 10
                  }
                },
                {
                  border: noBordersCell,
                  text: billData.billAnalysis.bill,
                  style: {
                    alignment: 'right',
                    fontSize: 10
                  }
                },
                {
                  border: [false, false, true, false],
                  colSpan: 4,
                  text: '',
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [-3, -5, -3, 0],
                  text: 'kWh Consumed:',
                  style: {
                    fontSize: 9
                  }
                },
                {
                  border: noBordersCell,
                  margin: [0, -5, 0, 0],
                  text: billData.billAnalysis.kwhConsumed,
                  style: {
                    alignment: 'right',
                    fontSize: 9
                  }
                },
                {
                  border: [false, false, true, false],
                  margin: [-5, -2, 0, 0],
                  colSpan: 4,
                  text: '----This rate is calculated and based on electricity consumption from the electric bill (kWh).',
                  style: {
                    fontSize: 7
                  }
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [-3, -5, -3, 0],
                  text: 'kWh Total Rate:',
                  style: {
                    fontSize: 9
                  }
                },
                {
                  margin: [0, -2, 0, -3],
                  text: billData.billAnalysis.kwhTotalRate,
                  style: {
                    alignment: 'right',
                    fontSize: 9
                  }
                },
                {
                  border: [false, false, true, false],
                  colSpan: 4,
                  text: ''
                }
              ],
              [
                {
                  margin: [0, 15, 0, 0],
                  border: [true, false, false, false],
                  colSpan: 3,
                  text: ''
                },
                {
                  text: ''
                },
                {
                  text: ''
                },
                {
                  border: [false, false, true, false],
                  margin: [0, -3, 0, 0],
                  colSpan: 3,
                  rowSpan: 3,
                  text: [
                    'kVA Demand charge is based on a rate of ',
                    {
                      text: billData.billAnalysis.demandChargeRate,
                      //text: '$10.25 ',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    ' per kW. Overage is converted to kWh used above Baseline Supply. However, the total DEMAND' +
                    ' charge includes Demand charges.'
                  ],
                  style: {
                    fontSize: 7,
                  }
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [-3, 0, -30, 0],
                  text: 'Baseline kWh:(Supply)',
                  style: {
                    fontSize: 9
                  }
                },
                {
                  margin: [0, 0, 0, 0],
                  border: noBordersCell,
                  text: billData.billAnalysis.baselineKwh,
                  style: {
                    alignment: 'right',
                    fontSize: 9
                  }
                },
                {
                  border: [false, false, true, false],
                  margin: [-5, 0, 0, 0],
                  colSpan: 4,
                  text: [
		    'kWh ---- based on Load Factor ',
		    /*{
		       text: billData.calculatedWaste.powerFactor,
		       style: {
			  bold: true,
			  decoration: 'underline'
		       }
		    },
		    ' load factor '*/
		  ],
                  style: {
                    fontSize: 7,
                    bold: true
                  }
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [-3, -5, -30, 0],
                  text: 'Demand',
                  style: {
                    fontSize: 9
                  }
                },
                {
                  margin: [0, -5, 0, 0],
                  border: noBordersCell,
                  text: billData.billAnalysis.demand,
                  style: {
                    alignment: 'right',
                    fontSize: 9
                  }
                },
                {
                  border: [false, false, true, false],
                  margin: [-5, -5, 0, 0],
                  colSpan: 4,
                  text: [
		    'kWh Overage ---- based on Demand ',
		    /*{
		       text: billData.calculatedWaste.reactiveKvarWaste,
		       style: {
			  bold: true,
			  decoration: 'underline'
		       }
		    },
		    ' Demand '*/
		  ],
                  style: {
                    fontSize: 7,
                    bold: true
                  }
                }
              ],
              [
                {
                  border: [true, false, true, false],
                  margin: [0, 10, 0, 0],
                  text: '',
                  colSpan: 6
                },
              ],
              [
                {
                  border: [true, true, false, true],
                  margin: [-3, -3, -30, 0],
                  text: 'Total Overage Cost:',
                  style: {
                    fontSize: 9,
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  margin: [0, -3, 0, 0],
                  text: billData.billAnalysis.totalOverageCost,
                  style: {
                    alignment: 'right',
                    fontSize: 9,
                    bold: true
                  }
                },
                {
                  border: [false, false, true, false],
                  margin: [-5, -2, 0, 0],
                  colSpan: 4,
                  text: '---- Cost of energy consumed above Baseline Supply referenced as DEMAND or KVAR',
                  style: {
                    fontSize: 7
                  }
                }
              ],
              [
                {
                  border: [true, false, true, false],
                  margin: [10, 5, 10, 20],
                  text: [
                    {
                      text: 'NOTE: ',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    }, 'Provider\'s statement itemizes 3 points of billing, ',
		    {                   
                      text: ' kW, kWh ',
                      style: {
                        bold: true
                      }
                    },
                    'and ',
                    {
                      text: 'Power Factor/DEMAND/kVAR ',
                      style: {
                        bold: true
                      }
                    },
		    'without describing the cause of' +
                    ' billing. After further evaluation, ',
                    {
                      text: 'DEMAND ',
                      style: {
                        bold: true
                      }
                    }, 'means energy consumed above ',
                    {
                      text: 'BASELINE',
                      style: {
                        bold: true
                      }
                    }, ', and, ',
                    {
                      text: 'OVERAGE',
                      style: {
                        bold: true
                      }
                    }, ' is energy consumed above the allowable ',
                    {
                      text: 'DEMAND ',
                      style: {
                        bold: true
                      }
                    }, 'for the customer. For example, other energy providers classify this as Tier Billing.'
                  ],
                  style: {
                    fontSize: 8
                  },
                  colSpan: 6
                },
              ],
              [
                {
                  border: noBordersCell,
                  margin: [-2, 0, 0, 0],
                  text: 'REFERENCE #2',
                  colSpan: 2,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: 'Total Charges:',
                  style: {
                    alignment: 'right',
                    color: 'white',
                    bold: true,
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
                  border: [false, true, true, false],
                  text: '',
                  colSpan: 2
                }
              ],
              ...getAnalysisChargesRows(billData.billAnalysis.reference2Section1Charges),
              [
                {
                  border: noBordersCell,
                  margin: [-2, 0, 0, 0],
                  text: 'Total Charges: ',
                  colSpan: 2,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    bold: true
                  }
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: billData.billAnalysis.totalReference2Section1Charges,
                  style: {
                    alignment: 'right',
                    color: 'white',
                    bold: true,
                    fillColor: 'black'
                  }
                },
                {
                  border: [false, false, true, false],
                  text: '',
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, true, false],
                  margin: [10, 5, 10, 20],
                  text: [
                    {
                      text: 'NOTE: ',
                      style: {
                        bold: true,
                        decoration: 'underline'
                      }
                    },
                    'Provider\'s statement itemizes 3 points of billing that should be understood by the customer' +
                    /*{
                      text: ' Pk kW, On-Pk kW ',
                      style: {
                        bold: true
                      }
                    },
                    'and ',
                    {
                      text: 'Pk-KVAR',
                      style: {
                        bold: true
                      }
                    },*/
                    ' and is a means for billing the customer for the same energy consumed. It is our concern that the' +
                    ' Provider has already billed the customer for consuming the energy, which is represented by the ',
                    {
                      text: billData.billAnalysis.kwhConsumed,
                      style: {
                        bold: true
                      }
                    },
                    'kWh.'
                  ],
                  style: {
                    fontSize: 8
                  },
                  colSpan: 6
                },
              ],
              [
                {
                  border: [true, false, false, false],
                  text: 'BILL NOTES:',
                  style: {
                    bold: true,
                    alignment: 'right'
                  }

                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: [
                    {
                      text: '1. ',
                      style: {
                        bold: true
                      }
                    },
                    'See Tariff'
                  ],
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: [15, '*', '*', '*'],
                    body: [
                      [
                        {
                          border: [false, false, true, false],
                          text: 'Calculated Energy Waste from Bill',
                          style: {
                            color: 'white',
                            fillColor: 'black',
                            bold: true,
                            alignment: 'center'
                          },
                          colSpan: 4
                        }
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: '(Sourced from Bill. See below)',
                  style: {
                    fontSize: 7,
                    alignment: 'center'
                  },
                  rowSpan: 2
                },
                {
                  border: noBordersCell,
                  margin: [-4, 0, 0, 0],
                  text: [
                    {
                      text: '2. ',
                      style: {
                        bold: true
                      }
                    },
                    'See Tariff'
                  ],
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  // layout: 'noBorders',
                  table: {
                    widths: ['*', '*'],
                    body: [
                      [
                        {
                          border: [true, false, false, true],
                          text: 'kWh Consumed:',
                          style: {
                            alignment: 'left',
                            bold: true
                          },
                        },
                        {
                          border: [false, false, true, true],
                          text: billData.calculatedWaste.kwhConsumed,
                          style: {
                            alignment: 'right',
                            bold: true
                          },
                        },
                      ]
                    ]
                  },
                  colSpan: 3
                },
              ],
              [
                {
                  border: [true, false, false, false],
                  text: '',
                },
                {
                  border: noBordersCell,
                  margin: [-4, 0, 0, 0],
                  text: [
                    {
                      text: '3. ',
                      style: {
                        bold: true
                      }
                    },
                    'See Tariff'
                  ],
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: ['*', '*'],
                    body: [
                      [
                        {
                          text: `Peak kW: ${billData.supplySide.billedKw}`,
                          style: {
                            fillColor: lightGrayBG,
                            alignment: 'center',
                            bold: true
                          },
                        },
                        {
                          text: `15-Min kW Avg.: ${billData.calculatedWaste.Kw15Min}`,
                          style: {
                            bold: true,
                            alignment: 'right',
                          },
                        },
                      ]
                    ]
                  },
                  colSpan: 3
                },
              ],
              [
                {
                  border: [true, false, false, false],
                  text: '',
                },
                {
                  border: noBordersCell,
                  margin: [-4, 0, 0, 0],
                  text: [
                    {
                      text: '4. ',
                      style: {
                        bold: true
                      }
                    },
                    'See Tariff'
                  ],
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: [15, '*', '*'],
                    body: [
                      [
                        {
                          border: noBordersCell,
                          text: ''
                        },
                        {
                          border: [true, false, false, true],
                          text: 'Avg. Amp Draw:',
                          style: {
                            bold: true,
                            alignment: 'right',
                          }
                        },
                        {
                          border: [false, false, true, true],
                          margin: [-5, 0, 0, 0],
                          text: billData.calculatedWaste.avgAmpDraw,
                          style: {
                            alignment: 'right',
                            bold: true
                          },
                        }
                      ]
                    ]
                  },
                  colSpan: 3
                },
              ],
              [
                {
                  border: [true, false, false, false],
                  text: billData.billAnalysis.reference2Section2Charges[0].name,
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: billData.billAnalysis.reference2Section2Charges[0].amount,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: [15, '*', '*'],
                    body: [
                      [
                        {
                          border: noBordersCell,
                          text: ''
                        },
                        {
                          border: [true, false, false, true],
                          margin: [2, 0, -2, 0],
                          text: `Load Factor:`,
                          style: {
                            alignment: 'right',
                            bold: true
                          },
                        },
                        {
                          border: [true, false, false, true],
                          margin: [-5, 0, 0, 0],
                          text: billData.calculatedWaste.powerFactor,
                          style: {
                            alignment: 'right',
                            bold: true
                          },
                        }
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: billData.billAnalysis.reference2Section2Charges[1].name,
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: billData.billAnalysis.reference2Section2Charges[1].amount,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: [130, '*'],
                    body: [
                      [
                        {
                          border: [true, true, false, true],
                          text: `Reactive kVAR Supply Waste:`,
                          style: {
                            fillColor: lightGrayBG,
                            alignment: 'right',
                            bold: true,
                            fontSize: 7,
                          },
                        },
                        {
                          border: [false, false, true, true],
                          margin: [-5, 0, 0, 0],
                          text: billData.calculatedWaste.reactiveKvarWaste,
                          style: {
                            fillColor: lightGrayBG,
                            alignment: 'right',
                            bold: true
                          },
                        }
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: billData.billAnalysis.reference2Section2Charges[2].name,
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: billData.billAnalysis.reference2Section2Charges[2].amount,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: [130, '*'],
                    body: [
                      [
                        {
                          border: [true, true, false, true],
                          margin: [-5, 0, -5, 0,],
                          text: `Reactive kVAR Supply Waste (Amps):`,
                          style: {
                            fillColor: darkGrayBg,
                            color: 'white',
                            alignment: 'right',
                            bold: true,
                            fontSize: 7,
                          },
                        },
                        {
                          border: [false, false, true, true],
                          margin: [-5, 0, 0, 0],
                          text: billData.calculatedWaste.reactiveKvarSupplyWasteAmps,
                          style: {
                            fillColor: darkGrayBg,
                            alignment: 'right',
                            color: 'white',
                            bold: true
                          },
                        }
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: billData.billAnalysis.reference2Section2Charges[3].name,
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: billData.billAnalysis.reference2Section2Charges[3].amount,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, -3, -5, -3],
                  table: {
                    widths: [30, '*', '*', 35],
                    body: [
                      [
                        {
                          border: noBordersCell,
                          text: ''
                        },
                        {
                          border: [true, false, true, false],
                          text: 'MONTHLY SAVINGS RECAP',
                          style: {
                            alignment: 'center',
                            bold: true,
                            decoration: 'underline',
                            fontSize: 8
                          },
                          colSpan: 3,
                        }
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: billData.billAnalysis.reference2Section2Charges[4].name,
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: billData.billAnalysis.reference2Section2Charges[4].amount,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: noBordersCell,
                  margin: [-5, -4, -5, 0],
                  table: {
                    widths: [30, '*', '*', 35],
                    body: [
                      [
                        {
                          border: noBordersCell,
                          text: ''
                        },
                        {
                          border: [true, false, false, false],
                          text: 'Calc\'d Amp Savings:',
                          style: {
                            alignment: 'right',
                            fontSize: 7
                          }
                        },
                        {
                          border: [false, false, true, false],
                          text: _.round(billData.calculatedWaste.avgAmpDrawNum * billData.baselineSavingsPercent / 100,2),
                          style: {
                            alignment: 'right',
                            fontSize: 7,
                            bold: true
                          },
                          colSpan: 2,
                        },
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  text: billData.billAnalysis.reference2Section2Charges[5].name,
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  margin: [-5, 0, 0, 0],
                  text: billData.billAnalysis.reference2Section2Charges[5].amount,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: [false, false, true, false],
                  margin: [-5, -6, -5, -3],
                  table: {
                    widths: [30, '*', '*', 35],
                    body: [
                      [
                        {
                          border: noBordersCell,
                          text: ''
                        },
                        {
                          border: [true, false, false, false],
                          text: 'Calc\'d kW Savings:',
                          style: {
                            alignment: 'right',
                            fontSize: 7
                          }
                        },
                        {
                          border: [false, false, true, false],
                          text: _.round((billData.calculatedWaste.avgAmpDrawNum * billData.baselineSavingsPercent / 100) * .48,2),
                          style: {
                            alignment: 'right',
                            fontSize: 7,
                            bold: true
                          },
                          colSpan: 2,
                        },
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [0, -3, 0, -3],
                  text: 'Total Charges: ',
                  colSpan: 2,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                  }
                },
                {
                  border: [false, false, false, true],
                  text: ''
                },
                {
                  border: [false, false, false, true],
                  margin: [-5, -3, 0, -3],
                  text: billData.billAnalysis.totalReference2Section2Charges,
                  style: {
                    alignment: 'right',
                    color: 'white',
                    fillColor: 'black',
                  }
                },
                {
                  border: [false, false, true, true],
                  margin: [-5, -8, -5, -3],
                  table: {
                    widths: [30, '*', '*', 35],
                    body: [
                      [
                        
                        {
                          border: noBordersCell,
                          text: ''
                        },
                        {
                          margin: [0, 0, 0, -5],
                          border: [true, false, false, false],
                          text: 'Calc\'d kWh Savings:',
                          style: {
                            alignment: 'right',
                            fontSize: 7
                          }
                        },
                        {
                          border: [false, false, true, false],
                          text: _.round(billData.billAnalysis.kwhConsumed * billData.baselineSavingsPercent / 100,2),
                          style: {
                            alignment: 'right',
                            fontSize: 7,
                            bold: true
                          },
                          colSpan: 2,
                        },
                      ]
                    ]
                  },
                  colSpan: 3
                }
              ]
            ],
          },
          style: {
            fontSize: 9
          }
        },
        //------------------ Tariff Billing Factors: ------------------
        {
          margin: [0, 20, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}]
        },
        {
          border: [true, true, true, false],
          text: 'Tariff Billing Factors:',
          style: {
            bold: true,
            decoration: 'underline',
            fillColor: '#c5d9f1',
            fontSize: 9
          }
        },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  border: [true, true, true, false],
                  text: 'DETERMINATION OF DISTRIBUTION FACILITIES CHARGE:',
                  style: {
                    bold: true,
                    decoration: 'underline',
                    fillColor: '#c5d9f1',
                    fontSize: 9
                  }
                }
              ],
              [
                {
                  border: [true, false, true, true],
                  margin: [0, 100, 0, 0],
                  text: '',
                  style: {
                    fillColor: '#c5d9f1'
                  }
                }
              ]
            ]
          }
        },
        {
          border: noBordersCell,
          text: 'Currency values based on ' + billData.projectCurrency,
          style: {
            fontSize: 6,
            bold: true,
            alignment: 'right'
          }
        },
        //------------------ ADDITIONAL CHARGES: ------------------
        {
          margin: [0, 20, 0, 0],
          table: {
            widths: ['*', '*', '*', 125],
            body: [
              [
                {
                  border: [true, false, false, false],
                  margin: [0, 0, -2, 0],
                  text: 'REFERENCE #3',
                  style: {
                    bold: true,
                    color: 'white',
                    fillColor: 'black'
                  }
                },
                {
                  border: noBordersCell,
                  margin: [30, 0, 0, 0],
                  text: 'ADDITIONAL CHARGES',
                  style: {
                    bold: true,
                    color: 'white',
                    fillColor: 'black'
                  },
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: [false, true, true, false],
                  text: ''
                },
              ],
              ...getReference3ChargeRows(billData.billAnalysis.reference3Charges),
              [
                {
                  border: [true, false, false, false],
                  margin: [0, 0, -2, 0],
                  text: 'Customer Charge',
                },
                {
                  border: noBordersCell,
                  margin: [50, 0, 0, 0],
                  text: billData.reference3.customerCharge,
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  border: [false, false, true, false],
                  text: '',
                  colSpan: 2
                }
              ],
              [
                {
                  border: [true, false, false, false],
                  margin: [0, 0, -2, 0],
                  text: 'Total Additional Charges:',
                  style: {
                    bold: true,
                    color: 'white',
                    fillColor: darkGrayBg
                  }
                },
                {
                  border: noBordersCell,
                  margin: [50, 0, 0, 0],
                  text: billData.reference3.totalAdditional,
                  style: {
                    alignment: 'right',
                    bold: true,
                    color: 'white',
                    fillColor: darkGrayBg
                  }
                },
                {
                  border: [false, false, true, false],
                  text: '',
                  colSpan: 2
                }
              ],
              [
                {
                  border: [true, false, true, false],
                  margin: [0, 10, 0, 0],
                  text: '',
                  colSpan: 4
                }
              ],
              [
                {
                  border: [true, false, false, true],
                  margin: [0, 0, -2, 0],
                  text: 'Total Current Charges:',
                  style: {
                    bold: true,
                    color: 'white',
                    fillColor: darkGrayBg
                  }
                },
                {
                  border: [false, false, false, true],
                  margin: [50, 0, 0, 0],
                  text: billData.reference3.totalCurrent,
                  style: {
                    alignment: 'right',
                    bold: true,
                    color: 'white',
                    fillColor: darkGrayBg
                  }
                },
                {
                  border: [false, false, true, true],
                  text: '',
                  colSpan: 2
                }
              ]
            ]
          },
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          layout: 'noBorders',
          table: {
            widths: [75, 375],
            body: [
              [
                {
                  text: 'Conclusions:',
                  style: {
                    bold: true,
                    decoration: 'underline',
                    alignment: 'right',
                    fontSize: 10
                  }
                },
                {
                  text: ''
                }
              ],
              [
                {
                  text: '1.',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 10
                  }
                },
                {
                  text: [
                    'The customer is exceeding the provider\'s BASELINE SUPPLY by ',
                    {
                      text: `${billData.calculatedWaste.reactiveKvarWaste}%`,
                      style: {
                        bold: true
                      }
                    },
                    ' also known as ',
                    {
                      text: 'DEMAND.',
                      style: {
                        bold: true
                      }
                    },
                    ' The building\'s additional reactive energy is increasing the cost of electricity' +
                    ' and should be reduced.  The Xeco technology is designed to reduce a large portion of reactive energy in the building.']
                }
              ],
              [
                {
                  text: '2.',
                  style: {
                    bold: true,
                    alignment: 'right'
                  }
                },
                {
                  text: [
                    'Additional savings will occur when ',
                    {
                      text: 'Energy Provider ',
                      style: {
                        bold: true
                      }
                    },
                    'reduces the kW (Supply) for the BASELINE supply, since Client will be reducing its overall ',
                    {
                      text: 'DEMAND.',
                      style: {
                        bold: true
                      }
                    }
                  ]
                }
              ],
              [
                {
                  text: '3.',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 10
                  }
                },
                {
                  text: 'Additional savings will occur from the efficiency and heat improvement of the inductive' +
                  ' motors in the building, reducing the amount of money spent on cooling.'
                }
              ],
              [
                {
                  text: '4.',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 10
                  }
                },
                {
                  text: 'Additional savings will occur by the reduction of HARMONICS in the building, improving' +
                  ' the efficiency of resistive loads such as lighting, computers, production equipment, etc.,' +
                  ' caused by DC or VARIABLE FREQUENCY DRIVES in the building.'
                }
              ],
              [
                {
                  text: '5.',
                  style: {
                    bold: true,
                    alignment: 'right',
                    fontSize: 10
                  }
                },
                {
                  text: 'Additional savings will occur by reducing the EMF levels in the building which cause' +
                  ' resistive build-ups and inconsistent current flows on the RETURN LINE back to the MAIN METER.' +
                  ' The Xeco technology is designed to BALANCE CURRENT FLOWS in the electrical circuit by up to' +
                  ' 88%, allowing more efficient transfer of energy and lower resistance levels.'
                }
              ]
            ]
          },
          style: {
            fontSize: 9
          },
          pageBreak: 'after'
        }/*,
        //------------------ Supply-Side Considerations: ------------------
        {
          margin: [0, 20, 0, 0],
          text: 'Supply-Side Considerations:',
          style: {
            bold: true,
            fontSize: 10
          }
        },
        {
          margin: [5, 0, 0, 0],
          text: 'The below calculations serve as an indicator for how a kVA meter will be affected based on the' +
          ' Xeco Solution\'s ability to reduce electrical consumption in the Client\'s facility.',
          style: {
            fontSize: 9
          }
        },
        {
          border: noBordersCell,
          text: 'Currency values based on ' + billData.projectCurrency,
          style: {
            fontSize: 6,
            bold: true,
            alignment: 'right'
          }
        },
        {
          margin: [0,20,0,0],
          table: {
            widths: [65, 75, 64, 70, 63, 46, 60],
            body: [
              [
                {
                  text: 'BELOW VALUES REPRESENT CALCULATED REDUCTIONS ON THE \'SUPPLY-SIDE\'. THESE ADD\'L SAVINGS ' +
                  'MAY OR MAY NOT BE REFLECTED ON BILL.',
                  style: {
                    fillColor: lightGrayBG,
                    fontSize: 7
                  },
                  colSpan: 7
                },
                {
                  text: '',
                },
                {
                  text: '',
                },
                {
                  text: '',
                },
                {
                  text: '',
                },
                {
                  text: '',
                },
                {
                  text: '',
                }
              ],
              [
                {
                  text: billData.clientSupplier,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center'
                  },
                  colSpan: 2
                },
                {
                  text: '',
                },
                {
                  border: [true, true, true, false],
                  text: '',
                  rowSpan: 2
                },
                {
                  margin: [-2, 2, -2, 0],
                  text: 'Monthly kW Usage Meter #',
                  style: {
                    alignment: 'center'
                  },
                  rowSpan: 2
                },
                {
                  margin: [-2, 2, -2, 0],
                  text: 'Rec\'d New kW Supply+Reserve',
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center'
                  },
                  rowSpan: 2
                },
                {
                  margin: [-2, 2, -2, 0],
                  text: 'Monthly kW Savings',
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'center'
                  },
                  rowSpan: 2
                },
                {
                  margin: [-2, 0, -2, 0],
                  text: 'Rate/kW',
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center'
                  }
                }
              ],
              [
                {
                  border: [true, true, false, true],
                  text: 'Billed kW as of:',
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'right'
                  }
                },
                {
                  border: [false, true, true, true],
                  text: billData.supplySide.billedKWAsOf,
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'center'
                  },
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
                },
                {
                  text: billData.billAnalysis.demandChargeRate,
                  style: {
                    color: 'white',
                    fillColor: 'black',
                    alignment: 'center'
                  }
                }
              ],
              [
                {
                  margin: [0, 3, 0, 0],
                  text: `${billData.supplySide.billedKw} kW`,
                  style: {
                    fontSize: 14,
                    alignment: 'center'
                  },
                  colSpan: 2,
                  rowSpan: 2
                },
                {
                  text: '',
                },
                {
                  border: noBordersCell,
                  margin: [0, 0, -5, 0],
                  text: 'Current-----',
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  text: billData.supplySide.current.kwUsage,
                  style: {
                    alignment: 'center'
                  },
                },
                {
                  text: billData.supplySide.current.kwSupplyReserve,
                  style: {
                    alignment: 'center'
                  },
                },
                {
                  margin: [-2, 2, -2, 0],
                  text: billData.supplySide.current.kwSavings,
                  style: {
                    alignment: 'center'
                  },
                },
                {
                  text: billData.supplySide.current.rateKw,
                  style: {
                    alignment: 'center'
                  }
                }
              ],
              [
                {
                  text: '',
                },
                {
                  text: '',
                },
                {
                  border: noBordersCell,
                  margin: [0, 0, -5, 0],
                  text: 'After Xeco-----',
                  style: {
                    alignment: 'right'
                  }
                },
                {
                  text: billData.supplySide.afterXeco.kwUsage,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  },
                },
                {
                  text: billData.supplySide.afterXeco.kwSupplyReserve,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  },
                },
                {
                  text: billData.supplySide.afterXeco.kwSavings,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  },
                },
                {
                  //text: _.round(billData.billAnalysis.demandChargeRate * billData.supplySide.afterXeco.kwSavings,2),
                  text: billData.supplySide.afterXeco.rateKw,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  }
                }
              ],
              [
                {
                  margin: [0, 10, 0, 0],
                  border: noBordersCell,
                  text: '',
                  colSpan: 7
                }
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                  colSpan: 4
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
                  text: 'kW \'Supply-Side\' Reserve Calculations',
                  colSpan: 3,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  }
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
                  text: '',
                  colSpan: 4
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
                  text: 'Calculated Reserve %',
                  style: {
                    fontSize: 6,
                    bold: false,
                    alignment: 'center',
                    color: 'white',
                    fillColor: 'black'
                  }
                },
                {
                  margin: [-2, 0, -2, 0],
                  text: 'Unused kW Oversupply',
                  style: {
                    fontSize: 6,
                    bold: false,
                    alignment: 'center',
                    color: 'white',
                    fillColor: 'black'
                  }
                },
                {
                  text: 'Overbill',
                  style: {
                    alignment: 'center',
                    color: 'white',
                    fillColor: 'black'
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 0, -5, 0],
                  text: 'Current Cost of Reserve------',
                  style: {
                    alignment: 'right'
                  },
                  colSpan: 4
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
                  text: `${billData.reserveCalculations.current.reserve} %`,
                  style: {
                    alignment: 'center'
                  }
                },
                {
                  text: billData.reserveCalculations.current.unusedKwOversupply,
                  style: {
                    alignment: 'center'
                  }
                },
                {
                  text: billData.reserveCalculations.current.overbill,
                  style: {
                    center: 'center'
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 0, -5, 0],
                  text: 'Recommended Reserve Adjustment------',
                  style: {
                    alignment: 'right'
                  },
                  colSpan: 4
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
                  text: `${billData.reserveCalculations.recommended.reserve} %`,
                  style: {
                    alignment: 'center'
                  }
                },
                {
                  text: billData.reserveCalculations.recommended.unusedKwOversupply,
                  style: {
                    alignment: 'center'
                  }
                },
                {
                  text: billData.reserveCalculations.recommended.overbill,
                  style: {
                    center: 'center'
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 0, -5, 0],
                  text: 'Additional Reserve Savings:------',
                  style: {
                    alignment: 'right'
                  },
                  colSpan: 4
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
                  text: `${billData.reserveCalculations.savings.reserve} %`,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  }
                },
                {
                  text: billData.reserveCalculations.savings.unusedKwOversupply,
                  style: {
                    alignment: 'center',
                    fillColor: lightGrayBG
                  }
                },
                {
                  text: billData.reserveCalculations.savings.overbill,
                  style: {
                    center: 'center',
                    fillColor: lightGrayBG
                  }
                }
              ],
              [
                {
                  border: noBordersCell,
                  margin: [0, 0, -5, 0],
                  text: 'Total Estimated Monthly Client Savings with Reserve Adjustment:',
                  style: {
                    alignment: 'right',
                    color: 'white',
                    fillColor: 'black',
                    fontSize: 9
                  },
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
                },
                {
                  text: billData.totalReserveSavings,
                  style: {
                    alignment: 'right',
                    color: 'white',
                    fillColor: 'black'
                  },
		  colSpan:2,
                },
                /*{
                  text: billData.totalReserveSavingsPercent,
                  style: {
                    center: 'center',
                    color: 'white',
                    fillColor: 'black'
                  }
                }/
              ],
            ]
          },
          style: {
            bold: true,
            fontSize: 8
          }
        },
        {
          text: 'NOTE: Information contained in this report is an estimate based on calculated usage from the' +
          ' client\'s itemized electrical bill. An adjustment in calculations may be necessary once the \'Walk' +
          ' Through\' process has been completed in the Facility by a Certified Xeco Project Manager.',
          style:{
            fontSize: 6
          }
        }*/
      ]
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  function getChargesRows (charges) {
    let chargesRows = [];
    charges.forEach(function (charge) {
      let row = [
        {
          border: noBordersCell,
          text: ''
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.description,
        },
        {
          border: noBordersCell,
          margin: [0, -5, 0, 0],
          text: charge.amount,
          style: {
            alignment: 'right',
          }
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
        },
        {
          border: noBordersCell,
          text: ''
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
          text: '',
          style: {
            fillColor: xecoSavingsColor
          }
        },
        {
          border: noBordersCell,
          text: '',
        }
      ]);
    }
    return chargesRows;
  }

  function getAnalysisChargesRows (charges) {
    let chargesRows = [];
    charges.forEach(function (charge) {
      let row = [
        {
          border: [true, false, false, false],
          margin: [-3, -2, 0, -2],
          text: charge.name,
          colSpan: 2
        },
        {
          text: ''
        },
        {
          border: noBordersCell,
          margin: [0, -2, 0, -2],
          text: charge.amount,
          style: {
            alignment: 'right'
          }
        },
        {
          border: [false, false, true, false],
          text: '',
          colSpan: 3
        }
      ];
      chargesRows.push(row);
    });
    return chargesRows;
  }

  function getReference3ChargeRows(charges) {
    let chargesRows = [];
    charges.forEach(function (charge) {
      let row = [
        {
          border: [true, false, false, false],
          margin: [0, 0, -2, 0],
          text: charge.name,
        },
        {
          border: noBordersCell,
          margin: [50, 0, 0, 0],
          text: charge.amount,
          style: {
            alignment: 'right'
          }
        },
        {
          border: [false, false, true, false],
          text: '',
          colSpan: 2
        }
      ];
      chargesRows.push(row);
    });
    return chargesRows;
  }
};
