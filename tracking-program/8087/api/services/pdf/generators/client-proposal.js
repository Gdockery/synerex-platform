module.exports = function (printer) {

  const gray = '#808080',
    white = '#ffffff ',
    darkGray = '#404040',
    lightGray = '#a0a0a0',
    titleBlue = '#365f91',
    titleUnderlineBlue = '#8eaed4',
    bulletBlue = '#477685',
    green = '#00a70a',
    signatureBlue = '#365F90',
    xecoSavingsColor = '#333333',
    noBordersCell = [false, false, false, false];

  return {
    generate: generate
  };

  function generate (clientProposalData, coverPath, logoPath, indexLogoPath, calculatedEnergySavingsPath,
                     efficiencyGainsPath, advancingRedCurve, electricServiceBillPath, calculationPath,
                     projectManagersEngineersPath, etlLogoPath, xecoClientsPath,  installationMapPath, insuranceCoveragePath, signaturePath,
                     powerQualityComparison, powerQualityWithXeco, powerQualityWithoutXeco, xecoRealtimePortal, powerQualityImprovement, powerQualityCost, brandName) {
    brandName = brandName || 'Xeco'; // Default fallback
   
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

    console.log("generating proposal");    
    let totalCost = parseFloat(clientProposalData.estimatedSavings.xecoEquipmentCost.replace(/,/g, '')) + 
      parseFloat(clientProposalData.estimatedSavings.partCost.replace(/,/g, '')) + 
      parseFloat(clientProposalData.estimatedSavings.projectManagementCost.replace(/,/g, '')) + 
      parseFloat(clientProposalData.estimatedSavings.meteringFee.replace(/,/g, '')) + 
      parseFloat(clientProposalData.estimatedSavings.discount.replace(/,/g, ''));
   
    let tax = totalCost * clientProposalData.estimatedSavings.salesTax;
    totalCost = totalCost + tax;
    let totalCostStr = _.round(totalCost * 100) / 100;
    totalCostStr = numberWithCommas(totalCostStr);
    let taxStr = _.round(tax * 100) / 100;

    // take out discount line item, take the cost off the equipment
    let discountedEquipmentCost = _.round((parseFloat(clientProposalData.estimatedSavings.xecoEquipmentCost.replace(/,/g, '')) +
      parseFloat(clientProposalData.estimatedSavings.discount.replace(/,/g, ''))) * 100) / 100;
    let discountedEquipmentCostStr = numberWithCommas(discountedEquipmentCost);

    let estimatedROI = _.round(((totalCost * 12) / parseFloat(clientProposalData.estimatedSavings.annualSavings.replace(/,/g, ''))));

    console.log("generating still");    
    let docDefinition = {
      pageMargins: [50, 50, 50, 50],
      fontSize: 9,
      footer: function (page, total) {
        if (page != 1) {
          return {
            margin: [50, 0, 50, 0],
            columns: [
              {
                width: '*',
                columns: [{
                  alignment: 'center',
                  image: logoPath,
                  width: 80,
                }]
              },
              {
                margin: [10, 10, 0, 0],
                width: 350,
                text: 'ELECTRICITY MANAGEMENT TECHNOLOGIES AND ENERGY SUSTAINABILITY PROGRAM.',
                style: {
                  alignment: 'center',
                  bold: true,
                  color: gray
                }
              },
              {
                margin: [0, 10, 0, 0],
                alignment: 'center',
                width: '*',
                text: [
                  'Page ',
                  {
                    text: page,
                    style: {
                      bold: true
                    }
                  },
                  ' of ',
                  {
                    text: total,
                    style: {
                      bold: true
                    }
                  }
                ]
              }
            ],
            style: {
              fontSize: 8
            }
          }
        }
      },
      content: [
        //------------------- Cover -------------------
        {
          absolutePosition: {x: 41, y: 35},
          image: coverPath,
          width: 510,
          height: 755
        },
        {
          absolutePosition: {x: 370, y: 50},
          text: `Proposal No.: ${clientProposalData.proposalNumber}-P`,
          style: {
            bold: true,
          }
        },
        {
          absolutePosition: {x: 100, y: 600},
          text: [
            `Prepared for: `,
            {
              text: clientProposalData.clientName,
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
          pageBreak: 'after',
          absolutePosition: {x: 165, y: 615},
          text: clientProposalData.clientAddress,
          style: {
            fontSize: 10,
            bold: true
          }
        },
        //-------------------Page 2-------------------
        {
          image: logoPath,
          width: 80
        },
        {
          margin: [0, 40, 0, 0],
          text: clientProposalData.proposalDate,
          style: {
            bold: true,
            fontSize: 10
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: `Proposal No.: ${clientProposalData.proposalNumber}-P`,
          style: {
            bold: true,
            fontSize: 10,
            color: darkGray
          }
        },
        {
          text: 'Proposal prepared by:',
          style: {
            bold: true,
            fontSize: 10,
            color: darkGray
          }
        },
        {
          text: clientProposalData.preparedBy,
          style: {
            fontSize: 7,
            color: darkGray
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: clientProposalData.xecoName,
          style: {
            bold: true,
            fontSize: 10,
            color: darkGray 
          }
        },
        {
          text: clientProposalData.xecoAddress,
          style: {
            fontSize: 9,
            color: darkGray
          }
        },
        {
          text: clientProposalData.xecoAddress2,
          style: {
            fontSize: 9,
            color: darkGray
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Project Manager:',
          style: {
            bold: true,
            fontSize: 10,
            color: darkGray
          }
        },
        {
          text: clientProposalData.preparedBy,
          style: {
            fontSize: 7,
            color: darkGray
          }
        },
        {
          margin: [0, 30, 0, 0],
          table: {
            widths: ['*', 'auto', '*'],
            body: [
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  margin: [10, 0, 10, 0],
                  stack: [
                    {
                      text: 'NETWORK-WIDE CURRENT BALANCING TECHNOLOGY',
                      style: {
                        alignment: 'center',
                        bold: true
                      }
                    },
                    {
                      text: 'PROJECT PROPOSAL',
                      style: {
                        alignment: 'center',
                        bold: true,
                        fontSize: 20
                      }
                    }
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
          margin: [0, 30, 0, 0],
          text: 'Electricity Management Technologies and Energy',
          style: {
            bold: true,
            fontSize: 14,
            color: gray,
            alignment: 'right'
          }
        },
        {
          text: 'Sustainability for Implementation Program',
          style: {
            bold: true,
            fontSize: 14,
            color: gray,
            alignment: 'right'
          }
        },
        {
          margin: [0, -5, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}],
        },
        {
          text: 'Corporate Sustainability Technology Solution',
          style: {
            fontSize: 9,
            color: gray,
            alignment: 'right'
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'As Submitted To:',
          style: {
            bold: true,
            fontSize: 7,
            alignment: 'right'
          }
        },
        {
          text: clientProposalData.clientName,
          style: {
            fontSize: 8,
            alignment: 'right'
          }
        },
        {
          text: clientProposalData.clientAddress,
          style: {
            fontSize: 8,
            alignment: 'right'
          }
        },
        {
          margin: [0, 210, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    {
                      text: [
                        {
                          text: 'NOTICE: ',
                          style: {
                            bold: true
                          }
                        },
                        'All projects incorporating XECO’s Engineering and Testing Protocol are unique' +
                        ' to each facility based on specific information obtained from each client regarding the' +
                        ' consumption of electricity. That information is available on a monthly basis as provided by' +
                        ' the electric utility in the form of the client’s billing statement and the electric' +
                        ' utility’s tariff and rate schedule. XECO’s projections of kWh and kW savings are not based' +
                        ' on square footage or other traditional units of measure, but are scientifically' +
                        ' calculated based on actual reductions generated by XECO’s electricity management technology.']
                    },
                    {
                      margin: [0, 5, 0, 0],
                      text: 'XECO’s projection of savings is based on a comprehensive analysis of actual current' +
                      ' consumption patterns within each client facility as created by the equipment operating on' +
                      ' the electric circuit within the facility. Once the loads are identified and measured XECO' +
                      ' can quantify to what extent the XPS technology will improve the load balancing on the' +
                      ' electric circuit and improve the physical operation of the inductive loads in the facility.' +
                      ' By analyzing the consumption patterns and the elements of the utility company’s tariff, XECO' +
                      ' can very accurately determine the monthly reduction in consumption and calculate the monthly' +
                      ' and annual kWh and kW savings and the economic value associated with those and other' +
                      ' relevant factors on the client’s monthly bill. Until XECO has the opportunity to analyze an' +
                      ' electric bill and create a comprehensive Bill Analytic Report it is not possible for XECO to' +
                      ' present an accurate projection of the kWh or total annual kW savings without using imprecise' +
                      ' estimates. The XECO approach is unique and the results are immediately measureable based on' +
                      ' science and standard electrical engineering principals without guesswork.'
                    }
                  ],
                  style: {
                    color: gray,
                    fontSize: 5
                  }
                }
              ]
            ]
          },
          pageBreak: 'after'
        },
        //-------------------Page 3-------------------
        {
          margin: [-10, 0, 0, 0],
          image: logoPath,
          width: 90
        },
        {
          margin: [10, 10, 0, 0],
          text: clientProposalData.proposalDate,
          style: {
            fontSize: 9
          }
        },
        {
          margin: [10, 10, 0, 0],
          text: clientProposalData.clientName,
          style: {
            fontSize: 9
          }
        },
        {
          margin: [10, 0, 0, 0],
          text: clientProposalData.clientAddress,
          style: {
            fontSize: 9
          }
        },
        {
          margin: [10, 0, 0, 0],
          text: ' ',
          style: {
            bold: true,
            fontSize: 9
          }
        },
        {
          margin: [10, 10, 0, 0],
          text: `Dear ${clientProposalData.clientManagerName}`,
          style: {
            fontSize: 9
          }
        },
        {
          margin: [10, 10, 0, 0],
          style: {
                    fontSize: 9
          },
          stack: [
                {
                  text: brandName + ' Energy Corporation' + ' is honored to present ' + clientProposalData.clientName + ' with this proposal for installation of the' +
                ' most comprehensive electricity management system (EMS) solution on the market today. We have designed the proposed' +
                ` solution to reduce the electricity consumption as recorded during ${clientProposalData.billDate} by meter ${clientProposalData.meterNumber} installed by` +
                ` ${clientProposalData.electricCompanyName} at the ${clientProposalData.clientAddress} location.`,
                  style: {
                    fontSize: 9
                  }
                },
                {
                  text: ' '
                },
                {
                  text: `Following the virtual facility 'Walk-thru' conducted on ${clientProposalData.analyticsDate}, we have published a Bill Analytic Report dated ${clientProposalData.analyticsDate} and project the following:`,
                  style: {
                    fontSize: 9
                  },
                },
                {
                  text: ' '
                },
                {
                  text: '___________________________________________________________________________________________________________________'
                },
                {
                  text: `- Minimum XECO BASELINE SAVINGS: ${clientProposalData.estimatedSavings.baselineSavingsPercent}% reduction in electricity consumption monthly`,
                  style: {
                    bold: true,
                  },
                },
                {
                  text: `- One-time project cost: ${clientProposalData.estimatedSavings.totalCost}`,
                  style: {
                    bold: true,
                  },
                },
                {
                  text: `- Baseline R.O.I. (Months): ${clientProposalData.estimatedSavings.baselineROI}`,
                  style: {
                    bold: true,
                  },
                },
                {
                  text: `- Recommended number of XECO units to be installed in the facility: ${clientProposalData.estimatedSavings.xecoUnits}`,
                  style: {
                    bold: true,
                  },
                },
                {
                  text: '___________________________________________________________________________________________________________________'
                },
              ],
        },
        {
          margin: [10, 20, 0, 0],
          text: 'Once our engineering team has installed the proposed configuration in the facility, we will activate the electricity monitoring' +
                ' component of our solution in order to generate ‘real-time’ consumption data for analysis and validation of the savings quoted in' +
                ' this proposal. The reporting system will provide detailed engineering data which will facilitate a complete system review,' +
                ' inspection, and power quality test of the electrical network throughout the facility. We will also prepare a comprehensive' +
                ' engineering report for your review upon completion of the installation.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [10, 20, 0, 0],
          style: {
            fontSize: 10
          },
          stack: [
                {
                  text: 'Following the receipt of a Purchase Order authorizing the start of the EMS project XECO will invoice the organization' +
                    ' as follows:',
                  style: {
                    fontSize: 9
                  }
                },
                {
                  text: `1. Prepayment before installation (30%) – ${clientProposalData.depositAmount}`,
                  margin: [20, 0, 0, 0],
                  style: {
                    fontSize: 8.5
                  }
                },
                {
                  text: `2. Payment after installation of the equipment and Xeco’s Installation verification (30%) – ${clientProposalData.installationAmount}`,
                  margin: [20, 0, 0, 0],
                  style: {
                    fontSize: 8.5
                  }
                },
                {
                  text: `3. Payment after successful performance test agreed to by both parties (40%) – ${clientProposalData.finalAmount}`,
                  margin: [20, 0, 0, 0],
                  style: {
                    fontSize: 8.5
                  }
                },
                {
                  text: `${clientProposalData.clientName} will provide XECO with an open Purchase Order covering the three payments per the agreement prior to installation.`,
                  margin: [0, 10, 0, 10],
                },
                {
                  text: 'Thank you for the opportunity to submit this proposal. We look forward to working with you and your management team on this important project.',
                },
              ],
        },
        {
          margin: [10, 10, 0, 0],
          text: 'Respectfully,',
          style: {
            fontSize: 10
          }
        },
        {
          margin: [10, 50, 0, 0],
          text: 'Gregory A. Dockery, CEO',
          style: {
            bold: true,
            fontSize: 10
          },
          pageBreak: 'after'
        },
        //-------------------Page 4 - Index-------------------
        {
          columns: [
            {
              width: '*',
              text: 'Corporate Sustainability Technology Solution',
              style: {
                color: gray,
                fontSize: 7
              }
            },
            {
              width: '*',
              text: 'Table of Contents',
              style: {
                color: gray,
                alignment: 'right',
                bold: true,
                fontSize: 8
              }
            }
          ]
        },
        {
          margin: [0, -5, 0, 50],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}],
        },
        {
          margin: [0, 0, 0, 0],
          text: '',
        },
        {
          margin: [0, 0, 0, 0],
          text: '',
        },
        {
          text: '',
        },
        {
          text: '',
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'INTRODUCTION',
              style: {
                bold: true
              }
            },
            ' ................................................................................................................. 3'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'SOLUTION OVERVIEW',
              style: {
                bold: true
              }
            },
            ' ....................................................................................................... 4'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Hardware overview ..................................................................................................... 4'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Power Quality Improvement Chart ........................................................................... 5'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Software Program Modules ....................................................................................... 5'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'PROJECT VALIDATION METHODOLOGY .',
              style: {
                bold: true
              }
            },
            ' .........................................................................5'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'XECO MARKET HISTORY',
              style: {
                bold: true
              }
            },
            ' .................................................................................................... 6'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Client Installations ....................................................................................................... 6'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Xeco Installation Map .................................................................................................. 6'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'PROJECT DESCRIPTION, PLANNING AND SCHEDULE',
              style: {
                bold: true
              }
            },
            ' ................................................. 7'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Project Description ...................................................................................................... 8'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Electric Bill Review ....................................................................................................... 8'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Facility Walk-Through .................................................................................................. 8'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Xeco Certified Program Managers and Engineers ................................................... 9'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Installation Planning .................................................................................................... 9'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Post Installation Metering and Testing ...................................................................... 9'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Xeco Engineering Experience ...................................................................................... 9'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'PROJECT SUMMARY',
              style: {
                bold: true
              }
            },
            ' ................................................................................................. 9'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            'Project Highlights ............................................................................................... 9'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Bill Analytic Summary. ................................................................................................. 11'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            ' Bill Analytic Summary Page ........................................................................................ 11'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'STATEMENT OF WORK',
              style: {
                bold: true
              }
            },
            ' ........................................................................................................ 11'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'SCHEDULE, TIMELINE, AND DELIVERABLES',
              style: {
                bold: true
              }
            },
            ' ................................................................... 12'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'VERIFICATION OF ECONOMIC BENEFITS',
              style: {
                bold: true
              }
            },
            ' ........................................................................ 13'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            'Project Verification Process ........................................................................................ 13'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            'Features of Facility Metering and Reporting System ............................................... 14'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'PAYMENT SCHEDULE',
              style: {
                bold: true
              }
            },
            ' .......................................................................................................... 15'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'INSURANCE COVERAGE',
              style: {
                bold: true
              }
            },
            ' ...................................................................................................... 15'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'PERFORMANCE AND QUALITY CONTROL',
              style: {
                bold: true
              }
            },
            ' ...................................................................... 16'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            'Performance Verification Process .............................................................................. 16'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            'Quality Control ............................................................................................................. 16'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: [
            {
              text: '',
              style: {
                bold: true,
              }
            },
            'Circuit and Equipment Installation Plan .................................................................... 16'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'VALIDITY OF PROPOSAL',
              style: {
                bold: true
              }
            },
            ' ..................................................................................................... 17'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [50, 0, 0, 0],
          text: [
            {
              text: 'XECO SENIOR MANAGEMENT TEAM',
              style: {
                bold: true
              }
            },
            ' ................................................................................ 18'
          ],
          style: {
            fontSize: 9
          }
        },
        
        //-------------------Page 5 - INTRODUCTION-------------------
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'Introduction',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'The improvement of commercial and industrial electricity consumption has become a top priority in' +
                ' the around the world for public and private, government and non-government organizations. While' +
                ' the benefits of energy efficiency projects appear to be obvious, commercial and industrial business' +
                ' managers continue to struggle to justify the funding and implementation of sustainable corporate-wide' + 
                ' energy management system (EMS) projects. Historically corporate executives and government officials' + 
                ' have struggled with the challenge of identifying, quantifying, justifying and validating the results of their' +
                ' investments in energy management projects...until now.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'XECO has developed the most compelling Electricity Management Solution (EMS) solution on the market' +     
                ' today in the opinion of installed clients. The solution is an integration of a unique hardware technology' +  
                ' designed to reduce kWh consumption with an information reporting system that provides client' +
                ' executives across multiple disciplines access to ‘real-time’ financial and operational data to facilitate' + 
                ' timely and accurate decision making. XECO’s solution is fundamentally a Power Quality Improvement' + 
                ' system that generates measurable and sustained benefits. The economic value for each installation is' + 
                ' verified immediately following installation and perpetually monitored and reported thereafter. ',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'XECO’s Value Proposition',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: brandName.toUpperCase() + ' Energy Corporation' + ' has created a highly productive electricity management solution by integrating our' + 
                ' proprietary XECO Power System (XPS) hardware technology with a comprehensive reporting system in order to' + 
                ' provide users with ‘real-time’ access to data that measures the increase in electricity consumption efficiency and' + 
                ' calculated the cost reductions for commercial and industrial facilities worldwide. Based on over twenty years of' + 
                ' research and field testing XECO has developed an engineering tool capable of determining the guaranteed baseline' + 
                ' cost reduction for any facility in advance of the EMS installation. ',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'The tool also specifies the hardware/software and one-time installation costs necessary to produce the guaranteed' + 
                ' savings, thereby facilitating the ROI calculation for the EMS installation. Post installation XECO’s information' + 
                ' reporting system provides a ‘real-time’ accounting of financial savings and operational improvements for each' + 
                ' facility. Knowing the financial impact of each EMS installation in advance of a procurement decision, coupled with' + 
                ' the capability to verify the savings post-installation allows XECO to offer each client a performance guarantee which' + 
                ' eliminates the risk normally associated with an EMS implementation.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'Consider the following: ',
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [50, 10, 0, 0],
          type: 'square',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'XECO offers each client a recurring energy saving guarantee'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'XECO’s solution provides for direct and measurable electricity cost savings, reduced' + 
                    ' equipment maintenance, a healthier work and learning environment due to the reduction of' +
                    ' EMF, and a lower carbon footprint for each facility due to the reduction in CO2 emissions;',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'With more than 3,500 XPS units installed in the U.S., Mexico, China and Belgium (as of' +
                    ' February 2020) Xeco has an established track record for evidenced-based performance' + 
                    ' across multiple industry segments;',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'XECO’s technology is a solid-state electronics platform, easily installed within existing' + 
                    ' facilities, requiring no maintenance or calibration, with a life expectancy of twenty years or' + 
                    ' more; and',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Xeco’s technology has been awarded the ETL, UL and CE marks of approval.'
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'XECO’s EMS project return on investment and cost of ownership set the industry standard. The ROI calculations for XECO’s EMS' + 
                ' have historically ranged between eighteen to thirty months. On average the ROI for our clients have been less than twenty-five' + 
                ' months.  Cost of ownership of the installed solution is negligible. Since XECO’s maintenance-free technology is based on solid-' + 
                ' state electronics there is no ongoing support costs are virtually eliminated. XECO’s technology has currently been installed for' + 
                ' over ten years without a failure not caused by an outside influence. The projected life expectancy of the units is up to twenty' + 
                ' years. The only recurring costs are an annual Metering/Server fee based on the amount of data collected from the meters' + 
                ' installed by XECO in each facility. ',
          style: {
            fontSize: 9
          }
        },
        //-------------------Page 6 - TECHNOLOGY IDENTIFICATION-------------------
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: ' XECO Solution Overview',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'XECO’s approach to electricity management is a significant departure from traditional energy management' + 
                ' ystems. XECO’s solution includes a proprietary hardware technology that tunes the 60 hertz frequency to' + 
                ' balance and improve the current flow throughout a facility\'s electrical network. The result is a reduction in reactive' + 
                ' energy or kVAR and a significant improvement in the operational efficiency of inductive loads, evidenced by a' + 
                ' measurable and sustainable reduction in amp loads and kWh consumption.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'XECO’s approach to electricity management is based on the following assumption and a unique approach:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, 0],
          image: powerQualityCost,
          width: 400,
        },
        {
          margin: [0, 10, 0, 0],
          text: '6 The following two graphics represent the impact XECO’s 60 Hz tuning has on the Current Flow within each electrical network:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, 0],
          image: powerQualityWithoutXeco,
          width: 400,
        },
        {
          margin: [50, 10, 0, 0],
          image: powerQualityWithXeco,
          width: 400,
        },
        {
          margin: [0, 10, 0, 0],
          text: '7 The next graphic demonstrates the actual improvement in Power Quality Improvement and reduction in AMP Loads XECO’s technology creates within an electrical circuit:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, 0],
          image: powerQualityImprovement,
          width: 400,
        },
        {
          margin: [0, 10, 0, 0],
          text: '8 The final graphic indicates the actual improvement in power quality XECO’s technology had on an electrical circuit:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, 0],
          image: powerQualityComparison,
          width: 400,
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: ' XECO’s Information Reporting',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'After the hardware components of the EMS have been installed and activated XECO will enable the information' + 
                ' reporting software and provide access to the online Management Dashboard. The information system provides ‘real-' + 
                ' time’ financial and engineering data. Below is an example of the information available via the dashboard:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, 0],
          image: xecoRealtimePortal,
          width: 400,
        },
        {
          margin: [0, 10, 0, 0],
          text: 'XECO’s information reporting system provides a perpetual financial accounting and facility operations reporting platform that' + 
                ' can support one or multiple facilities on a local, regional, national or international basis. The reporting platform includes a' +  
                ' management portal that provides access to financial, facility operations and electrical network engineering data in ‘real-time’' + 
                ' to assist with more timely and accurate management decision making. ',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: ' XECO Hardware Overview',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'XECO\'s proprietary \'Current-Balancing\' technology is the company\'s latest technological advancement that produces' +
                ' measurable reductions in electricity consumption and improves the operating efficiency of electric loads. XECO\'s' +
                ' Current-Balancing\' technology includes the following benefits:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'Commercial Unit Features:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'square',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'Electrical Noise Reduction'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Power Factor Optimization',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Current-balance Frequency Tuning',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Voltage Regulation',
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'Commercial Unit Benefits:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'square',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'Reduces electricity required by existing inductive loads'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Enhances capacity of existing electrical system',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Reduces harmful EMF effects caused by electrical noise in the entire electrical system.',
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'Commercial Unit Specifications:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'square',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'The unit install in a three phase 480v system.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Predicted lifespan - 10 plus years',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Let Through Voltage - 600V Line-to-Line',
            },
             {
              margin: [0, 5, 0, 0],
              text: 'Current rate - 8.4 Amps'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Load Rating - supports 60 Amps circuit breaker',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Power consumption - 10 watts',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'EMI / RFI Noise Reduction - YES',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Designed to work in a 600 Volt or less, 3-Phase environment',
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 15, 0, 0],
          text: 'XECO’s solution is compatible with all international electrical networks and is applicable for most' +
                ' commercial and industrial facilities. The XECO Power System (XPS) technology is complemented by' +
                ' XECO’s exclusive Engineering and Testing Protocol (ETP) that facilitates a comprehensive analysis of the' +
                ' current level of a facility’s electricity consumption while projecting the specific level of reduction in' +
                ' consumption to be achieved using the technology. The engineering protocol also generates the specific' +
                ' technology configuration required to obtain the optimal level of electricity consumption reduction and' +
                ' calculates the economic benefit to be achieved when the recommended configuration is installed. Once' +
                ' the consumption reduction is calculated and the technology costs are specified, calculating the specific' +
                ' return on investment period and long term cost savings is simply a matter of mathematics.',
          style: {
            fontSize: 9
          }
        },
        //-------------------Page 8 - MARKET ASSESSMENT, PATH TO MARKET GROWTH-------------------
        {
          margin: [0, 10, 0, 0],
          text: 'Example of Xeco Power Quality Improvement',
          style: {
            fontSize: 11,
            color: green,
          }
        },
        {
          image: calculatedEnergySavingsPath,
          width: 410
        },
        {
          margin: [10, 15, 0, 0],
          text: 'XECO’S SOFTWARE MODULES',
          style: {
            fontSize: 10,
            color: green,
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'square',
          ul: [
            {
              margin: [0, 0, 0, 0],
              text: 'ENERGY ANALYTICS'
            },
            {
              margin: [0, 0, 0, 0],
              text: 'ADVANCED METERING',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'DEDECATED ENERGY SERVER',
            },
             {
              margin: [0, 0, 0, 0],
              text: 'BILL COST TRACKING'
            },
            {
              margin: [0, 0, 0, 0],
              text: 'ENERGY FORECASTING',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'MONTHLY BUDGETING',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'EQUIPMENT SCHEDULING',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'ACCURATE REPORTING',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'SECURE DATA COLLECTION',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'DATA BACKUP/CLOUD SERVER',
            },
            {
              margin: [0, 0, 0, 0],
              text: 'EMV CROSS-CHECKING FOR VERIFIED MEASUREMENTS',
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'Xeco Validation Methodology',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
                //-------------------Page 9 - MARKET ASSESSMENT, PATH TO MARKET GROWTH-------------------
        {
          pageBreak: 'after',
          margin: [0, 15, 0, 0],
          text: 'XECO uses a scientific and comprehensive engineering methodology to determine the financial and' +
                ' operational benefits a customer can expect when purchasing the XECO Power Systems Electricity' +
                ' Management System. The approach is a simple step by step \'make\'s sense\' process that produces' +
                ' information that will identify, qualify, justify, and validate that the use of XECO’s technology will' + 
                ' generate long-term economic benefits for facilities owned and operated by commercial and industrial' + 
                ' organization. Each step in the process provides the decision maker with the appropriate amount of' + 
                ' information to draw a logical and rational conclusion before moving on to the next step in the process.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'Once the economic value and ROI period are established the prospective buyer has all the data' + 
                ' necessary to make an informed and rational buying decision. The economic value established during' +
                ' the decision- making process is the criteria that is used to verify the performance results immediately' +
                ' after Xeco’s technology has been installed. The verification of performance and benefits is executed' + 
                ' following the completion of implementation using ‘real-time’ electricity consumption metering.' + 
                ' Consumption data is gathered during a 10-hour system ‘system on/system off’ testing period. The' + 
                ' on/off test data is then compared to the hourly ‘interval metering data’ gathered by the electric' + 
                ' utility company meter during the same time period. Assuming the data is a match the results will' + 
                ' verify compliance with the established performance criteria.',
          style: {
            fontSize: 9,
          }
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'XECO Market History',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'The XECO electricity management solution has been commercially available since 2009. The install' +
                ' base has evolved from small to midsize commercial facilities to large complex industrial facilities.' +
                ' Because XECO’s protocol produces a ‘customized’ configuration for every facility the results are' +
                ' specific and unique to each. XECO equipment has been installed in a wide variety of facilities across' +
                ' fifty-two different industry segments. Because of the proven results produced by the solution XECO' +
                ' currently has clients in the U.S., Mexico, China, and will have installations in Belgium and the' +
                ' Netherlands by the end of March 2020.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'SELECT XECO CLIENT INSTALLATIONS',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          margin: [0, 10, 0, 0],
          image: xecoClientsPath,
          width: 300,
        },
        {
          margin: [0, 0, 0, 0],
          text: 'Xeco’s installation sites include but are not limited to facilities owned and operated by the following:',
          style: {
            fontSize: 9,
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'XECO’s corporate target for the reduction of electricity consumption in each client facility is 8% to 12%' +
                ' with a target ROI of 24 months. Because no two facilities consume electricity at the same rate and' +
                ' because environmental conditions as well as the type and age of equipment in use, including lighting that' +
                ' contribute to the inductive load, the measurable performance of XECO’s solution will vary.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'XECO Installation Map',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          pageBreak: 'after',
          margin: [50, 20, 0, 0],
          image: installationMapPath,
          width: 350, 
        },
        //-------------------Page 10 - SCHEDULE A FACILITY “WALK THROUGH”-------------------
        {
          margin: [-50, 10, -50, 10],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'PROJECT DESCRIPTION, PLANNING AND SCHEDULE',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          text: 'XECO’s exclusive Engineering and Testing Protocol provides an efficient, logical, step-by-step process to determine' +
                ' the economic value, justification, and business case for implementing a measurable electricity management' + 
                ' solution. During Step 1 of XECO’s protocol a certified engineer will use the information from a client’s most' + 
                ' recent electric bill as well as the information listed in the appropriate electric utility’s tariff to create a' + 
                ' comprehensive analytic report that among other things will specify, according to the most recent electric bill, the' + 
                ' following:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'square',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'kWh consumption'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'kWh total rate',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Baseline kWh (supply provided by the electric utility)',
            },
             {
              margin: [0, 5, 0, 0],
              text: 'kVA Demand'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Total Demand cost',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'XECO’s projected monthly savings amount',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Cost of XECO’s solution',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Client ROI projection based on monthly savings amount',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Annual projection of cost savings from reduced electricity consumption',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Annual projected reduction of CO2 emissions in metric tons',
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'REVIEW OF CLIENT’S ELECTRIC BILL',
          style: {
            fontSize: 11,
            color: titleBlue
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: 'The purpose for reviewing the client’s electric bill is to identify all the relevant elements used by the electric utility to create the' +
                ' billing statement. The elements of the bill that must be identified are highlighted in the following graphic:',
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [50, 20, 0, 0],
          image: electricServiceBillPath,
          width: 400
        },

        //-------------------Page 11 - XECO’S CERTIFIED PROJECT MANAGERS AND ENGINEERS-------------------
        {
          text: 'The Bill Analytic data is a vital component to establish the feasibility of launching a project and' +
                ' determining the scope of benefits to be obtained from the use of XECO’s solution. Once' + 
                ' completed, the Bill Analytic Report is reviewed with the Client and assuming the data' +
                ' contained in the report is compelling it is appropriate to move to the next step in XECO’s' +
                ' protocol.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'FACILITY “WALK THROUGH”',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'This step in the process requires a Certified XECO Project Manager to identify all the active' + 
                ' circuits in the facility including documenting all resistive and inductive loads. The purpose of' + 
                ' this process is to locate all loads in the facility that are contributing to the kW and kWh' + 
                ' consumption shown on the Client\'s Electric Bill and to verify the power quality improvement' + 
                ' and economic benefits specified in the Bill Analytic Report. This comprehensive approach' + 
                ' assures the Client will receive the maximum benefit of energy saving opportunities available in' + 
                ' the facility.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, 0],
          image: calculationPath,
          width: 400
        },
        {
          margin: [0, 20, 0, 0],
          text: 'XECO’S CERTIFIED PROJECT MANAGERS AND ENGINEERS',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'Once the XECO \'walk-through\' has been completed, the XECO Project Manager will enter the collected' +
                ' data into the facility installation plan documentation.' ,
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          columns: [
            {
              width: '*',
              text: 'Each XECO Project manager has been completely trained and' +
                    ' certified by Certified Instructors for managing the XECO' + 
                    ' hardware and software installations in facilities under any' +
                    ' load condition. Comprehensive testing and metering will be' + 
                    ' done by Certified Engineers before, during and after the' + 
                    ' installation process to ensure a reduction of electricity' + 
                    ' consumption, as well as continuously test and monitor the' + 
                    ' circuits in the facility.' ,
              style: {
                fontSize: 9
              }
            },
            {
              image: projectManagersEngineersPath,
              width: 100
            }

          ]
        },
        {
          margin: [0, 20, 0, 0],
          text: 'INSTALLATION PLANNING',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'After the customer reviews and accepts the proposal, the next step is to obtain a signed agreement on ' + 
                ' the XECO Power Systems Installation work order. The installation work order will detail the' + 
                ' installation schedule and the roles and responsibilities of all parties involved. Once the installation' + 
                ' schedule has been developed, XECO will coordinate the physical installation plan with the customer' + 
                ' and/ or third party resources to complete the process. Once the installation of the XECO Power' + 
                ' Systems (XPS) configuration and the Wireless Meters have been activated, monitoring electricity' + 
                ' consumption during the month will be possible. Setting the appropriate kilowatt hourly rate for the' + 
                ' facility in the meters permits ‘real-time’ reporting of consumption data on a minute, hourly, daily, and' + 
                ' monthly basis and storage of the data on Xeco’s Secure Server for management retrieval.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'POST INSTALLATION METERING AND TESTING',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'The meters installed by XECO Engineers will enable ‘full facility’ metering of electricity consumption' + 
                ' within the facility. Data collected during the testing immediately following installation will verify the' + 
                ' actual reduction in consumption and confirm the projections that were used to build the business' + 
                ' case and justification for the XECO installation. The metering test will collect data with XECO’s' + 
                ' configuration both ‘on’ and ‘off’. The data can be collected for periods of time in increments of' + 
                ' minutes, hours, days or longer as deemed appropriate and compared if desired to the actual interval' + 
                ' consumption data collected by the electric utility. Because the results are timely and actual there is' +
                ' essentially immediate confirmation of the value produced by XECO’s installation. A certified' + 
                ' engineer will have ample information to prepare a comprehensive engineering report documenting' + 
                ' the impact on each circuit in the facility along with the full-facility metering test data that will' + 
                ' validate the results of the successful XECO energy management project.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'XECO ENGINEERING EXPERIENCE',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'XECO\'s proprietary \'Current-Balancing\' technology is in a league of its own. With over 22 years of research,' + 
                ' field testing and design, XECO engineers have developed a complete turnkey hardware and software' + 
                ' solution to calculate the reduction of electricity consumption in virtually any commercial or industrial,' + 
                ' private or public sector facility, as well as document the reduction of Electromagnetic Frequency (EMF)' + 
                ' radiation and reducing the facility\'s Carbon Footprint.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'PROJECT SUMMARY',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'PROJECT HIGHLIGHTS',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'Xeco is excited about the opportunity to install the latest in energy management technology to your facility.' +
                ' Clients in the U.S., Mexico and China are currently experiencing the financial and operational advantages the' +
                ' proposed hardware and software solution will provide. In this section of the proposal we will provide the' + 
                ' specific detail of the economic benefits.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'Xeco’s engineering protocol was used to produce a Bill Analytic Report based on the January 2018 electric bill' +
                ' issued by Delmarva Electric for the following facility:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [40, 0, 0, 0],
          text: clientProposalData.clientName,
          style: {
            bold: true,
            fontSize: 10,
          }
        },
        {
          margin: [40, 0, 0, 0],
          text: clientProposalData.clientAddress,
          style: {
            bold: true,
            fontSize: 10, 
          }
        },
        //-------------------Page 12-------------------------
        {
          margin: [0, 10, 0, 0],
          text: 'BILL ANALYTIC SUMMARY',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'The results of the analysis indicate a compelling business case for cost reduction and CO2 reduction as follows:',
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [15, 10, 0, 15],
          type: 'square',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: `Baseline reduction in the consumption of electricity in the facility – ${clientProposalData.estimatedSavings.baselineSavingsPercent}%`
            },
            {
              margin: [0, 5, 0, 0],
              text: `Annual guaranteed cost savings for the facility - ${clientProposalData.estimatedSavings.annualSavings}`,
            },
            {
              margin: [0, 5, 0, 0],
              text: `One-time EMS project costs for the facility - ${clientProposalData.estimatedSavings.totalCost}`,
            },
             {
              margin: [0, 5, 0, 0],
              text: `ROI period based on the baseline savings vs. project cost – ${clientProposalData.estimatedSavings.baselineROI}`,
            },
            {
              margin: [0, 5, 0, 0],
              text: `Annual CO2 reduction for the facility – ${clientProposalData.estimatedSavings.estimatedCo2Reduction} metric tons`,
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, -10, 0, 0],
          text: `${clientProposalData.clientName} BILL ANALYTIC SUMMARY (ACTUAL)`,
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: `Below is the summary page from the Bill Analytic Report for ${clientProposalData.clientAddress} facility. The estimated savings is` +
                ` based on a review of the electrical bill for the facility. Based on the bill provided we have calculated` +
                ' the percentage of electricity consumption for the facility and the estimated the monthly dollar' + 
                ' savings and projected savings for an entire year. The information in this Proposal will be confirmed' +
                ' during the ‘Walk Through’ process. The quantity of XECO units and other adjustments to the' +
                ' proposed configuration may change based on the results of the ‘Walk Through.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 10, 25, 0],
          table: {
            widths: [5, '*', '*', 65, 65],
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
                    fillColor: darkGray,
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
                  border: noBordersCell,
                  text: '',
                },
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  border: noBordersCell,
                  text: 'Values based on US Dollars',
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
                  text: clientProposalData.estimatedSavings.monthEndCharge,
                  style: {
                    alignment: 'right',
                    bold: true
                  }
                },
                {
                  border: [false, false, false, false],
                  text: 'XECO Savings ' + clientProposalData.projectCurrency,
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
                  border: noBordersCell,
                  margin: [-5, -5, -25, 0],
                  canvas: [{type: 'line', x1: 0, y1: 5, x2: 333, y2: 5, lineWidth: 1}],
                  colSpan: 2
                  // text: ''
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
                  text: clientProposalData.estimatedSavings.customerCharge,
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
              ...getChargesRows(clientProposalData.estimatedSavings.charges),
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
                  text: clientProposalData.estimatedSavings.totalCharges,
                  style: {
                    alignment: 'right',
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  text: clientProposalData.estimatedSavings.totalSavings,
                  style: {
                    alignment: 'right',
                    fillColor: lightGray,
                    bold: true
                  }
                },
                {
                  border: [false, true, false, true],
                  text: clientProposalData.estimatedSavings.bill,
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
                  canvas: [{type: 'line', x1: 0, y1: 5, x2: 500, y2: 5, lineWidth: 1}],
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
                  text: 'Baseline XECO % Savings:',
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
                  text: `${clientProposalData.estimatedSavings.baselineSavingsPercent}%`,
                  style: {
                    alignment: 'center',
                    fillColor: 'black',
                    color: 'white',
                    bold: true,
                  }
                },
                {
                  text: `${clientProposalData.estimatedSavings.estimatedSavingsPercent}%`,
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
                  text: 'Baseline Annual Savings:',
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
                  text: `${clientProposalData.estimatedSavings.annualSavings}`,
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
                  text: 'Cost for XECO Equipment & Parts:',
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
                  text: clientProposalData.estimatedSavings.xecoEquipmentCost,
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
                  text: clientProposalData.estimatedSavings.projectManagementCost,
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
                  text: clientProposalData.estimatedSavings.meteringFee,
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
                  text: ' Shipping Costs: ',
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
                  text: clientProposalData.estimatedSavings.shippingFee,
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
                  text: clientProposalData.estimatedSavings.salesTax,
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
                  text: clientProposalData.estimatedSavings.totalCost,
                  style: {
                    alignment: 'center',
                    bold: true,
                  }
                },
                {
                  text: clientProposalData.estimatedSavings.xecoUnits,
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
                    bold: true,
                    fontSize: 7
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
                  colSpan: 2
                },
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  text: clientProposalData.estimatedSavings.baselineROI,
                  style: {
                    alignment: 'center',
                    fillColor: 'black',
                    color: 'white',
                    bold: true,
                  }
                },
                {
                  text: clientProposalData.estimatedSavings.estimatedROI,
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
                  text: clientProposalData.estimatedSavings.estimatedCo2Reduction,
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
                    fillColor: lightGray,
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
              ]
            ]
          },
          style: {
            fontSize: 9
          }
        },
        {
          text: 'Add’l Note: Estimated number of Xeco units are subject to change after ‘Walk-Through’ process has been completed.',
          style: {
            fontSize: 8,
            bold: true
          },
          pageBreak: 'after'
        },
        //-------------------Page 13 - XECO’S DRAFT STATEMENT OF WORK-------------------
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'STATEMENT OF WORK',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'XECO DRAFT STATEMENT OF WORK',
          style: {
            bold: true,
            alignment: 'center',
            fontSize: 14
          }
        },
        {
          text: '(Document is for review purposes only)',
          style: ['title',
            {
              alignment: 'center',
              fontSize: 10
            }
          ]
        },
        {
          margin: [0, 5, 0, 0],
          text: 'ENERGY MANAGEMENT SYSTEM (EMS) PROPOSAL',
          style: {
            alignment: 'center',
            fontSize: 12
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            'This Statement of Work (“SOW”) is effective as of ____________________________  (“SOW” Effective Date”) by and' +
            ' between',
            {
              text: ` brandName.toUpperCase() + ' Energy Corporation' (Provider”) and ${clientProposalData.clientName} (“Company”) pursuant to the Master Agreement (“Agreement”)`,
              style: {
                bold: true
              }
            },
            ' contemporaneously or previously entered into between the parties, and this SOW' +
            ' is incorporated by reference into',
            {
              text: ' Exhibit A (“Proposal”)',
              style: {
                bold: true
              }
            },
            ' to this Agreement.'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 20],
          text: 'Description of Services: See attached proposal in Exhibit A for description of Services (the' +
          ' “Proposal”). For purposes of the attached Exhibit A, Provider further represents, warrants and covenants' +
          ' as follows:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [70, -15, 50, 0],
          ol: [
            {
              margin: [0, 5, 0, 0],
              text: 'Provider hereby acknowledges and agrees that any and all warranties on all products sold or' +
              ' provided to Company under the Agreement shall be passed through to Company to the extent permissible' +
              ' by law. Further, to the extent that Provider cannot pass through such warranties to Company,' +
              ' Provider shall provide back-to-back warranties to Company pursuant to which Provider shall provide' +
              ' to Company substantially similar warranty coverage as the underlying warranties on such products.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Provider agrees Company (or Provider if designated by Company) will perform before and after' +
              ' KWH readings on each of the pieces of equipment on which the Products have been installed in order' +
              ' to determine the KWH reduction achieved by each Product. Provider agrees to supply calculated' +
              ' reports to validate savings from each Product installed prior to leaving the premises and once the' +
              ' facility installation is completed.'
            }
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            {
              text: 'Prices:',
              style: {
                bold: true
              }
            },
            ' See attached Client Proposal for pricing.'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            {
              text: 'Payment Terms:',
              style: {
                bold: true
              }
            },
            ' Company agrees to pay Provider based on the agreed upon terms and conditions. The chosen Option shall' +
            ' be stated clearly on the original Purchase Order issued by the Company.'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            {
              text: 'Term of SOW:',
              style: {
                bold: true
              }
            },
            '  Subject to the terms and conditions of the Agreement, the term of this SOW (the “SOW” Term) shall' +
            ' commence on the SOW Effective Date and continue until the project set forth in the Proposal shall have' +
            ' been completed. For the avoidance of doubt, all sections of the Proposal which by their term are' +
            ' intended to survive the termination or expiration of the Proposal shall survive the expiration or' +
            ' termination of this SOW.'
          ],
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 20, 0, 0],
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: brandName.toUpperCase() + ' Energy Corporation',
                  style: {
                    bold: true
                  }
                },
                {
                  margin: [0, 25, 0, 0],
                  text: 'By: ____________________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'PrintedName: _________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'Title: __________________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'Date: __________________________________'
                }
              ]
            },
            {
              width: '*',
              stack: [
                {
                  text: clientProposalData.clientName,
                  style: {
                    bold: true
                  }
                },
                {
                  margin: [0, 25, 0, 0],
                  text: 'By: ____________________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'PrintedName: _________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'Title: __________________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'Date: __________________________________'
                }
              ]
            }
          ],
          style: {
            fontSize: 9
          }
        },
        //-------------------Page 14 - STATEMENT OF WORK SCHEDULE, TIMELINES AND DELIVERABLES-------------------
        {
          margin: [-50, 10, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'SCHEDULE, TIMELINES AND DELIVERABLES',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'WORK SCHEDULE, TIMELINE AND DELIVERABLES',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          text: 'The schedule and timeline for a XPS project implementation will be unique to each facility. The' +
          ' variable in facility size, electrical circuit complexity and the number and type of equipment in use in' +
          ' the facility will dictate the schedule and timeline. Due to the work that is completed during the second' +
          ' step in XECO’s engineering and testing protocol the all relevant information for the implementation of' +
          ' the XPS configuration will be specifically documented in XECO’s proposal. The roles and responsibilities' +
          ' of all participants is clearly articulated and agreed to in advance.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 15, 0, 0],
          text: 'Under normal circumstance implementation schedules can be completed in weeks as opposed to months.' +
          ' All implementation timelines will be specified in XECO’s proposal.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [10, 10, 0, 0],
          text: 'Project deliverables will include the following:',
          style: {
            fontSize: 9,
            bold: true
          }
        },
        {
          margin: [50, 5, 0, 0],
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'Detailed listing of the planned installation of XPS units to be installed in 80% of the facility.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'The type and size of each XPS unit.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'The identifying name or number of the electrical circuit, switch gear, motor or other inductive' +
              ' load device within the facility that will have an XPS attached or interfaced.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'A comprehensive data analysis of the ‘before and after’ KWH consumption, KVA and KVAR levels in' +
              ' the facility.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'A detailed analysis of data collected during the post installation facility metering process.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'An executive management summary report of all XPS post installation performance data.'
            }
          ],
          style: {
            fontSize: 9,
          }
        },
        {
          margin: [10, 10, 0, 0],
          text: 'Power quality benefits of the XPS technology include, but are not limited to:',
          style: {
            fontSize: 9,
            bold: true
          }
        },
        {
          margin: [50, 5, 0, 0],
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'Stabilizes the supply voltage and reduces kVA Demand in the building.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Improves Power Factor efficiencies in equipment.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Reduces power-line electromagnetic fields for improved ‘Current Flow’.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Extends the life of equipment and appliances.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Reduces heat in motors for minimizing maintenance and repair.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Improves surge and brown out protection.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Improves line characteristics to maximize efficiency levels.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Improves line harmonics for protecting resistive loads.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Improves "Startup" and Voltage transient suppression.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Reduce Carbon Emissions in the building.'
            }
          ],
          style: {
            fontSize: 9,
          }
        },
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'VERIFICATION OF ECONOMIC BENEFITS',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'PROJECT VERIFICATION PROCESS',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 5, 0, 0],
          text: 'From the first step to the last step in XECO’s Engineering and Testing Protocol there' + 
                ' are projections and verifications of the economic benefits to be obtained from the' + 
                ' deployment of the XECO technology. The method of developing the initial value' + 
                ' proposition and business case for the procurement of XECO’s solution is based on' + 
                ' client data obtained from the electric bill and the electric utility’s tariff.' + 
                ' Once XECO prepares the Bill Analytic Report and completes the facility ‘walk-thru’' + 
                ' the client and XECO are in a qualified position to reach agreement on the' + 
                ' expectations for economic and operational performance by the recommended' + 
                ' XECO technology configuration. From that point on XECO and the client or the' + 
                ' client’s designated electrical engineering resources will work collaboratively to' + 
                ' complete the installation and measure the results.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'During the installation XECO Engineers will install a ‘full facility’ metering system' + 
                ' designed to monitor the ‘real time’ consumption of electricity within the facility.' + 
                ' The data collected during the period immediately following the installation will' + 
                ' provide data that will verify the actual reduction in consumption and confirm the' + 
                ' projections that were used to build the initial business case and justification for the' + 
                ' XECO installation. The metering test will collect data with the XECO configuration' + 
                ' both ‘on’ and ‘off’ for comparison and quantification. The data can be collected for' + 
                ' periods of time in increments of minutes, hours, days or longer as deemed' + 
                ' appropriate and compared if desired to the actual interval consumption data' + 
                ' routinely collected by the electric utility. Because the data is actual consumption' + 
                ' data and because it is collected in a timely manner there is essentially immediate' + 
                ' confirmation of the value produced by the XECO installation. As such a certified' + 
                ' engineer will have ample information to prepare a comprehensive engineering' + 
                ' report for the client’s management team documenting XECO’s impact on each' + 
                ' circuit in the facility along with the full-facility metering test data that' + 
                ' substantiates the results of the successful XECO energy management project.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'FEATURES OF FACILITY METERING AND REPORTING SYSTEM',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          margin: [50, 10, 0, 0],
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'Energy Monitoring & Reporting 24x7.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Consumption and demand reporting - By interval, hourly, daily, weekly, monthly & yearly.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Graphical Load Profile and real-time consumption and demand values such as voltage, current, power factor and more.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Drill down capability with identification of peak consumption and demand.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Baseline creation capability.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Energy Usage Comparison: Meter vs. Meter, Meter vs. Baseline or Baseline vs. Baseline.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Billing - Apply energy usage to tariffs.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Charting Voltage, Current, Power factor and Demand.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Rich Reporting - Consumption and summary reports.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Data Export to pdf, Word, Excel and CSV'
            }
          ],
          style: {
            fontSize: 9,
          }
        },
         //-------------------Dave 15-------------------
        {
          margin: [-50, 20, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'PAYMENT SCHEDULE',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: 'PAYMENT SCHEDULE DETAILS',
          style: {
            fontSize: 11,
            color: titleBlue, 
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'Prior to XECO equipment installation, a qualified XECO Project Manager will visit FACILITY to' +
                ' verify Bill Analytic assumptions and findings, refine and finalize the minimum guaranteed' + 
                ' XECO savings to be derived from installation. CUSTOMER will provide a Purchase Order for' + 
                ' the full amount to be paid to XECO, specific terms of payment and verification of funds to be' +
                ' exercised pending engineering verification of delivered value. With this Purchase Order in' + 
                ' hand, XECO will schedule FACILITY installation.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'Upon FACILITY installation and engineering verification of performance (refer to below' +
                ' provided PERFORMANCE VERIFICATION PROCESS) equal to or greater than the specific value' + 
                ' presented by XECO for the CUSTOMER FACILITY, CUSTOMER will remit payment to XECO in' + 
                ' accordance with the terms below outlined.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: 'CUSTOMER payments are due upon receipt of related invoices',
          style: {
            fontSize: 9,
            underline: true,
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'number',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: [
                {
                  text: 'Prepayment before installation (30%) – ',
                },
                {
                  text: clientProposalData.depositAmount,
                  style: {
                    bold: true
                  }
                }
              ]
            },
            {
              margin: [0, 5, 0, 0],
              text: [
                {
                  text: 'Payment after installation of the equipment (30%) – ',
                },
                {
                  text: clientProposalData.installationAmount,
                  style: {
                    bold: true
                  }
                }
              ]
            },
            {
              margin: [0, 5, 0, 0],
              text: [
                {
                  text: 'Payment after successful performance test agreed to by both parties (40%) – ',
                },
                {
                  text: clientProposalData.finalAmount,
                  style: {
                    bold: true
                  }
                }
              ]
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 5, 0, 0],
          text: 'Equipment will remain active if payments are received as proscribed in detailed contract' +
                ' terms. Failure to receive payment will result in remote deactivation of equipment and' + 
                ' removal at the expense of CUSTOMER.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [-50, 10, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'INSURANCE COVERAGE',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [70, 0, 0, 0],
          text: 'Carrier: Hiscox Insurance Co.',
          style: {
            fontSize: 9,
            bold: true,
          }
        },
        {
          margin: [70, 10, 0, 0],
          image: insuranceCoveragePath,
          width: 200, 
        },
        {
          margin: [-50, 10, -50, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'PERFORMANCE AND QUALITY CONTROL',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'PERFORMANCE VERIFICATION PROCESS',
          style: {
            fontSize: 10,
            color: titleBlue, 
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'Immediately following the installation of the proposed configuration at FACILITY' + 
                ' XECO will conduct a facility-wide engineering test to verify the savings specified in' + 
                ' the Bill Analytic Report and provide the data to the client for review and approval.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: 'In the event the post-installation test of the installed configuration does not produce' + 
                ' measurable results that meet or exceed the performance criteria quoted by XECO for the' + 
                ' facility, the following sequence of events will occur:',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [20, 10, 0, 0],
          type: 'number',
          ul: [
            {
              margin: [0, 5, 0, 0],
              text: 'XECO will take the appropriate steps to adjust the installed configuration in' + 
                    ' order to produce results that meet or exceed the performance criteria' + 
                    ' quoted for the facility. The configuration adjustment period will be' + 
                    ' completed within thirty (30) days of the initial installation completion date.'
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Should additional equipment and/or labor be required during' + 
                    ' the thirty-day period it will be provided by XECO at no' + 
                    ' additional cost to CUSTOMER.',
            },
            {
              margin: [0, 5, 0, 0],
              text: 'Prior to the end of the thirty (30) day post-installation adjustment' + 
                    ' period, if required, CUSTOMER and XECO will review all new test data' + 
                    ' and agree that the performance criteria originally quoted are being met' + 
                    ' or exceeded.', 
            },
            {
              margin: [0, 5, 0, 0],
              text: 'If the CUSTOMER and XECO are unable to agree within the initial thirty (30)' + 
                    ' days post- installation period that there is measurable results that meet or' + 
                    ' exceeded the performance criteria established for the facility, XECO shall' + 
                    ' have an additional thirty (30) days to resolve the performance issues.' + 
                    ' If within sixty (60) days post installation XECO is unable to produce', 
            },
            {
              margin: [0, 5, 0, 0],
              text: 'If within sixty (60) days post installation XECO is unable to produce' + 
                    ' measurable results that meet or exceed the performance criteria quoted for' + 
                    ' the facility, and the CUSTOMER and XECO are unable to agree on revised' + 
                    ' performance criteria, XECO will refund all payments made by CUSTOMER to' + 
                    ' XECO minus any installation labor costs paid by Xeco.', 
            },
          ],
          style: {
            fontSize: 9,
            markerColor: bulletBlue,
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'QUALITY CONTROL',
          style: {
            fontSize: 10,
            color: titleBlue, 
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'XECO has implemented a quality control system to ensure that this project meets or exceeds the' +
                ' specifications. Our quality control system ensures the project will proceed with minimal problems and' + 
                ' eliminates the costly trial and error approaches used by companies who do not integrate quality control' + 
                ' into their overall project development from start to finish.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'VALIDITY OF PROPOSAL',
          style: {
            fontSize: 10,
            color: titleBlue, 
          }
        },
        {
          text: 'This proposal shall remain open and valid for a period of 30 days from the designated date' +
          ' indicated above.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [50, 10, 0, -10],
          image: signaturePath,
          width: 100, 
        },
        {
          margin: [0, -5, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 200, y2: 5, lineWidth: 1, lineColor: signatureBlue}],
        },
        {
          pageBreak: 'after',
          text: 'Gregory A. Dockery, CEO',
          style: {
            bold: true
          }
        },
        //-------------------Page 16 - PROJECT VALIDATION-------------------
        {
          margin: [-50, 10, -50, 10],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [30, 5, 0, 0],
                  text: 'XECO SENIOR MANAGEMENT TEAM',
                  style: {
                    alignment: 'left',
                    bold: true,
                    color: 'white',
                    fillColor: green,
                    fontSize: 19
                  }
                }
              ]
            ]
          }
        },
        {
          text: [
            { text: 'Gregory A. Dockery, President/CEO: ',
              style: {
                bold: true, 
              },
            },
            { text: 'Greg is the inventor and technology design innovator of the' + 
                ' XPS technology. Over the past 35 years Greg has created and introduced several baseline technologies such as' + 
                ' the Caller ID architectural platform, wireless video, wireless audio speakers, the picture-in-picture projection' + 
                ' technology for televisions, and many other wireless device innovations. Dockery’s experience in changing the' + 
                ' power quality conditions for electrical distribution systems began when he proved his wave-guide theories for' + 
                ' propagating and filtering high-frequency signals across power lines for audio, video, computer and' + 
                ' telecommunication technologies to U.S. Patent Office engineers. His patented technologies and ‘trade secrets’' + 
                ' have advanced the methods of regulating and controlling A.C. signals through electromagnetic wave' + 
                ' propagation and carrier-current systems.',
            }, 
          ], 
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 5, 0, 0],
          text: 'Dockery brings over 35 years of experience as a CEO for technology design, electronics manufacturing,' + 
                ' distribution and international marketing operations to his role at Xeco.',
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            { text: 'Paul M. Brown, Executive Vice President: ',
              style: {
                bold: true, 
              },
            },
            { text: 'Paul has been a member of Xeco’s management team' + 
                ' for more than the twelve years. Prior to Xeco Paul has worked on the leading edge of the global technology' + 
                ' revolution for four decades. He has held executive management positions with IBM, Digital Equipment' + 
                ' Corporation, Computer Sciences Corporation, KPMG and Bearing Point. He has managed large complexed' + 
                ' system integration and technology implementation projects for corporate organization in North America, Latin' + 
                ' America, Europe and Asia/Pacific',
             }, 
          ], 
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: [
            { text: 'R. Gordon Jones, C.P.A./Secretary/Treasurer: ',
              style: {
                bold: true, 
              },
            },
            { text: 'R. Gordon Jones graduated from Brigham Young' + 
                    ' University in April 1978. He passed the CPA (Certified Public Accountant) exam and completed the practical' + 
                    ' experience necessary for a license. He also facilitates the auditing of financial statements with U.S. qualified' + 
                    ' auditors. Gordon has been with Xeco since 2008.',
            }, 
          ], 
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 20, 0, 0],
          text: [
            { text: 'Kamal Kawalramani, Managing Director of Xeco Taiwan, Manufacturing and Operations:',
              style: {
                bold: true, 
              },
            },
            { text: ' Kamal is responsible for the complete quality control of all the goods produced, manufactured' + 
                ' and installed by Xeco. The goods include a wide range of electronic devices including wireless speakers, wireless ' + 
                ' antennas, signaling technologies, air purifiers, and power quality equipment. Since 1992, Kamal has worked ' + 
                ' with Dockery managing offshore manufacturing facilities in both Taiwan and China, while meeting the product ' + 
                ' quality standards and test clearances required by SGS Far East Ltd, UL, ETL, CSA, etc.',
             }, 
          ], 
          style: {
            fontSize: 9
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 15, 0, 0],
          stack: [
            { text: 'Xeco Performance Guarantee Policy',
              style: {
                bold: true, 
                fontSize: 15,
                alignment: 'center'
              },
            },
            { 
              margin: [0, 10, 0, 0],
              text: `The primary objective of Xeco\'s EMS is to save  ${clientProposalData.clientName} money. Our performance guarantee policy is to` +
                    ' ensure your investment in Xeco’s technology will be repaid many times. The intent of this section of the proposal is to' +
                    ' clarify Xeco determines the baseline savings Key Performance Indicator (KPI) as well as to explain how and when Xeco will' +
                    ` offer a purchase price reduction or issue financial credits to ${clientProposalData.clientName} in the event the baseline savings` +
                    ' KPI is not met.',
            }, 
            { 
              margin: [0, 10, 0, 0],
              text: 'Our standard approach for every EMS project is to start performance testing following the installation and activation of the' +
                    ' proposed hardware and software configuration. Typically, within a day or two post installation we conduct a series of' +
                    ' "one hour on" and "one hour off" operational tests of the EMS system for up to a total of ten hours. This \'real-time&\' testing' + 
                    ' procedure generates the data necessary to measure the EMS system\'s performance and compare the results to the baseline savings' +
                    ` guarantee. In the event the test results do not validate the baseline savings guarantee of ${clientProposalData.estimatedSavings.baselineSavingsPercent}% for the installed facility Xeco` +
                    ' will immediately begin the process of diagnosing and resolving the performance issue. If Xeco is required to install' +
                    ` additional equipment to achieve the baseline savings guarantee it will be done at no additional cost to ${clientProposalData.clientName}.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: 'In the unlikely event that within sixty days following the start of the performance testing period Xeco is unable to meet or' +
                    ` exceed the baseline savings guarantee, ${clientProposalData.clientName} will have the option to terminate the EMS project, instruct` + 
                    ' Xeco to remove the installed EMS solution, and receive a refund of all payments made to Xeco, or ${clientProposalData.clientName} can' +
                    ' agree to a revised performance baseline and a proportionate reduction in the EMS purchase price per the following hypothetical' +
                    ' scenario for the facility:',
            },
            { 
              margin: [20, 5, 0, 0],
              text: '• Xeco EMS purchase price - $350,000'
            },
            { 
              margin: [20, 0, 0, 0],
              text: `• Baseline savings guarantee - 9.50%`
            },
            { 
              margin: [20, 0, 0, 0],
              text: '• Actual baseline savings - 9.00%'
            },
            { 
              margin: [20, 0, 0, 0],
              text: '• EMS performance shortfall - 5.263%'
            },
            { 
              margin: [20, 0, 0, 0],
              text: '• Purchase price reduction - 5.263% x $350,000 = $18,421.05'
            },

            { 
              margin: [0, 10, 0, 0],
              text: 'Included in the purchase price of the EMS is the cost of the Annual Metering/Server Fee as specified in the proposal.' +
                    ' The fee covers the support cost for the secure on-site server and the software license for Xeco’s Information Reporting System' + 
                    ' for the first twelve months post EMS installation. The reporting system provides access to financial and operational information'+
                    ' via an on-line portal and dashboard to support management decision making. After the first twelve-month period the fee is renewable' +
                    ' and must be prepaid annually or in monthly installments. The key feature of the Information Reporting System is Xeco’s Energy Savings' +
                    ' Report (ESR) which is designed to document the monthly energy savings and the financial impact generated by Xeco’s EMS.',
            },
            { 
              margin: [0, 10, 0, 0],
              text: 'Following the completion of the performance test period and verification of the proposed or revised (if appropriate) baseline savings' +
                    ' guarantee for the facility, Xeco\'s Information Reporting System will begin generating an Energy Savings Report (ESR) every month based' +
                    ` on the timely entry of data by ${clientProposalData.clientName} personnel from the monthly electricity billing statement received from the electric` +
                    ` utility company. The monthly entry of the billing information should take a ${clientProposalData.clientName} employee no more than 30 minutes and is` +
                    ' required input so the ESR can accurately reflect the electricity consumption for the billing period as well as the applicable billing rates.' +
                    ' Each month\'s report will provide the data necessary to determine if the baseline savings guarantee is being met. ',
            },
            { 
              margin: [0, 10, 0, 0],
              text: 'It is a given that electricity consumption in the plant will not be the same every month and therefore the savings amount will vary month to month.' +
                    ' However, the average savings amount for the twelve-month period following the completion of the performance verification testing should meet or' +
                    ` exceed the savings guarantee. It is critical that both ${clientProposalData.clientName} and Xeco have an accurate measure of savings every month for comparison` +
                    ' to the baseline savings guarantee. During the twelve months following completion of the performance verification testing the ESR will calculate' +
                    ' the total savings amount for the month, as well as the average baseline savings percentage for the period to date and compare it to the agreed upon KPI.' +
                    ' This process ensures that if there is any significant degree of underperformance reported it can be diagnosed in real-time and addressed as it is occurring.',
            },
            { 
              margin: [0, 10, 0, 0],
              text: 'At the end of the twelve-month period following the completion of the post installation EMS performance testing and verification of the savings baseline' +
                    ` KPI, ${clientProposalData.clientName} and Xeco personnel will review the Energy Savings Report to determine if the baseline savings for the period equals the savings` +
                    ' total guaranteed for that twelve-month period. In the unlikely event the savings for the period does not equal the annualized baseline saving guarantee,' +
                    ` Xeco will calculate and issue a credit to ${clientProposalData.clientName} in an amount equal to the difference between the savings guarantee and the actual savings` +
                    ` documented in the ESR. The credit may be applied to future EMS purchases by ${clientProposalData.clientName}, if applicable. Should the performance of the EMS exceed` +
                    ' the savings guarantee during any of the twelve-month periods, Xeco will calculate the value of the over performance and may apply it to any credits due' +
                    ` to ${clientProposalData.clientName} in the future, if applicable. In no event will ${clientProposalData.clientName} pay more than the proposed purchase price for any EMS installation.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `Assuming ${clientProposalData.clientName} continues to subscribe to the Annual Metering/Server Fee for Xeco’s Information Reporting System, the ESR review process` +
                    ' and the saving guarantee will remain in force per the baseline savings KPI that has been previously established, notwithstanding significant load factor changes' +
                    ' in the facility which may require a recalculation of the KPI or the purchase of additional Xeco equipment.',
            },
          ], 
          style: {
            fontSize: 9
          }
        },
        {
          margin: [0, 15, 0, 0],
          stack: [
            { text: 'APPENDIX A/U (SERVICES)',
              style: {
                bold: true, 
                fontSize: 14,
                alignment: 'center'
              },
            },
            { text: `TO ${clientProposalData.clientName} PURCHASE ORDER`,
              style: {
                bold: true, 
                fontSize: 10,
                alignment: 'center'
              },
            },
            { 
              margin: [0, 10, 0, 0],
              text: 'GENERAL TERMS AND CONDITIONS FOR SERVICES',
              style: {
                bold: true, 
                fontSize: 12,
                alignment: 'center'
              },
            },
            { 
              margin: [0, 10, 0, 0],
              text: `The Purchase Order Form to which these are attached and these General Terms and Conditions for Services (Appendix A/U (Services)) constitute the “Agreement.” `+
              `In the event of any inconsistency in the terms of such documents, written clarification should be obtained promptly from ${clientProposalData.clientName}.  No modifications shall be ` +
              `effective unless in writing and signed by both parties, except ${clientProposalData.clientName} may, by written order, make changes in the Work or authorize additional Work.` ,
            }, 
            { 
              margin: [0, 10, 0, 0],
              text: `1. Services.  Subject to the terms and conditions of this Agreement, Contractor will perform the services set forth on the Purchase Order Form, as amended ` + 
              `and/or supplemented from time to time by the mutual written agreement of the parties (the “Services”). Time is of the essence in the performance of the Services. ` +
              `Contractor represents that it is skilled in the professional discipline necessary to perform the Services. Contractor will perform Services in a skillful manner, ` +
              `comply fully with criteria established by ${clientProposalData.clientName} and with applicable laws, codes, and all applicable professional standards. Any changes to the Services ` +
              `must be made in writing and signed by both parties and shall be incorporated into and made subject to this Agreement. A Key Employee identified in the Purchase ` +
              `Order Form shall not be removed from a particular project without providing notification to ${clientProposalData.clientName}. Contractor shall comply with all of ${clientProposalData.clientName}’ standards ` +
              `and procedures when working on-site at ${clientProposalData.clientName} or its facilities, including without limitation standards relating to environmental, health and safety (EHS) and security. ` +
              `Any of Contractor’s employees or consultants may be denied access to ${clientProposalData.clientName}’s facilities if they fail to comply with the above.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `2. Term; Termination. This Agreement shall continue in effect until the earlier to occur of (i) the completion of the Services hereunder, ` +
              `or (ii) the date if any set forth on the Purchase Order Form. The Agreement may be terminated by either party for any reason upon ` +
              `thirty (30) days written notice.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `3. Representative.  Contractor will report to the ${clientProposalData.clientName} representative or his designee, who will make specific task assignments within the scope of this Agreement. ` +
              `Any change of representative shall be made only upon written notice to the other party.`
            },
            { 
              margin: [0, 10, 0, 0],
              text: `4. Payment. Unless otherwise stated in the Purchase Order Form, Contractor shall invoice ${clientProposalData.clientName} every month for the ` +
              `Services hereunder on net 30 day payment terms from receipt of the invoice which shall set forth in detail the Services provided. `
            },
            { 
              margin: [0, 10, 0, 0],
              text: `5. Proprietary Information. “Proprietary Information” that ${clientProposalData.clientName} may disclose to Contractor may include ` +
              `(by way of example, but without limitation) data, know-how, formulae, processes, designs, sketches, photographs, plans, drawings, ` +
              `specifications, samples, reports, customer lists, pricing information, studies, findings, inventions, and ideas. ` +
              `It shall also include all such items that Contractor develops or prepares for ${clientProposalData.clientName} under this Agreement. ` +
              `Contractor shall exercise reasonable care to prevent disclosure of Proprietary Information to any third party and ` +
              `shall limit internal dissemination of Proprietary Information within Contractor's own organization to individuals ` +
              `whose duties justify the need to know such information, and then only if there is a clear understanding by such ` +
              `individuals of their obligation to maintain the confidential status of such information and to restrict its use solely ` +
              `to performing the Services. No other right or license to use Proprietary Information is granted hereby. Contractor shall ` +
              `be under no obligation with respect to any information (i) that is, at the time of disclosure, available to the general ` +
              `public; (ii) that becomes at a later date available to the general public through no fault of Contractor, and then ` +
              `only after said later date; (iii) that Contractor can demonstrate was in Contractor's possession before receipt ` +
              `from ${clientProposalData.clientName}; or (iv) that is disclosed to Contractor without restriction on disclosure by a third party who has` +
              `the lawful right to disclose such information.`
            },
            { 
              margin: [0, 10, 0, 0],
              text: `6. Title; Assignment of Rights.  The parties agree that, as between Contractor and ${clientProposalData.clientName}`
            },
            { 
              margin: [20, 0, 0, 0],
              text: `(a)    The Contractor has no right to or interest in any work performed for the Services, or any other materials ` +
              `created in connection with the Services (collectively the “Materials”), nor any right to or interest in any copyright therein. ` +
              `The Contractor acknowledges that the work and the Materials have been specially commissioned or ordered by ${clientProposalData.clientName} as ` +
              `“works made-for-hire” as that term is used in the Copyright Law of the United States, and that ${clientProposalData.clientName} is therefore to ` +
              `be deemed the author of and is the owner of all copyrights in and to such Materials.`
            },

            { 
              margin: [20, 5, 0, 0],
              text: `(b)    In the event that such Materials or any portion thereof are for any reason deemed not to have been works made-for-hire, ` +
              `the Contractor hereby assigns to ${clientProposalData.clientName} any and all right, title, and interest Contractor may have in and to such Materials, ` +
              `including all copyrights, all present and future patent rights, all publishing rights, and all rights to use, reproduce, and otherwise ` +
              `exploit the Materials in any and all languages, channels, and formats or media, whether now known or hereafter created. Contractor ` +
              `hereby waives any and all claims that it has now or hereafter in any jurisdiction throughout the world to so-called moral rights ` +
              `or droit moral with respect to any Materials.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `7. Insurance.  Without limiting any other obligation or liability of Contractor under this Agreement, Contractor agrees that upon ` +
              `execution of the Agreement and throughout its entire effective period, Contractor shall procure and maintain insurance coverage, at its ` +
              `sole cost and expense, with limits and conditions not less than those specified below.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `7.1  CGL. Commercial General Liability Insurance, written on an occurrence form, including but not limited to premises-operations, ` +
              `broad form property damage, products/completed operations, contractual liability, independent contractors, personal injury and advertising ` +
              `injury and liability assumed under an insured contract, with limits of at least $1,000,000 per occurrence and $2,000,000 general aggregate ` +
              `and products/completed operations aggregate of $2,000,000. `,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `7.2  Worker’s Compensation. Worker’s Compensation Insurance with benefits afforded under the laws of the state in which the services ` +
               `are to be performed and Employers Liability insurance with minimum limits of $1,000,000 for Bodily Injury – each accident, $1,000,000 for ` +
               `Bodily Injury by disease – policy limit and $1,000,000 for Bodily Injury by disease – each employee. `,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `7.3  Automobile. Business Automobile Liability Insurance including coverage for owned, hired, and non-owned vehicles with a combined ` +
                `single limit including bodily injury and property damage of not less than $1,000,000 each accident.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `7.4  General Requirements`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `(a)  Contractor’s purchase of insurance shall not in any way limit Contractor’s liability under this agreement. All coverage must be written ` +
              `on an occurrence basis and must be maintained without interruption from the date of this agreement. `,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `(b)  The policies listed in sections 7.1 and 7.3 shall list the ${clientProposalData.clientName} and its subsidiaries, affiliates, directors, ` +
              `officers, employees, partners and agents as additional insured. `,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `(c)  The coverage amounts set forth above may be met by a combination of underlying and umbrella policies so long as in combination ` +
              `the limits equal or exceed those required.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `(d)  Furnishing acceptable evidence of insurance as required hereunder shall not relieve Contractor or any subcontractor ` +
              `from any liability or obligation for which it is otherwise liable under the terms of this contract, nor is liability limited to ` +
              `the amount of this contract.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8. General Provisions.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.1  Independent Contractors. The relationship of the parties under this Agreement is that of independent contractors. ` +
              `Neither party will be deemed to be an employee, agent, partner, franchisor, franchisee nor legal representative of the other ` +
              `for any purpose and neither will have any right, power or authority to create any obligation or responsibility on behalf of the other. ` +
              `${clientProposalData.clientName} shall not be liable for taxes, worker's compensation, unemployment insurance, employers' liability, employer's FICA,` +
              `social security, withholding tax, or other taxes or withholding for or on behalf of the Contractor or any other person Contractor ` +
              `consults or employs in performing Services under this Agreement.  All such costs shall be Contractor's sole responsibility.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.2  Liability Limitation. ${clientProposalData.clientName} shall have no liability to Contractor because of any injuries (including death at any ` +
              `time resulting therefrom), damages, or loss that Contractor may sustain to Contractor’s person or property while performing services ` +
              `under this Agreement on ${clientProposalData.clientName}’s premises or elsewhere or while engaging in any activity incidental thereto, including travel; ` +
              `and Contractor agrees to assume the risk of all such injuries (including death resulting therefrom), damages, and loss, except to the ` +
              `extent any liability results from the sole act or omission (whether negligent or otherwise) of ${clientProposalData.clientName}.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.3  Indemnity. Contractor agrees to defend, indemnify, and save ${clientProposalData.clientName} harmless from and against all liability, ` +
               `loss, or expense (including costs and attorneys' fees) for any suit, claim, settlement, award, penalty, fine, or judgment ` +
               `(hereinafter referred to singly or collectively as “Claim”) because of personal injury (including death at any time resulting therefrom) ` +
               `or loss of or damage to property (including loss of use thereof) sustained by any person or persons whatsoever arising out of, resulting from, ` +
               `or in consequence of Contractor's performance of the services under this Agreement, and whether or not caused or alleged to be caused in ` +
               `whole or in part by the joint, concurrent, or sole act or omission (whether negligent or otherwise) of Contractor and/or Contractor's employees, ` +
               `regardless of whether caused in part by the joint or concurrent act or omission (whether negligent or otherwise) of ${clientProposalData.clientName}, but excluding ` +
               `Claims caused by the sole act or omission (whether negligent or otherwise) of ${clientProposalData.clientName}. The provisions of this paragraph shall survive the ` +
               `expiration or termination of this Agreement.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.4  Conflict of Interest; Competitive Engagements. Contractor represents and warrants that it presently has no interest, and shall not have any interest, ` +
              `direct or indirect, which would conflict in any manner with the performance of work and services required under this Agreement. Contractor shall not engage in ` +
              `any business activity independently, or with or on behalf of a third party, which is competitive with the business of ${clientProposalData.clientName} during the period of this Agreement. ` +
              `If either party identifies a conflict of interest during the performance of the services to be performed, this Agreement shall immediately be terminated upon receipt ` +
              `of oral notice from the party identifying the conflict followed by written notice within five (5) days.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.5  Notices. Any notice required or permitted under the terms of this Agreement or required by law must be in writing and must be delivered ` +
              `to the address first set forth above for each party. Notices will be considered to have been given at the time of actual delivery in person, ` +
              `four (4) business days after deposit in certified mail with return receipt requested, or upon receipt of facsimile confirmation. Either party may ` +
              `change its address for notice by notice to the other party given in accordance with this paragraph. To be effective, any notice to ${clientProposalData.clientName} must ` +
              `be contemporaneously copied to the ${clientProposalData.clientName} General Counsel at ${clientProposalData.clientName}, ${clientProposalData.clientAddress}; Attn: General Counsel.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.6  No Third Party Beneficiaries. The parties hereto expressly agree that there are no third party beneficiaries of this Agreement.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.7  Assignment. Neither this Agreement nor any rights under this Agreement may be assigned or otherwise transferred by the Contractor, in whole or in part, ` +
              `whether voluntarily or by operation of law, including by way of sale of assets, merger, consolidation or otherwise, without the prior written consent ` +
              `of ${clientProposalData.clientName}. Subject to the foregoing, this Agreement will be binding upon and will inure to the benefit of the parties and their respective successors ` +
              `and assigns. `,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.8  Waiver. Any waiver of the provisions of this Agreement or of a party's rights or remedies under this Agreement must be in writing to be effective. Failure, neglect, ` +
               `or delay by a party to enforce the provisions of this Agreement or its rights or remedies at any time, will not be construed as a waiver of such party's rights under this Agreement `+
               `and will not in any way affect the validity of the whole or any part of this Agreement or prejudice such party's right to take subsequent action. `,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.9  Governing Law. This Agreement shall be governed by and interpreted in accordance with the laws of the State of Delaware without regard to any applicable ` +
              `principles of conflicts of law. The United Nations Convention on the Sale of Goods will not be applicable to this Agreement or any of the transactions contemplated by the Agreement.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `8.10 Entire Agreement. This Agreement (including the Exhibits and any addenda hereto signed by both parties) constitutes the entire ` +
              `Agreement between the parties, and there are no understandings, promises, representations, or warranties of any kind whatsoever, except as set forth herein. ` +
              `This Agreement may be executed in multiple counterparts, each of which when executed shall be deemed to be an original and all of which shall be deemed to ` +
              `be one and the same instrument. This Agreement may not be amended, except by a writing signed by both parties.`,
            },
            { 
              margin: [0, 10, 0, 0],
              text: `ACCEPTED AND AGREED:`,
            },
            { 
              margin: [0, 0, 0, 0],
              text: `CONTRACTOR:`,
            },
            { 
              margin: [0, 0, 0, 0],
              text: `${brandName} Energy Corporation`,
            },
            {
              margin: [50, 10, 0, -10],
              image: signaturePath,
              width: 100, 
            },
            {
              margin: [0, -5, 0, 0],
              canvas: [{type: 'line', x1: 0, y1: 5, x2: 200, y2: 5, lineWidth: 1, lineColor: signatureBlue}],
            },
            { 
              margin: [0, 0, 0, 0],
              text: `Name: Greg Dockery`,
            },
            { 
              margin: [0, 0, 0, 0],
              text: `Title: CEO`,
            },
            { 
              margin: [0, 0, 0, 0],
              text: clientProposalData.proposalDate,
            },
          ], 
          style: {
            fontSize: 9
          }
        },
      ],
      styles: {
        title: {
          fontSize: 14,
          bold: true,
          color: titleBlue
        }
      }
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
          text: charge.chargeName,
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
          text: charge.savingsAmount,
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

  function generateIdentifiedEquipmentBody (identifiedEquipment) {
    let identifiedEquipmentBody = [
      [
        {
          border: [true, false, false, false],
          text: '',
        },
        {
          border: noBordersCell,
          margin: [0, 10, 0, 10],
          text: 'XECO Equipment Models:',
          style: {
            bold: true,
            decoration: 'underline'
          }
        },
        {
          border: noBordersCell,
          text: '',
        },
        {
          border: noBordersCell,
          margin: [0, 10, 0, 0],
          text: 'Quantity',
          style: {
            alignment: 'right'
          }
        },
        {
          border: noBordersCell,
          margin: [0, 10, 0, 0],
          text: 'Price Ea.',
          style: {
            alignment: 'right'
          }
        },
        {
          border: noBordersCell,
          margin: [0, 10, 0, 0],
          text: 'Cost',
          style: {
            alignment: 'right'
          }
        },
        {
          border: [false, false, true, false],
          text: '',
        }
      ]
    ];
    identifiedEquipment.items.forEach(function (item) {
      identifiedEquipmentBody.push(
        [
          {
            border: [true, false, false, false],
            text: '',
          },
          {
            border: noBordersCell,
            columns: [
              {
                width: '*',
                text: 'XECO Model:',
              },
              {
                width: '*',
                text: item.name,
                style: {
                  bold: true,
                  alignment: 'center'
                }
              },
            ]
          },
          {
            border: noBordersCell,
            text: '',
          },
          {
            border: noBordersCell,
            text: item.quantity,
            style: {
              alignment: 'right'
            }
          },
          {
            border: noBordersCell,
            text: item.price,
            style: {
              alignment: 'right'
            }
          },
          {
            border: noBordersCell,
            text: item.cost,
            style: {
              alignment: 'right'
            }
          },
          {
            border: [false, false, true, false],
            text: '',
          }
        ]
      );
    });

    identifiedEquipmentBody.push(
      [
        {
          border: [true, false, false, false],
          text: '',
        },
        {
          border: [false, false, true, false],
          text: 'Parts:',
          style: {
            bold: true,
            decoration: 'underline'
          },
          colSpan: 6
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
          text: '',
        }
      ]
    );

    identifiedEquipment.parts.forEach(function (part) {
      identifiedEquipmentBody.push(
        [
          {
            border: [true, false, false, false],
            text: '',
          },
          {
            border: noBordersCell,
            text: part.name
          },
          {
            border: noBordersCell,
            text: '',
          },
          {
            border: noBordersCell,
            text: part.quantity,
            style: {
              alignment: 'right'
            }
          },
          {
            border: noBordersCell,
            text: part.price,
            style: {
              alignment: 'right'
            }
          },
          {
            border: noBordersCell,
            text: part.cost,
            style: {
              alignment: 'right'
            }
          },
          {
            border: [false, false, true, false],
            text: '',
          }
        ]
      );
    });

    identifiedEquipmentBody.push(
      [
        {
          border: [true, false, false, false],
          text: '',
        },
        {
          border: [false, true, false, false],
          text: '',
          colSpan: 5
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
          border: [false, false, true, false],
          text: '',
        }
      ],
      [
        {
          border: [true, false, false, false],
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
          text: 'Total:',
          style: {
            bold: true,
            alignment: 'right'
          }
        },
        {
          border: noBordersCell,
          text: identifiedEquipment.total,
          style: {
            alignment: 'right'
          }
        },
        {
          border: [false, false, true, false],
          text: '',
        }
      ],
      [
        {
          border: [true, false, false, false],
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
          text: 'Sales Tax:',
          style: {
            bold: true,
            alignment: 'right'
          }
        },
        {
          border: noBordersCell,
          text: identifiedEquipment.tax,
          style: {
            alignment: 'right'
          }
        },
        {
          border: [false, false, true, false],
          text: '',
        }
      ],
      [
        {
          border: [true, false, false, false],
          text: '',
        },
        {
          border: [true, true, false, false],
          text: 'Total Identified MAIN Circuits:',
        },
        {
          border: [false, true, true, false],
          text: identifiedEquipment.totalMainCircuits,
        },
        {
          border: noBordersCell,
          text: 'Equipment Discount:',
          style: {
            bold: true,
            fillColor: lightGray,
            alignment: 'right'
          },
          colSpan: 2
        },
        {
          text: ''
        },
        {
          border: noBordersCell,
          text: identifiedEquipment.discount,
          style: {
            bold: true,
            fillColor: lightGray,
            alignment: 'right'
          },
        },
        {
          border: [false, false, true, false],
          text: '',
        }
      ],
      [
        {
          border: [true, false, false, false],
          text: '',
        },
        {
          border: [true, false, false, true],
          text: 'Total Identified MAIN Circuits:',
        },
        {
          border: [false, false, true, true],
          text: identifiedEquipment.totalMainCircuits,
        },
        {
          border: noBordersCell,
          text: 'Final Project Cost:',
          style: {
            bold: true,
            color: 'white',
            fillColor: 'black',
            alignment: 'right'
          },
          colSpan: 2
        },
        {
          text: ''
        },
        {
          border: noBordersCell,
          text: identifiedEquipment.totalProjectCost,
          style: {
            bold: true,
            color: 'white',
            fillColor: 'black',
            alignment: 'right'
          },
        },
        {
          border: [false, false, true, false],
          text: '',
        }
      ],
      [
        {
          margin: [0, 10, 0, 0],
          border: [true, false, true, true],
          text: '',
          colSpan: 7
        }
      ]
    );

    return identifiedEquipmentBody
  }
};

