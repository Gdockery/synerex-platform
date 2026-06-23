module.exports = function (printer) {
  const gray = '#c0c0c0';
  return {
    generate: generate
  };

  function generate (invoiceData, logoPath, brandName) {
    brandName = brandName || 'Synerex'; // Default fallback
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
          margin: [0, -15, -20, -20],
          table: {
            body: [
              // ------------ HEADER -----------
              [
                {
                  margin: [2, 2, 2, 2],
                  layout: 'noBorders',
                  table: {
                    widths: [175, 400, 135],
                    body: [
                      [
                        {
                          margin: [0, 0, 2, 0],
                          image: logoPath,
                          width: 60,
                          height: 20
                        },
                        {
                          margin: [2, 0, 2, 0],
                          layout: 'noBorders',
                          table: {
                            widths: [300],
			                      heights: [15],
                            body: [[{
                              text: `${invoiceData.invoiceType.toUpperCase()} INVOICE`,
                              margin: [2, 2, 0, 2],
                              style: 'header',
                            }]]
                          }
                        },
                        {
                          layout: 'noBorders',
                          margin: [2, -5, 0, -5],
                          table: {
                            body: [
                              [
                                {
                                  text: 'INVOICE NO.',
                                  style: 'invoiceH'
                                }
                              ],
                              [
                                {
                                  text: invoiceData.invoiceNumber,
                                  style: 'invoiceNumber'
                                }
                              ],
                              [
                                {
                                  text: `DATE: ${invoiceData.invoiceDate}`,
                                  style: 'invoiceDate'
                                }
                              ]
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
                  margin: [-10, -2, 0, -3],
                  table: {
                    widths: [200, 200, 305],
                    body: [
                      [
                        {
                          border: [false, false, false, false],
                          style: {
                            fontSize: 8
                          },
                          table: {
                            widths: [205],
                            body: [
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: brandName + ' Energy Corporation',
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.xecoAddress.split('\n')[0],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.xecoAddress.split('\n')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.xecoCity,
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  // text: 'brandName + ' Energy Corporation''
                                  columns: [
                                    {
                                      width: '*',
                                      text: `Contact: ${invoiceData.contact }`,
                                      style: {
                                        alignment: 'left',
                                        bold: true
                                      }
                                    },
                                    {
                                      width: '*',
                                      text: `Tel: ${invoiceData.phone}`,
                                      style: {
                                        alignment: 'left',
                                        bold: true
                                      }
                                    }
                                  ],
                                }
                              ],      

                            ]
                          }
                        },
                        {
                          border: [false, false, false, false],
                          style: {
                            fontSize: 8,
                          },
                          table: {
                            widths: [195],
                            body: [
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: 'BILL TO:',
                                  style: {
                                    bold: true,
                                    fillColor: 'black',
                                    color: 'white',
                                    fontSize: 6,
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.clientName,
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.billToAddress.split(',')[0],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.billToAddress.split(',')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.billToAddress.split(',')[2],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.billToAddress.split('\n')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [-2, -2, 0, 0],
                                  table: {
                                    widths: [110, 70],
                                    body: [
                                      [
                                        {
                                          border: [false, false, false, false],
                                          margin: [-2, -2, 0, 0],
                                          text: `Attn: ${invoiceData.clientAttn}`,
                                          style: {
                                            bold: true
                                          }
                                        },
                                        {
                                          border: [true, true, true, true],
                                          margin: [-2, -2, 0, 0],
                                          text: `RFC Code: ${invoiceData.clientRfcCode}`,
                                          style: {
                                            bold: true
                                          }
                                        }
                                      ]
                                    ]
                                  },
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [-2, -6, 0, 0],
                                  table: {
                                    widths: [110, 70],
                                    body: [
                                      [
                                        {
                                          border: [false, false, false, false],
                                          margin: [-2, -2, 0, 0],
                                          text: `Tel: ${invoiceData.clientPhone}`,
                                          style: {
                                            bold: true
                                          }
                                        },
                                        {
                                          border: [true, true, true, true],
                                          margin: [-2, -2, 0, 0],
                                          text: `PO#: ${invoiceData.clientCompanyPo}`,
                                          style: {
                                            bold: true
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
                        {
                          border: [false, false, false, false],
                          style: {
                            fontSize: 8
                          },
                          table: {
                            widths: [195],
                            body: [
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: 'SHIP TO:',
                                  style: {
                                    bold: true,
                                    fillColor: 'black',
                                    color: 'white',
                                    fontSize: 6,
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.clientName,
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.shipToAddress.split(',')[0],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.shipToAddress.split(',')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.shipToAddress.split(',')[2],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [0, -2, 0, 0],
                                  text: invoiceData.shipToAddress.split('\n')[1],
                                  style: {
                                    bold: true
                                  }
                                }
                              ],
                              [
                                {
                                  border: [false, false, false, false],
                                  margin: [-2, -2, 0, 0],
                                  text: `Tel: ${invoiceData.clientPhone}`,
                                  style: {
                                    bold: true
                                  }
                                },
                              ],
                            ]
                          }
                        },
                      ]
                    ]
                  }
                }
              ], ///----
              [
                {
                  margin: [0, 1, 0, 0],
                  border: [true, false, true, false],
                  text: '',
                }
              ],
              [
                {
                  text: 'Installed SYNEREX POWER SYSTEMS on all recommended equipment. Costs include parts and labor. ' +
                  'The SYNEREX Invoice includes the completed installation of all recommended SYNEREX devices.',
                  style: {
                    fontSize: 5,
                    alignment: 'center'
                  }
                }
              ],
              [
                {
                  text: 'ITEMIZED ESTIMATE: TIME AND MATERIALS (Currency displayed in ' + invoiceData.currencyCode + ')',
                  style: [
                    'centerBold',
                    {
                      fontSize: 5,
                      fillColor: gray
                    }
                  ]
                }
              ],
              [
                createBillTable(invoiceData.items, invoiceData.parts, invoiceData.services)
              ],
              [
                {
                  margin: [-5, -4, -5, -2],
                  table: {
                    widths: [440, 60, 70, 140],
                    body: [
                      [
                        {
                          border: [false, true, true, false],
                          colSpan: 2,
                          text: 'Thank you for your business. We do expect payment within the terms set forth in the ' +
                          'Master Agreement, SOW or Proposal, so please process this invoice within that time. There ' +
                          'will be a 1.5% interest charge per month on late invoices.',
                          style: {
                            fillColor: gray,
                            fontSize: 6
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
                              fontSize: 7,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          border: [false, true, false, false],
                          text: invoiceData.estimatedSavings.subtotal,
                          style: ['invertColors', {
                            bold: true,
                            fontSize: 8,
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
                              fontSize: 7,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          border: [false, true, false, false],
                          text: invoiceData.estimatedSavings.salesTax,
                          style: {
                            bold: true,
                            fontSize: 8,
                            alignment: 'right',
                            fillColor: gray
                          }
                        }
                      ],
                      [
                        {
                          border: [false, false, false, false],
                          margin: [40, 0, 0, 0],
                          text: 'Payment Terms:' + invoiceData.paymentTerms,
                          style: {
                            fontSize: 6
                          }
                        },
                        {
                          border: [true, true, true, false],
                          colSpan: 2,
                          text: 'Total Cost:',
                          style: [
                            'invertColors',
                            {
                              bold: true,
                              fontSize: 7,
                              alignment: 'right'
                            }
                          ]
                        },
                        {
                          text: ''
                        },
                        {
                          border: [true, true, false, false],
                          text: invoiceData.estimatedSavings.totalCost,
                          style: {
                            bold: true,
                            fontSize: 8,
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
                          text: invoiceData.invoiceType == 'Total' ? invoiceData.invoiceType + ' Amount Due:' : invoiceData.invoiceType + ' Amount Due (' + invoiceData.costMultiplier + '):',
                          style: {
                            bold: true,
                            fontSize: 8,
                            alignment: 'right',
                          }
                        },
                        {
                          text: ''
                        },
                        {
                          border: [true, true, false, false],
                          text: invoiceData.invoiceTotal,
                          style: {
                            bold: true,
                            fontSize: 8,
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
        {
          text: 'Terms & Conditions',
          style: {
            bold: true,
            alignment: 'center'
          }
        },
        {
          margin: [0, 10, 0, 0],
          alignment: 'justify',
          text: 'The following terms of business apply to all contracts between us. Acceptance of this proposal and ' +
          'commissioning of the project will be taken as acceptance of these terms of business, unless otherwise agreed ' +
          'in writing before commencing the project.',
          style: 'termsText'
        },
        {
          text: 'Fees & Invoicing',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: 'Payment of each invoice is due from you upon receipt of invoice or Net 10 days of the invoice date and ' +
          brandName + ' Energy Corporation' + ' will be entitled to charge interest on all sums outstanding thereafter at a rate of ' +
          '4% per month calculated on a daily basis payable from the invoice date until the date of payment of the ' +
          'outstanding amount in full. All payments must be made in U.S. dollars unless otherwise agreed by ' + brandName + ' Energy ' +
          'Corporation. For all non-U.S. dollar payments an administrative charge may be made. Any quotation for a ' +
          'project made by ' + brandName + ' Energy Corporation' + ' will remain valid for two months. ' + brandName + ' Energy Corporation' + ' reserves ' +
          'the right to adjust the fees and the date of completion of the project in the event that the project proposal ' +
          'is altered after the project is commissioned.',
          style: 'termsText'
        },
        {
          text: 'Confirmation, cancellation & termination',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: brandName + ' Energy Corporation' + ' requires written confirmation to commence a project. Once the project has been ' +
          'confirmed, the cancellation charges set out below will apply. If the project is cancelled by you at any time ' +
          'during the project [after the agreed fieldwork allocations have been made/ up to 14 days prior to fieldwork/ ' +
          'during fieldwork / once fieldwork has been completed], you will be liable to ' + brandName + ' Energy Corporation' + ' for any ' +
          'and all direct and indirect expenses and costs incurred by ' + brandName + ' Energy Corporation' + ', its officers, agents or ' +
          'employees and any loss of earnings or other any loss whatsoever. Either of us may terminate this agreement at ' +
          'any time by written notice to the other if the other goes into liquidation, makes a voluntary arrangement ' +
          'with its creditors or has a receiver or administrator appointed over all or part of its business.',
          style: 'termsText'
        },
        {
          text: 'Cost assumptions',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: 'The fees quoted are estimated according to specific project requirements, the agreed timescale and any ' +
          'assumptions detailed in the proposal. If the timescale, project objectives or requirements or research ' +
          'approach or the assumptions on which the quote is based change in any way, ' + brandName + ' Energy Corporation' + ' reserves ' +
          'the right to review the agreed fee and charge for any additional work that has resulted from changes. Synerex ' +
          'Energy Corporation cannot accept responsibility for delays caused by weather, transport difficulties, ' +
          'industrial action or any other circumstances beyond its control. The fees include one verbal presentation and ' +
          'an electronic copy of documentation (and 6 bound copies of the debrief presentation). We reserve the right ' +
          'to charge for additional presentations and the production of additional documents. The cost of stimulus ' +
          'material or colour copies of stimulus material will be charged at cost.',
          style: 'termsText'
        },
        {
          text: 'Working practice',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: brandName + ' Energy Corporation' + ' observes the Code of Practice of the National Electrical Code. In providing ' +
          'the services, we gain respondents’ permission to use recordings for research purposes only, not for use in ' +
          'external promotions or in the public domain. The identity of personal records and data pertaining to persons ' +
          'who take part in projects are confidential information and will not be revealed to clients or any third party. ' +
          'Except in respect of death or personal injury, ' + brandName + ' Energy Solutions, Inc. shall not be liable to you by ' +
          'reason of any representation (unless fraudulent), or any term (express or implied) of our agreement for any ' +
          'loss of profit or any indirect, special or consequential loss, damage, costs, expenses or other claims which ' +
          'arise out of or in connection with the project or the use of the results of the project by you, and the entire ' +
          'liability of ' + brandName + ' Energy Corporation' + ' under or in connection with the agreement shall not exceed US$1,000,000 ' +
          '(the limit of our professional indemnity insurance) in respect of any claim or series of connected claims. ' +
          'In line with standard practice, in the event that you request proposals from four or more agencies a fee of ' +
          'US$500 may be charged to you by us. This will be credited against the project fee if ' + brandName + ' Energy Corporation' + ' ' +
          'proposal is accepted. You will supply at your expense, all agreed documents or other materials, and all ' +
          'necessary data or other information relating to the project (and ensure the accuracy of the same), within ' +
          'sufficient time to enable us to carry out the project in accordance with the proposal. Any changes or ' +
          'additions to the project must be agreed in writing by us. Upon commencement of the project, you will be ' +
          'responsible for the insurance of any product samples or stimulus material used in the research against ' +
          'accidental loss or damage, until the date of their disposal or return to you in accordance with this term. ' +
          brandName + ' Energy Corporation' + ' may dispose of all materials supplied by you after six months following completion ' +
          'of a project, unless you request their return, at your expense, in writing. ' + brandName + ' Energy Corporation' + ' will keep ' +
          'key documents including (without limitation) electronic copies of the research proposal, sample details, ' +
          'recruitment questionnaire, debrief documentation) for one year from project completion (the date of the ' +
          'debrief presentation) after which they will be destroyed securely. Audio/video recordings and any paper, ' +
          'products and materials relating to the products will be destroyed securely after six months.',
          style: 'termsText'
        },
        {
          text: 'International work',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: 'Fees that include foreign fieldwork costs are based on the exchange rates prevailing between sterling ' +
          'and the currencies of the applicable countries on the specified date. The rates used are those quoted in ' +
          '[state source]. ' + brandName + ' Energy Corporation' + ' reserves the right to adjust the final fee in line with any rate ' +
          'fluctuations during the course of the project.',
          style: 'termsText'
        },
        {
          text: 'Copyright and confidentiality',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: 'The copyright and all other intellectual property rights whatsoever in any work produced by us for you ' +
          'during the project including (without limitation) our proposal, debrief documentation and any other materials ' +
          'whether (without limitation) vested, contingent or future shall belong to us absolutely at all times. You ' +
          'warrant that any material or information supplied by you and its use by us, will not infringe the copyright ' +
          'or other intellectual property rights of any third party, and you will indemnify us against any loss, ' +
          'damages, costs, expenses or other claims arising from any such infringement. ' + brandName + ' Energy Corporation' + ' ' +
          'undertakes to keep confidential and not disclose to any other person (except in the proper performance of ' +
          'duties) either during or after the termination of this contract any information whatsoever relating to your ' +
          'business or any trade secrets or make use of the same in any manner which might be prejudicial to your ' +
          'interests. You undertake to keep confidential and not disclose to any other person either during or after ' +
          'the termination of this contract any information whatsoever relating to our business, any proposals, ' +
          'methodologies and debrief documentation or other information supplied by us during or before the project, or ' +
          'make use of the same in any manner which might be prejudicial to our interests. The findings from Synerex Labs ' +
          'Corporation’s research may only be published, used or quoted elsewhere, with our prior written approval and ' +
          'provided that the findings and work are attributed to ' + brandName + ' Energy Corporation' + '.',
          style: 'termsText'
        },
        {
          text: 'General',
          style: 'termsSubtitle'
        },
        {
          alignment: 'justify',
          text: 'United States law governs the agreement between us and you agree to submit to the non-exclusive ' +
          'jurisdiction of the U.S. courts. These terms, together with the proposal and proposal confirmation, ' +
          'constitute the entire agreement between us, supersede any previous agreements or understandings and all ' +
          'other terms, express or implied by statute or otherwise are excluded to the fullest extent permitted by law. ' +
          'A notice required to be served on either of us under these terms shall be in writing addressed to the other ' +
          'at its registered office or principal place of business or such other address as may have been notified to ' +
          'the party giving notice pursuant to this term. No failure or delay by us to exercise any of our rights under ' +
          'the agreement shall be deemed to be a waiver of that right, and no waiver of any breach of the agreement ' +
          'shall be considered as a waiver of any subsequent breach of the same or any other provision. If any ' +
          'provision of these terms is held by any court or other competent authority to be invalid or unenforceable in ' +
          'whole or in part, the validity of these terms and the remainder of the provision in question shall not be ' +
          'affected',
          style: 'termsText'
        }
      ],
      styles: {
        header: {
          fontSize: 14,
          bold: true,
          fillColor: gray,
          alignment: 'center'
        },
        invoiceH: {
          fontSize: 8,
          bold: true,
          alignment: 'center',
          decoration: 'underline'
        },
        invoiceDate: {
          fontSize: 6,
          bold: true,
          alignment: 'center'
        },
        invoiceNumber: {
          bold: true,
          alignment: 'center',
          fontSize: 8,
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
    console.log('done with docDefinition');

    return printer.createPdfKitDocument(docDefinition);
  }

  function createBillTable (items, parts, services) {
    console.log('createBillTable');
    let body = [
      [
        {
          text: 'DESCRIPTION',
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 7,
            }
          ]
        },
        {
          text: 'Quantity',
          style: [
            'invertColors',
            {
              alignment: 'center',
              fontSize: 7,
            }
          ]
        },
        {
          text: 'Status',
          style: [
            'invertColors',
            {
              fontSize: 7,
            }
          ]
        },
	      {
          text: 'TAX',
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 7,
            }
          ]
        },
        {
          text: 'COST',
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 7,
            }
          ]
        },
        {
          text: 'AMOUNT (Full Install)',
          style: [
            'centerBold', 'invertColors',
            {
              fontSize: 7,
            }
          ]
        },
      ]
    ];


    body = body.concat(createItemsTable(items));

    body.push([
      {
        text: 'Parts:',
        colSpan: 6,
        style: [
          {
            fillColor: gray,
            fontSize: 7,
            bold: true,
            decoration: 'underline'
          }
        ]
      }
    ]);

    body = body.concat(createPartsTable(parts));
    body = body.concat(createPartsTable(services));


    return {
      margin: [-5, -2, -5, 0],
      table: {
        widths: [290, 70, 30, 80, 100, 124],
        body: body
      }
    };
  }

  function createItemsTable (items) {
    let itemsBody = [];
    items.forEach(function (item) {
      itemsBody.push([
        {
          border: [false, true, false, false],
          columns: [
            {
              text: `${item.type}:`
            }, {
              text: item.name,
              alignment: 'right',
              style: {
                bold: true
              }
            }
          ],
          style: {
            fontSize: 8
          }
        },
        {
          border: [false, true, false, false],
          text: item.quantity,
          alignment: 'center',
          style: {
            fontSize: 8,
            bold: true
          }
        },
        {
          border: [false, true, false, false],
          text: item.status,
          style: {
            fontSize: 8
          }
        },
	      {
          border: [true, true, false, false],
          text: item.tax,
          alignment: 'right',
          style: {
            fontSize: 8,
            bold: false
          }
        },
        {
          border: [true, true, false, false],
          text: item.price,
          alignment: 'right',
          style: {
            fontSize: 8
          }
        },
        {
          border: [true, true, false, false],
          text: item.cost,
          alignment: 'right',
          style: {
            fontSize: 8,
            bold: true
          }
        },
      ]);
    });

    console.log('itemsBody');
    return itemsBody;
  }

  function createPartsTable (parts) {

    console.log('createPartsTable');
    let partsBody = [];
    parts.forEach(function (part) {
      partsBody.push([
        {
          border: [false, true, false, false],
          text: `${part.name}:`,
          style: {
            fontSize: 8
          }
        },
        {
          border: [false, true, false, false],
          text: part.quantity,
          alignment: 'center',
          style: {
            fontSize: 8,
            bold: true
          }
        },
        {
          border: [false, true, false, false],
          text: part.status,
          style: {
            fontSize: 8
          }
        },
	{
          border: [true, true, false, false],
          text: part.tax,
          alignment: 'right',
          style: {
            fontSize: 8,
            bold: true
          }
        },
        {
          border: [true, true, false, false],
          text: part.price,
          alignment: 'right',
          style: {
            fontSize: 8
          }
        },
        {
          border: [true, true, false, false],
          text: part.cost,
          alignment: 'right',
          style: {
            fontSize: 8,
            bold: true
          }
        },
  
      ]);
    });

    console.log('done createPartsTable');
    return partsBody;
  }

};
