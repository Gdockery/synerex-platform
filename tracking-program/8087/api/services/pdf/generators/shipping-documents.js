module.exports = function (printer) {

  const gray = '#808080',
    darkGray = '#404040',
    lightGray = '#a0a0a0',
    titleBlue = '#365f91',
    titleUnderlineBlue = '#8eaed4',
    black = '#000000',
    white = '#FFFFFF',
    lightGrayBG = '#d9d9d9',
    bulletBlue = '#477685',
    green = '#007f00',
    signatureBlue = '#365F90',
    xecoSavingsColor = '#333333',
    noBordersCell = [false, false, false, false];
    allBorders = [true, true, true, true];

  return { 
    generate: generate
  };

  function generate (data, logoImg) {
    console.log("in generator js");
    let docDefinition = {
      pageMargins: [20, 20, 20, 20],
      margin: [0, 0, 0, 0],
      fontSize: 9,
      content: [
        //------------------- Cover -------------------
        //-------------------Page 2-------------------
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: ['*', 'auto', '*'],
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
                  stack: [
                    {
                      text: 'OMB No. 1651-0098',
                      
                      style: {
                        alignment: 'right',
                        fontSize: 7,
                      }
                    },
                    {
                      text: 'Exp. 04-30-2020',
                      
                      style: {
                        alignment: 'right',
                        fontSize: 7,
                      }
                    },
                  ],
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [0, -20, 0, 0],
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'DEPARTMENT OF HOMELAND SECURITY',
                      
                      style: {
                        alignment: 'center',
                        fontSize: 10,
                      }
                    },
                    {
                      text: 'U.S. Customs and Border Protection',
                      
                      style: {
                        alignment: 'center',
                        fontSize: 11,
                      }
                    },
                  ]
                },
                {
                  border: noBordersCell,
                  text: ''
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  margin: [0, 0, 0, 0],
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'NORTH AMERICAN FREE TRADE AGREEMENT',
                      
                      style: {
                        alignment: 'center',
                        fontSize: 11.5,
                        bold: true
                      }
                    },
                    {
                      text: 'CERTIFICATE OF ORIGIN',
                      
                      style: {
                        alignment: 'center',
                        fontSize: 11.5,
                        bold: true
                      }
                    },
                  ]
                },
                {
                  border: noBordersCell,
                  text: ''
                },
              ],
              [
                {
                  border: noBordersCell,
                  text: ''
                },
                {
                  margin: [0, 0, 0, 0],
                  border: noBordersCell,
                  stack: [
                    {
                      text: '19 CFR 181.11, 181.22',
                      style: {
                        alignment: 'center',
                        fontSize: 8,
                      }
                    },
                  ]
                },
                {
                  border: noBordersCell,
                  text: ''
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 8.5,
            alignment: 'left',
          },
          table: {
            widths: [255, 275],
            body: [
              [
                {
                  border: [false, true, true, false],
                  borderSize: 0.1,
                  text: '1. EXPORTER NAME, ADDRESS AND EMAIL',
                },
                {
                  border: [true, true, false, false],
                  text: '2. BLANKET PERIOD',
                },
              ],
              [
                {
                  border: [false, false, true, false],
                  stack: [
                    {
                      text: 'Synerex Labs',
                      style: {
                        color: gray,
                        fontSize: 7,
                        //font: 'TimesNewRoman',
                        borderWidth: 0.5,
                        borderSize: 0.5,
                      }
                    },
                    {
                      text: '1393 N. BENNETT CIRCLE',
                      style: {
                        color: gray,
                       // font: 'TimesNewRoman',
                        fontSize: 7,
                      }
                    },
                    {
                      text: 'FARMINGTON, UTAH 84025',
                      style: {
                        color: gray,
                       // font: 'TimesNewRoman',
                        fontSize: 7,
                      }
                    },
                  ],
                  rowSpan: 3,
                },
                {
                  border: [true, false, false, true],
                  text: '    ',
                },
              ],
              [
                {
                  border: [false, false, true, false],
                  text: '',
                },
                {
                  border: [true, true, false, false],
                  text: [
                    'FROM ',
                    { 
                      text: '(mm/dd/yyyy)',
                      style: {
                        italics: true,
                      },
                    },
                  ],
                },
              ],
              [
                {
                  border: [false, false, true, false],
                  text: '',
                },
                {
                  border: [true, false, false, true],
                  text: data.fromDate,
                  style: {
                    color: gray,
                    fontSize: 8,
                  },
                },
              ],
              [
                {
                  border: [false, false, true, false],
                  text: '',
                },
                {
                  border: [true, false, false, false],
                  text: [
                    'TO ',
                    { 
                      text: '(mm/dd/yyyy)',
                      style: {
                        italics: true,
                      },
                    },
                  ],
                },
              ], 
              [
                {
                  border: [false, false, true, true],
                  text: [
                    'TAX IDENTIFICATION NUMBER:  ',
                    {
                      text: '46-2985102', 
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                  ],
                },
                {
                  border: [true, false, false, true],
                  text: data.toDate,
                  style: {
                    color: gray,
                    fontSize: 8,
                  },
                },
              ], 
              [
                {
                  border: [false, false, true, false],
                  text: '3. PRODUCER NAME, ADDRESS AND EMAIL',
                },
                {
                  border: [false, false, false, false],
                  text: '4. IMPORTER NAME, ADDRESS AND EMAIL',
                },
              ], 
              [
                {
                  border: [false, false, true, false],
                  stack: [
                    {
                      text: 'Synerex Labs',
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                    {
                      text: '1393 N. BENNETT CIRCLE',
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                    {
                      text: 'FARMINGTON, UTAH 84025',
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                  ],
                },
                {
                  border: [false, false, false, false],
                  stack: [
                    {
                      text: data.client.legalName,
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                    {
                      text: data.facilityLocation.split(',')[0],
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                    {
                      text: data.facilityLocation.split(',')[1],
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                    {
                      text: data.facilityLocation.split(',')[2],
                      style: {
                        color: darkGray,
                        fontSize: 7,
                      }
                    },
                  ],
                },
              ],
              [
                {
                  border: [false, false, true, true],
                  text: [
                    'TAX IDENTIFICATION NUMBER:  ',
                    {
                      text: '46-2985102',
                      style: {
                        color: darkGray,
                        fontSize: 8.5,
                      }
                    },
                  ],
                },
                {
                  border: [false, false, false, true],
                  text: [
                    'TAX IDENTIFICATION NUMBER:  ',
                    {
                      text: data.client.taxId,
                      style: {
                        color: gray,
                        fontSize: 8.5,
                      }
                    },
                  ],
                },
              ], 
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [265, 60, 48, 40, 47, 38],
            body: [
              [
                {
                  border: [false, false, true, true],
                  stack: [
                    {
                      text: '5.',
                    },
                    {
                      text: 'DESCRIPTION OF GOOD(S)',
                    },
                  ],
                },
                {
                  border: [false, false, true, true],
                  stack: [
                    {
                      text: '6.',
                    },
                    {
                      text: 'HS TARIFF CLASSIFICATION NUMBER',
                    },
                  ],
                },
                {
                  border: [false, false, true, true],
                  stack: [
                    {
                      text: '7.',
                    },
                    {
                      text: 'PREFERENCE CRITERION',
                    },
                  ],
                },
                {
                  border: [false, false, true, true],
                  stack: [
                    {
                      text: '8.',
                    },
                    {
                      text: 'PRODUCER',
                    },
                  ],
                },
                {
                  border: [false, false, true, true],
                  stack: [
                    {
                      text: '9.',
                    },
                    {
                      text: 'NET COST',
                    },
                  ],
                },
                {
                  border: [false, false, false, true],
                  stack: [
                    {
                      text: '10.',
                    },
                    {
                      text: 'COUNTRY OF ORIGIN',
                    },
                  ], 
                },
              ],
              ...getPalletRows4(data.pallet1),
              [
                {
                  border: [false, false, true, true],
                  text: '',
                },
                {
                  border: [false, false, true, true],
                  text: '',
                },
                {
                  border: [false, false, true, true],
                  text: '',
                },
                {
                  border: [false, false, true, true],
                  text: '',
                },
                {
                  border: [false, false, true, true],
                  text: '',
                },
                {
                  border: [false, false, false, true],
                  text: '',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          text: 'I CERTIFY THAT:',
          style: {
            fontSize: 8.5,
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: '• THE INFORMATION ON THIS DOCUMENT IS TRUE AND ACCURATE AND I ASSUME THE RESPONSIBILITY FOR PROVING SUCH ' + 
                'REPRESENTATIONS. I UNDERSTAND THAT I AM LIABLE FOR ANY FALSE STATEMENTS OR MATERIAL OMISSIONS MADE ON OR IN ' +
                'CONNECTION WITH THIS DOCUMENT;',
          style: {
            fontSize: 8.5,
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: '• I AGREE TO MAINTAIN AND PRESENT UPON REQUEST, DOCUMENTATION NECESSARY TO SUPPORT THIS CERTIFICATE, AND TO INFORM, IN ' +
                'WRITING, ALL PERSONS TO WHOM THE CERTIFICATE WAS GIVEN OF ANY CHANGES THAT COULD AFFECT THE ACCURACY OR VALIDITY OF ' +
                'THIS CERTIFICATE; ',
          style: {
            fontSize: 8.5,
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: '• THE GOODS ORIGINATED IN THE TERRITORY OF ONE OR MORE OF THE PARTIES, AND COMPLY WITH THE ORIGIN REQUIREMENTS ' +
                'SPECIFIED FOR THOSE GOODS IN THE NORTH AMERICAN FREE TRADE AGREEMENT AND UNLESS SPECIFICALLY EXEMPTED IN ARTICLE ' +
                '411 OR ANNEX 401, THERE HAS BEEN NO FURTHER PRODUCTION OR ANY OTHER OPERATION OUTSIDE THE TERRITORIES OF THE ' + 
                'PARTIES; AND',
          style: {
            fontSize: 8.5,
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: '• THIS CERTIFICATE CONSISTS OF _______ PAGES, INCLUDING ALL ATTACHMENTS.',
          style: {
            fontSize: 8.5
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 5, 0, 0],
          border: [false, true, false, true],
          style: {
            fontSize: 8,
            alignment: 'left',
          },
          table: {
            widths: [15, 520],
            body: [
              [
                {
                  border: [false, true, true, true],
                  text: '11.',
                  style: {
                    fontSize: 8,
                    alignment: 'center',
                  },
                },
                {
                  border: [false, true, false, true],
                  margin: [-5, -3, 0, 0],
                  style: {
                    fontSize: 8,
                    alignment: 'left',
                  },
                  stack: [
                    {
                      table: {
                        widths: [255, 253],
                        body: [
                          [
                            {
                              border: [false, false, true, true],
                              stack: [
                                {
                                  text: '11a. AUTHORIZED SIGNATURE',
                                },
                                {
                                  text: '     ',
                                  style: {
                                    fontSize: 8,
                                    color: darkGray,
                                  },
                                },
                              ],
                            },
                            {
                              border: [false, false, false, true],
                              stack: [
                                {
                                  text: '11b. COMPANY',
                                },
                                {
                                  text: 'Synerex Labs',
                                  style: {
                                    fontSize: 7,
                                    color: darkGray,
                                  },
                                },
                              ],
                            },
                          ],
                          [
                            {
                              border: [false, false, true, true],
                              stack: [
                                {
                                  text: '11d. TITLE',
                                },
                                {
                                  text: 'GREGORY A. DOCKERY',
                                  style: {
                                    fontSize: 7,
                                    color: darkGray,
                                  },
                                },
                              ],
                            },
                            {
                              border: [false, false, false, true],
                              stack: [
                                {
                                  text: '11d. TITLE',
                                },
                                {
                                  text: 'CEO',
                                  style: {
                                    fontSize: 7,
                                    color: darkGray,
                                  },
                                },
                              ],
                            },
                          ],
                        ],
                      },
                    },
                    {
                      margin: [0, 0, 0, -3],
                      table: {
                        widths: [100, 180, 180],
                        body: [
                          [
                            {
                              border: [false, false, true, false],
                              stack: [
                                {
                                  text: '11e. DATE (mm/dd/yyyy)',
                                },
                                {
                                  text: data.fromDate,
                                  style: {
                                    fontSize: 7
                                  },
                                },
                              ],
                            },
                            {
                              border: [true, false, false, false],
                              stack: [
                                {
                                  text: '11f. TELEPHONE NUMBERS',
                                },
                                {
                                  text: '(Voice) 806-570-4647    (Facsimile)        ',
                                  style: {
                                    fontSize: 7,
                                    color: darkGray,
                                  },
                                },
                              ],
                            },
                            {
                              border: [true, false, false, false],
                              stack: [
                                {
                                  text: '11g. EMAIL',
                                },
                                {
                                  text: 'greg.dockery@xecoenergy.com',
                                  style: {
                                    fontSize: 7,
                                    color: darkGray,
                                  },
                                },
                              ],
                            },
                          ],
                        ],
                      },
                    },
                  ],
                },
              ],
            ],
          },
        },
        //---------------------------------------------------second page content-------------------------------------------------------
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 8,
            alignment: 'left',
          },
          table: {
            widths: [540],
            body: [
              [
                {
                  border: [false, true, false, true],
                  text: [
                    'PAPERWORK REDUCTION ACT STATEMENT: ',
                    {
                      text: 'An agency may not conduct or sponsor an information collection and a person is not required to respond to ' +
                            'this information unless it displays a current valid OMB control number and an expiration date. The control number for this collection is 1651-0098. The ' +
                            'estimated average time to complete this application is 2 hours. If you have any comments regarding the burden estimate you can write to U.S. Customs and ' +
                            'Border Protection, Office of Regulations and Rulings, 90 K Street, NE., Washington DC 20229.',
                      style: {
                        fontSize: 7,
                        bold: false,
                      }
                    },
                  ],
                  style: {
                    bold: true,
                    fontSize: 7,
                  },
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          text: 'NORTH AMERICAN FREE TRADE AGREEMENT CERTIFICATE OF ORIGIN INSTRUCTIONS',
          style: {
            fontSize: 9,
            bold: true,
            alignment: 'center',
          }
        },
        {
          margin: [0, 0, 0, 0],
          text: 'For purposes of obtaining preferential tariff treatment, this document must be completed legibly and in full by the exporter and ' +
                'be in the possession of the importer at the time the declaration is made. This document may also be completed voluntarily by ' +
                'the producer for use by the exporter. Please print or type:',
          style: {
            fontSize: 8,
            alignment: 'left'
          }
        },
        {
          pageBreak: 'after',
          margin: [0, -5, 0, 0],
          style: {
            fontSize: 6,
            alignment: 'left',
          },
          table: {
            widths: [30, 505],
            body: [
              [
                {
                  margin: [0, 5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 1:'
                },
                {
                  margin: [0, 5, 0, 0],
                  border: [false, false, false, false],
                  text: 'State the full legal name, address (including country), email and legal tax identification number of the exporter. Legal taxation number is: in ' +
                        'Canada, employer number or importer/exporter number assigned by Revenue Canada; in Mexico, federal taxpayer\'s registry number (RFC); ' + 
                        'and in the United States, employer\'s identification number or Social Security Number.',
                  style: {
                    fontSize: 8,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 2:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'Complete field if the Certificate covers multiple shipments of identical goods as described in Field #5 that are imported into a NAFTA country for ' +
                        'a specified period of up to one year (the blanket period). "FROM" is the date upon which Certificate becomes applicable to the good covered by ' +
                        'the blanket Certificate (it may be prior to the date of signing this Certificate). "TO" is the date upon which the blanket period expires. The ' +
                        'importation of a good for which preferential treatment is claimed based on this Certificate must occur between these dates.',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 3:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'State the full legal name, address (including country), email and legal tax identification number, as defined in Field #1, of the producer. If more ' +
                        'than one producer\'s good is included on the Certificate, attach a list of additional producers, including the legal name, address (including country) ' +
                        'and legal tax identification number, cross-referenced to the good described in Field #5. If you wish this information to be confidential, it is ' +
                        'acceptable to state "Available to CBP upon request". If the producer and the exporter are the same, complete field with "SAME". If the producer ' +
                        'is unknown, it is acceptable to state "UNKNOWN".',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 4:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'State the full legal name, address (including country), email and legal tax identification number, as defined in Field #1, of the importer. If the ' +
                        'importer is not known, state "UNKNOWN"; if multiple importers, state "VARIOUS".',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 5:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'Provide a full description of each good. The description should be sufficient to relate it to the invoice description and to the Harmonized System ' +
                        '(H.S.) description of the good. If the Certificate covers a single shipment of a good, include the invoice number as shown on the commercial ' +
                        'invoice. If not known, indicate another unique reference number, such as the shipping order number.',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 6:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'For each good described in Field #5, identify the H.S. tariff classification to six digits. If the good is subject to a specific rule of origin in Annex ' +
                        '401 that requires eight digits, identify to eight digits, using the H.S. tariff classification of the country into whose territory the good is imported.',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 7:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: [
                    'For each good described in Field #5, state which criterion (A through F) is applicable. The rules of origin are contained in Chapter Four and ' +
                    'Annex 401. Additional rules are described in Annex 703.2 (certain agricultural goods), Annex 300-B, Appendix 6 (certain textile goods) and ' +
                    'Annex 308.1 (certain automatic data processing goods and their parts). ',
                    {
                      text: 'NOTE: In order to be entitled to preferential tariff treatment, each good must meet at least one of the criteria below.',
                      style: {
                        fontSize: 7,
                        bold: true,
                      }
                    },
                  ],
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'Preference Criteria',
                  style: {
                    decoration: 'underline',
                    fontSize: 8,
                  },
                  colSpan: 2,
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: '',
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'A'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: [
                    'The good is "wholly obtained or produced entirely" in the territory of one or more of the NAFTA countries as referenced in Article 415. ',
                    {
                      text: 'Note: The purchase of a good in the territory does not necessarily render it "wholly obtained or produced". ',
                      style: {
                        fontSize: 7,
                        bold: true,
                      }
                    },
                    'produced". If the good is an agricultural good, see also criterion F and Annex 703.2. (Reference: Article 401(a) and 415)',
                  ],
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'B'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'The good is produced entirely in the territory of one or more of the NAFTA countries and satisfies the specific rule of origin, set out in Annex 401, ' +
                        'that applies to its tariff classification. The rule may include a tariff classification change, regional value-content requirement, or a combination ' +
                        'thereof. The good must also satisfy all other applicable requirements of Chapter Four. If the good is an agricultural good, see also criterion F and ' +
                        'Annex 703.2. (Reference: Article 401(b))',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'C'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'The good is produced entirely in the territory of one or more of the NAFTA countries exclusively from originating materials. Under this criterion, ' +
                        'one or more of the materials may not fall within the definition of "wholly produced or obtained", as set out in article 415. All materials used in the ' +
                        'production of the good must qualify as "originating" by meeting the rules of Article 401(a) through (d). If the good is an agricultural good, see also ' +
                        'criterion F and Annex 703.2. Reference: Article 401(c).',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'D'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  stack: [
                    {
                      text: 'Goods are produced in the territory of one or more of the NAFTA countries but do not meet the applicable rule of origin, set out in Annex 401, ' +
                        'because certain non-originating materials do not undergo the required change in tariff classification. The goods do nonetheless meet the regional ' +
                        'value-content requirement specified in Article 401(d). This criterion is limited to the following two circumstances:',
                    },
                    {
                      text: '1. The good was imported into the territory of a NAFTA country in an unassembled or disassembled form but was classified as an assembled ' +
                            'good, pursuant to H.S. General Rule of Interpretation 2(a), or'
                    },
                    {
                      text: '2. The good incorporated one or more non-originating materials, provided for as parts under the H.S., which could not undergo a change in ' +
                            'tariff classification because the heading provided for both the good and its parts and was not further subdivided into subheadings, or the ' +
                            'subheading provided for both the good and its parts and was not further subdivided.'
                    },
                    {
                      text: 'NOTE: This criterion does not apply to Chapters 61 through 63 of H.S. (Reference: Article 401(d))',
                      style: {
                        bold: true,
                      },
                    },
                  ],
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'E'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'Certain automatic data processing goods and their parts, specified in Annex 308.1, that do not originate in the territory are considered originating ' +
                        'upon importation into the territory of a NAFTA country from the territory of another NAFTA country when the most-favored-nation tariff rate of the ' +
                        'good conforms to the rate established in Annex 308.1 and is common to all NAFTA countries. (Reference: Annex 308.1)',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'F'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: [
                    'The good is an originating agricultural good under preference criterion A, B, or C above and is not subject to a quantitative restriction in the ' +
                    'importing NAFTA country because it is a "qualifying good" as defined in Annex 703.2, Section A or B (please specify). A good listed in Appendix ' +
                    '703.2B.7 is also exempt from quantitative restrictions and is eligible for NAFTA preferential tariff treatment if it meets the definition of "qualifying ' +
                    'good" in Section A of Annex 703.2. ',
                    { 
                      text: 'NOTE 1: This criterion does not apply to goods that wholly originate in Canada or the United States ' +
                            'and are imported into either country. NOTE 2: A tariff rate quota is not a quantitative restriction. ',
                      style: {
                        fontSize: 6,
                        bold: true,
                      }
                    },
                  ],
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 8:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'For each good described in Field #5, state "YES" if you are the producer of the good. If you are not the producer of the good, state "NO" followed ' +
                        'by (1), (2), or (3), depending on whether this certificate was based upon: (1) your knowledge of whether the good qualifies as an originating ' +
                        'good; (2) your reliance on the producer\'s written representation (other than a Certificate of Origin) that the good qualifies as an originating good; ' +
                        'or (3) a completed and signed Certificate for the good, voluntarily provided to the exporter by the producer.',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 9:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'For each good described in field #5, where the good is subject to a regional value content (RVC) requirement, indicate "NC" if the RVC is ' +
                        'calculated according to the net cost method; otherwise, indicate "NO". If the RVC is calculated over a period of time, further identify the ' +
                        'beginning and ending dates (MM/DD/YYYY) of that period. (Reference: Article 402.1, 402.5).',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  text: 'FIELD 10:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, false],
                  stack: [
                    {
                      text: 'Identify the name of the country ("MX" or "US" for agricultural and textile goods exported to Canada; "US" or "CA" for all goods exported to ' +
                            'Mexico; or "CA" or "MX" for all goods exported to the United States) to which the preferential rate of CBP duty applies, as set out in Annex 302.2, ' +
                            'in accordance with the Marking Rules or in each party\'s schedule of tariff elimination.',
                    },
                    {
                      text: 'For all other originating goods exported to Canada, indicate appropriately "MX" or "US" if the goods originate in that NAFTA country, within the ' +
                            'meaning of the NAFTA Rules of Origin Regulations, and any subsequent processing in the other NAFTA country does not increase the ' +
                            'transaction value of the goods by more than seven percent; otherwise indicate "JNT" for joint production. (Reference: Annex 302.2) ',
                    },
                  ],
                  style: {
                    fontSize: 7,
                  },
                },
              ],
              [
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, true],
                  text: 'FIELD 11:'
                },
                {
                  margin: [0, -5, 0, 0],
                  border: [false, false, false, true],
                  text: 'This field must be completed, signed, and dated by the exporter. When the Certificate is completed by the producer for use by the exporter, it ' +
                        'must be completed, signed, and dated by the producer. The date must be the date the Certificate was completed and signed.',
                  style: {
                    fontSize: 7,
                  },
                },
              ],
            ],
          },
        },
        //--------------------------------3rd Page Packing List------------------------------------------------------------------
        {
          image: logoImg,
          width: 80
        },
        {
          margin: [0, -10, 15, 0],
          text: 'PACKING LIST',
          style: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
          }
        },
        {
          margin: [0, 5, 0, 0],
          border: [false, true, false, true],
          style: {
            fontSize: 8,
            alignment: 'left',
          },
          table: {
            widths: [175, 175, 177],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'SHIPPER:',
                  style: {
                    fontSize: 5,
                    alignment: 'left',
                    decoration: 'underline',
                    bold: true,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: 'CONSIGNEE:',
                  style: {
                    fontSize: 5,
                    alignment: 'left',
                    decoration: 'underline',
                    bold: true,
                  },
                },
                {
                  border: [false, false, false, false],
                  text: 'BILL TO:',
                  style: {
                    fontSize: 5,
                    alignment: 'left',
                    decoration: 'underline',
                    bold: true,
                  },
                },
              ],
              [
                {
                  border: [true, true, true, true],
                  stack: [
                    {
                      text: 'Synerex Labs',
                    },
                    {
                      text: '1393 N. Bennett Circle',
                    },
                    {
                      text: 'Farmington, Utah 84025',
                    },
                    {
                      text: 'Tax ID: 46-2985102',
                    },
                  ],
                  style: {
                    fontSize: 6,
                    alignment: 'left',
                    bold: true,
                  },
                },
                {
                  border: [true, true, true, true],
                  stack: [
                    {
                      text: data.client.legalName,
                    },
                    {
                      text: data.facilityLocation.split(',')[0],
                    },
                    {
                      text: data.facilityLocation.split(',')[1],
                    },
                    {
                      text: data.facilityLocation.split(',')[2],
                    },
                  ],
                  style: {
                    fontSize: 6,
                    alignment: 'left',
                    bold: true,
                  },
                },
                {
                  border: [true, true, true, true],
                  stack: [
                    {
                      text: data.client.legalName,
                    },
                    {
                      text: data.clientAddress.split(',')[0],
                    },
                    {
                      text: data.clientAddress.split(',')[1],
                    },
                    {
                      text: data.clientAddress.split(',')[2],
                    },
                    {
                      text: `TAX ID: ${data.client.taxId}`,
                    },
                  ],
                  style: {
                    fontSize: 6,
                    alignment: 'left',
                    bold: true,
                  },
                },
              ],
              [
                {
                  border: [true, true, true, true],
                  stack: [
                    {
                      text: 'Contact:       Greg Dockery',
                    },
                    {
                      text: 'Tel No.:       806-570-4647',
                    },
                  ],
                  style: {
                    fontSize: 6,
                    alignment: 'left',
                    bold: true,
                  },
                },
                {
                  border: [true, true, true, true],
                  stack: [
                    {
                      text: `Contact:     ${data.client.contactName}`,
                    },
                    {
                      text: `Tel No.:     ${data.client.contactPhone}`,
                    },
                  ],
                  style: {
                    fontSize: 6,
                    alignment: 'left',
                    bold: true,
                  },
                },
                {
                  border: [true, true, true, true],
                  stack: [
                    {
                      text: `Contact:     ${data.client.contactName}`,
                    },
                    {
                      text: `Tel No.:     ${data.client.contactPhone}`,
                    },
                  ],
                  style: {
                    fontSize: 6,
                    alignment: 'left',
                    bold: true,
                  },
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          text: 'SHIPMENT INFORMATION',
          table: {
            widths: [545],
            body: [
              [
                {
                  border: [true, true, true, true],
                  text: 'SHIPMENT INFORMATION',
                  style: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'center',
                    fillColor: lightGrayBG,
                  },
                }
              ],
            ],
          },
        },
        {
          margin: [45, 5, 45, 0],
          style: {
            fontSize: 6,
            alignment: 'left',
            bold: true,
          },
          table: {
            widths: [70, 65, 75, 60, 85, 65],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'Customer PO No.:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: data.PONumber,
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Letter of Credit No.:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '     ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Transportation Method:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '     ',
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: 'PO Date: ',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '          ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Currency:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '     ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Transportation Terms:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '   ',
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: 'Ref No.:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '    ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Payment Terms:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '     ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Number of Packages:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: data.palletsTotalQty,
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: 'AWB/BL No.:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '    ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: 'Gross Weight(Kg):',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: data.palletsTotalWeight,
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, false],
                  text: '    ',
                },
                {
                  border: [false, false, false, false],
                  text: '   ',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
            bold: true,
          },
          table: {
            widths: [35, 45, 210, 70, 70, 70],
            body: [
              [
                {
                  border: [true, true, true, false],
                  text: 'QUANTITY SHIPPED',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'PRODUCT NUMBER',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'DESCRIPTION',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'UNIT WEIGHT (KGS)',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'TOTAL WEIGHT (KGS)',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, true, true, false],
                  text: 'TOTAL CUBIC FT',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
              ],
              [
                {
                  border: [true, false, true, false],
                  text: ' ',
                  colSpan: 6,
                  style: {
                    alignment: 'left',
                    decoration: 'underline',
                  },
                },
                {
                  border: [false, false, false, true],
                  text: '',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [false, false, false, true],
                  text: '',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [false, false, false, true],
                  text: '   ',
                },
              ],
              ...getPalletRows(data.pallet1),
              [
                {
                  border: [true, true, true, true],
                  text: data.palletsTotalQty,
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [false, true, true, true],
                  text: 'Total',
                  colSpan: 2,
                  style: {
                    alignment: 'left',
                  },
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [false, true, false, true],
                  text: 'Totals',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [true, true, true, true],
                  text: data.palletsTotalWeight,
                },
                {
                  border: [false, true, true, true],
                  text: data.palletsTotalCubitFt,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 15, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
            bold: true,
          },
          table: {
            widths: [145, 35, 45, 40, 35, 40, 35, 135],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [true, true, true, false],
                  text: 'NO.',
                },
                {
                  border: [true, true, true, false],
                  text: 'NO.',
                },
                {
                  border: [false, true, true, true],
                  text: 'GROSS WEIGHT ',
                  colSpan: 2,
                },
                {
                  text: '',
                },
                {
                  border: [false, true, true, true],
                  text: 'NET WEIGHT',
                  colSpan: 2,
                },
                {
                  text: '',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [true, true, true, false],
                  text: 'PKGS.',
                },
                {
                  border: [true, true, true, false],
                  text: 'PALLETS',
                },
                {
                  border: [false, true, true, true],
                  text: 'LBS',
                },
                {
                  text: 'KGS.',
                },
                {
                  border: [false, true, true, true],
                  text: 'LBS',
                },
                {
                  text: ' KGS.',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: 'TOTALS:',
                  style: {
                    alignment: 'right',
                    fontSize: 9,
                  }
                },
                {
                  border: [true, true, true, true],
                  text: data.palletsTotalQty,
                },
                {
                  border: [true, true, true, true],
                  text: data.numberOfPallets,
                },
                {
                  border: [true, true, true, true],
                  text: data.palletsTotalWeightLb,
                },
                {
                  border: [true, true, true, true],
                  text: data.palletsTotalWeight,
                },
                {
                  border: [true, true, true, true],
                  text: data.totalNetWeightLb,
                },
                {
                  border: [true, true, true, true],
                  text: data.totalNetWeight,
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          text: 'COMMENTS',
          style: {
            fontSize: 9,
            alignment: 'left',
            bold: true,
          }
        },
        {
          margin: [0, 5, 0, 0],
          table: {
            widths: [545],
            body: [
              [
                {
                  border: [true, true, true, true],
                  text: '   ',
                  style: {
                    fontSize: 9,
                    bold: true,
                    alignment: 'center',
                  },
                }
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          text: 'CERTIFIED TRUE AND CORRECT',
          style: {
            fontSize: 9,
            alignment: 'left',
            bold: true,
          }
        },
        {
          pageBreak: 'after',
          margin: [0, 5, 0, 0],
          text: 'Synerex Labs',
          style: {
            fontSize: 9,
            alignment: 'left',
            bold: 9,
          }
        },
        //-----------------------------------------4th page commercial invoice-------------------------------------
        {
          image: logoImg,
          width: 80
        },
        {
          margin: [0, -10, 15, 0],
          text: 'COMMERCIAL INVOICE',
          style: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
          }
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'left',
          },
          table: {
            widths: [125, 125, 136, 130],
            body: [
              [
                {
                  border: [true, true, true, false],
                  text: 'Date of Exportation',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, true, true, false],
                  text: 'Invoice Number',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, true, true, false],
                  text: 'Export References',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                    
                },
                {
                  border: [true, true, true, false],
                  text: 'Related Parties',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
              ],
              [
                {
                  border: [true, false, true, false],
                  text: data.fromDate,
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, false],
                  text: '  ',
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, false],
                  text: data.PONumber,
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, false],
                  text: '  ',
                  style: {
                    alignment: 'center',
                  },
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [175, 175, 175],
            body: [
              [
                {
                  border: [true, true, true, false],
                  text: 'Shipper/Exporter (complete name and address)',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, true, true, false],
                  colSpan: 2,
                  text: 'Consignee',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  text: '   ',
                },
              ],
              [
                {
                  border: [true, false, true, true],
                  stack: [
                    {
                      text: 'Synerex Labs',
                    },
                    {
                      text: '1393 N. Bennett Circle',
                    },
                    {
                      text: 'Farmington, Utah 84025',
                    },
                    {
                      text: 'Tax ID: 46-2985102',
                    },
                  ],
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  colSpan: 2,
                  stack: [
                    {
                      text: data.client.legalName,
                    },
                    {
                      text: data.facilityLocation.split(',')[0],
                    },
                    {
                      text: data.facilityLocation.split(',')[1],
                    },
                    {
                      text: data.facilityLocation.split(',')[2],
                    },
                    {
                      text: `TAX ID: ${data.client.taxId}`,
                    },
                  ],
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  text: '   ',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'left',
          },
          table: {
            widths: [175, 175, 175],
            body: [
              [
                {
                  border: [true, false, true, false],
                  text: 'Country of Export',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, false, true, false],
                  text: 'Terms of Sale',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, false, true, false],
                  text: 'Currency of Sale',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
              ],
              [
                {
                  border: [true, false, true, true],
                  text: 'USA',
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  text: data.payment,
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  text: data.currency,
                  style: {
                    alignment: 'center',
                  },
                },
              ],
              [
                {
                  border: [true, false, true, false],
                  text: 'Country of Manufacture',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, false, true, false],
                  colSpan: 2,
                  text: 'Importer (If other than consignee)',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [true, false, true, true],
                  text: '     ',
                },
              ],
              [
                {
                  border: [true, false, true, true],
                  text: 'USA',
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  rowSpan: 3,
                  colSpan: 2,
                  text: '    ',
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  text: '     ',
                },
              ],
              [
                {
                  border: [true, false, true, false],
                  text: 'Country of Ultimate Destination',
                  style: {
                    fontSize: 5,
                    fillColor: lightGrayBG,
                  },
                },
                {
                  text: '   ',
                },
                {
                  text: '    ',
                },
              ],
              [
                {
                  border: [true, false, true, true],
                  text: data.billToInfo.billToCountry,
                  style: {
                    alignment: 'center',
                  },
                },
                {
                  border: [true, false, true, true],
                  text: '   ',
                },
                {
                  border: [true, false, true, true],
                  text: '    ',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'left',
            bold: true,
          },
          table: {
            widths: [175, 175, 175],
            body: [
              [
                {
                  border: [true, false, false, true],
                  text: 'Bill of Lading No. or Airway Bill No.:',
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  border: [false, false, false, true],
                  margin: [0, 3, 5, 3],
                  style: {
                    fontSize: 7,
                    alignment: 'left',
                    bold: false,
                  },
                  table: {
                    widths: [160],
                    body: [
                      [
                        {
                          border: [true, true, true, true],
                          text: '   ',
                        },
                      ],
                    ],
                  },
                },
                {
                  border: [false, false, true, true],
                  text: ' (NOTE: All shipments must be accompanied by a Bill of Lading or Airway Bill Number.)',
                  style: {
                    fontSize: 6,
                  }
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 6,
            alignment: 'center',
          },
          table: {
            widths: [178, 60, 60, 60, 70, 70],
            body: [
              [
                {
                  border: [true, false, true, false],
                  stack: [
                    {
                      text: 'Marks & No.\'s, No. of Pkg.\'s, Type of Packaging,',
                    },
                    {
                      text: 'Full Description of Goods',
                    },
                  ],
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'left',
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'Quantity',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'Unit of Measure',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'Weight (kgs)',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'Unit Value',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
                {
                  border: [false, false, true, false],
                  text: 'Total Value',
                  style: {
                    fillColor: lightGrayBG,
                  },
                },
              ],
              ...getPalletRows2(data.pallet1),
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 6,
            alignment: 'center',
          },
          table: {
            widths: [543],
            body: [
              [
                {
                  border: [true, true, true, true],
                  margin: [-5, 2, 0, 2],
                  style: {
                    fontSize: 6,
                    alignment: 'center',
                  },
                  table: {
                    widths: [70, 60, 94, 155, 60, 60],
                    body: [
                      [
                        {
                          border: [true, true, true, true],
                          text: 'Total Number of Packages',
                          style: {
                            alignment: 'right',
                            fillColor: white,
                          }
                        },
                        {
                          border: [false, true, true, true],
                          text: data.palletsTotalQty,
                          style: {
                            alignment: 'center',
                            fillColor: white,
                            fontSize: 12,
                            bold: true, 
                          }
                        },
                        {
                          border: [true, false, false, false],
                          text: 'THIS INVOICE PREPARED FOR CUSTOMS PURPOSE ONLY',
                          style: {
                            alignment: 'center',
                            fillColor: lightGrayBG,
                          }
                        },
                        {
                          border: [true, false, false, false],
                          text: [ `Total Weight (KGS): `,
                                  { text: data.palletsTotalWeight,
                                    style: {
                                      alignment: 'right',
                                      fillColor: white,
                                      fontSize: 11,
                                      bold: true,
                                    },
                                  },
                          ],
                          style: {
                            alignment: 'right',
                            fillColor: white,
                            fontSize: 9,
                          },

                        },
                        {
                          border: [true, false, false, false],
                          text: 'Check one: ',
                          style: {
                            alignment: 'right',
                            fillColor: white,
                          }
                        },
                        {
                          border: [false, false, false, false],
                          style: {
                            alignment: 'right',
                            fillColor: white,
                          },
                          stack: [
                            {
                              text: 'F.O.B  _______',
                            },
                            {
                              text: 'C&F _______',
                            },
                            {
                              text: 'CIF _______',
                            },
                          ],
                        },
                      ],
                    ],
                  },
                  style: {
                    fillColor: black,
                    alignment: 'left',
                  },
                },
              ],
            ],
          },
        },
        {
          margin: [0, 0, 0, 0],
          style: {
            fontSize: 6,
            alignment: 'center',
          },
          table: {
            widths: [335, 95, 95],
            body: [
              [
                {
                  border: [true, true, true, true],
                  rowSpan: 4,
                  text: 'These commodities, technology or software were exported from USA in accordance with the ' +
                        'Export Administration Regulations. Diversion contrary to U.S. law prohibited. It is hereby ' +
                        'certified that this invoice shows the actual price of the goods described, that no other invoice ' +
                        'has been issued, and that all particulars are true and correct. '
                },
                {
                  border: [false, true, true, true],
                  text: 'Packing Cost:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, true, true, true],
                  text: data.palletsSubtotal,
                  style: {
                    alignment: 'right',
                  },
                },
              ],
              [
                {
                  text: ''
                },
                {
                  border: [false, true, true, true],
                  text: 'Freight Cost:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, true, true, true],
                  text: '$0.00',
                  style: {
                    alignment: 'right',
                  },
                },
              ],
              [
                {
                  text: ' ',
                },
                {
                  border: [false, true, true, true],
                  text: 'Insurance Costs:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, true, true, true],
                  text: '$0.00',
                  style: {
                    alignment: 'right',
                  },
                },
              ],
              [
                {
                  text: ' '
                },
                {
                  border: [false, true, true, true],
                  text: 'Other Costs:',
                  style: {
                    alignment: 'right',
                  },
                },
                {
                  border: [false, true, true, true],
                  text: '$0.00',
                  style: {
                    alignment: 'right',
                  },
                },
              ],
              [
                {
                  border: [false, false, true, false],
                  text: 'I certify that the stated export prices and description of goods are true and correct:',
                },
                {
                  border: [false, false, true, true],
                  text: 'Total Invoice Value:',
                  style: {
                    alignment: 'right',
                    fontSize: 9,
                    fillColor: black,
                    color: white,
                  },
                },
                {
                  border: [false, false, true, true],
                  text: data.palletsSubtotal,
                  style: {
                    alignment: 'right',
                    fontSize: 9,
                  },
                },
              ],
            ],
          },
        },
        {
          pageBreak: 'after',
          margin: [0, 15, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [200],
            body: [
              [
                {
                  border: [false, false, false, true],
                  text: '                      ',
                }
              ],
              [
                {
                  border: [false, false, false, false],
                  margin: [0, -2, 0, 0],
                  text: '(signed)',
                  style: {
                    fontSize: 5,
                  }
                }
              ],
              [
                {
                  border: [0, -3, 0, 0],
                  border: [false, false, false, false],
                  text: [
                    'Title:    ',
                    {
                      text: 'CEO',
                      style: {
                        bold: false, 
                      }
                    }
                  ],
                  style: {
                    fontSize: 6,
                    bold: true, 
                    alignment: 'left',
                  }
                }
              ],
            ],
          },
        },
        //---------------------------------------------------------------5th page shipping doc---------------------------------------------
        {
          image: logoImg,
          width: 80
        },
        {
          margin: [0, -10, 15, 0],
          text: 'CERTIFICATE OF ORIGIN',
          style: {
            fontSize: 18,
            bold: true,
            alignment: 'center',
          }
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [100, 220, 200],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'The undersigned ',
                },
                {
                  margin: [5, 0, 0, 0],
                  border: [false, false, false, true],
                  text: 'Synerex Labs  ',
                },
                {
                  margin: [10, 0, 0, 0],
                  border: [false, false, false, true],
                  text: 'Greg Dockery, CEO',
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: ' ',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  margin: [0,-2,0,0],
                  border: [false, false, false, false],
                  text: '(OWNER OR AGENT, & TITLE)',
                  style: {
                    fontSize: 5, 
                  }
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [50, 475],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'for',
                },
                {
                  border: [false, false, false, true],
                  text: '2006 Windy Terrace, Unit B, CEDAR PARK, TEXAS 78613',
                },

              ],
              [
                {
                  border: [false, false, false, false],
                  text: '', 
                },
                {
                  margin: [0,-2,0,0],
                  border: [false, false, false, false],
                  text: '(Name and Address of Shipper)',
                  style: {
                    fontSize: 5, 
                  }
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [250, 275],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'declares that the following mentioned goods are shipped via  ',
                },
                {
                  border: [false, false, false, true],
                  text: '      ',
                },

              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [50, 130, 70, 275],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'on the date of  ',
                },
                {
                  border: [false, false, false, true],
                  text: data.fromDate,
                },
                {
                  border: [false, false, false, false],
                  text: 'consigned to  ',
                },
                {
                  border: [false, false, false, true],
                  text: data.client.legalName,
                },
              ],
              [
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
                {
                  margin: [0, -2, 0, 0],
                  border: [false, false, false, false],
                  text: '(Name of Consignee)',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [325, 200],
            body: [
              [
                {
                  margin: [0, 0, 0, 0],
                  border: [false, false, false, true],
                  text: `${data.client.address}, ${data.client.city} ${data.client.state}, ${data.client.zip}`,
                },
                {
                  border: [false, false, false, false],
                  text: `Country: ${data.client.country}`,
                },
              ],
              [
                {
                  margin: [0, -2, 0, 0],
                  border: [false, false, false, false],
                  text: '(ADDRESS OF CONSIGNEE)',
                  style: {
                    fontSize: 5, 
                  }
                },
                {
                  border: [false, false, false, false],
                  text: '',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 7,
            alignment: 'center',
          },
          table: {
            widths: [60, 60, 60, 60, 60, 190],
            body: [
              [
                {
                  border: [true, true, true, true],
                  text: 'Marks and Numbers AS ADDRESS',
                  rowSpan: 2, 
                },
                {
                  border: [false, true, true, true],
                  text: 'HS Tariff Classification Number',
                  rowSpan: 2,
                },
                {
                  border: [false, true, true, false],
                  text: 'No. of Pkgs',
                },
                {
                  border: [false, true, true, false],
                  text: 'Weight in Kilos',
                  colSpan: 2, 
                },
                {
                  border: [false, false, false, true],
                  text: ' ',
                },
                {
                  border: [false, true, true, false],
                  text: 'Complete and accurate',
                },
              ],
              [
                {
                  border: [true, true, true, true],
                  text: '',
                },
                {
                  text: '',
                },
                {
                  border: [false, false, true, true],
                  text: 'Boxes or Crates',
                },
                {
                  border: [false, false, true, true],
                  text: 'Gross',
                },
                {
                  border: [false, false, true, true],
                  text: 'Net',
                },
                {
                  border: [false, false, true, true],
                  text: 'Description of Goods',
                },
              ],
              ...getPalletRows3(data.pallet1),
              [
                {
                  border: [true, false, true, true],
                  text: '    ',
                },
                {
                  border: [false, false, true, true],
                  text: '    ',
                },
                 {
                  border: [false, false, true, true],
                  text: '    ',
                },
                 {
                  border: [false, false, true, true],
                  text: '    ',
                },
                 {
                  border: [false, false, true, true],
                  text: '    ',
                },
                {
                  border: [false, false, true, true],
                  text: '    ',
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 8, 
          },
          table: {
            widths: [50, 50, 50, 50, 50],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'Certified this '
                },
                {
                  border: [false, false, false, true],
                  text: data.day,
                },
                {
                  border: [false, false, false, false],
                  text: ' day of ',
                },
                {
                  border: [false, false, false, true],
                  text: data.month,
                },
                {
                  border: [false, false, false, false],
                  text: data.year,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 8, 
          },
          table: {
            widths: [700],
            body: [
              [
                {
                  border: [false, false, false, false],
                  stack: [
                    {
                      text:'The undersigned hereby declares that the above details and statements are correct and that all the goods were produced in Taiwan and USA',
                    },
                  ], 
                  style: {
                    fontSize: 8,
                  }
                },
              ],
            ],
          },
        },
        {
          margin: [0, 5, 0, 0],
          style: {
            fontSize: 8, 
          },
          table: {
            widths: [50, 50, 50, 50, 50],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'Certified this '
                },
                {
                  border: [false, false, false, true],
                  text: data.day,
                },
                {
                  border: [false, false, false, false],
                  text: ' day of ',
                },
                {
                  border: [false, false, false, true],
                  text: data.month,
                },
                {
                  border: [false, false, false, false],
                  text: data.year,
                },
              ],
            ],
          },
        },
        {
          margin: [0, 50, 0, 0],
          table: {
            widths: [200],
            body: [
              [
                { 
                  border: [false, true, false, false],
                  text: 'Signiture of Owner or Agent',
                  style: {
                    fontSize: 7, 
                    alignment: 'center',
                  }
                },
              ],
            ],
          },
        },
      ],
      styles: {
        title: {
          fontSize: 8,
          bold: true,
        }
      }
    };

    console.log("exiting shipping-document.js generator");
    return printer.createPdfKitDocument(docDefinition);
  }

  function getPalletRows(equipments) {
    let rows = [];
    equipments.forEach(function (equipment) {
      let row = [
        {
          border: [true, false, false, false],
          text: equipment.qty,
          style: {
            alignment: 'center',
          },
        },
        {
          border: [false, false, false, false],
          text: equipment.productNumber,
        },
        {
          border: [false, false, false, false],
          stack: [
            {
              text: equipment.name,
            },
            {
              text: equipment.description,
            },
          ],
          style: {
            fontSize: 6,
            alignment: 'left',
            bold: true,
          },
        },
        {
          border: [false, false, false, false],
          text: equipment.grossWeight,
        },
        {
          border: [false, false, false, false],
          text: equipment.totalGrossWeight,
        },
        {
          border: [false, false, true, false],
          text: equipment.totalCubitFt,
        },
      ];
      rows.push(row);
    });
    return rows;
  }

  function getPalletRows2(equipments) {
    let rows = [];
    equipments.forEach(function (equipment) {
      let row = [
        {
          border: [true, false, false, false],
          text: equipment.qty,
          style: {
            alignment: 'center',
          },
        },
        {
          border: [false, false, false, false],
          text: equipment.productNumber,
        },
        {
          border: [false, false, false, false],
          stack: [
            {
              text: equipment.name,
              style: {
                fontSize: 8,
                alignment: 'left',
                bold: true, 
              },
            },
            {
              text: equipment.description,
              style: {
                fontSize: 6,
                alignment: 'left',
              },
            },
          ],
        },
        {
          border: [false, false, false, false],
          text: equipment.grossWeight,
        },
        {
          border: [false, false, false, false],
          text: equipment.totalGrossWeight,
        },
        {
          border: [false, false, true, false],
          text: '   ',
        },
      ];
      rows.push(row);
    });
    return rows;
  }
  
  function getPalletRows2(equipments) {
    let rows = [];
    equipments.forEach(function (equipment) {
      let row = [
        {
          border: [true, false, false, false],
          stack: [
            {
              text: equipment.name,
              style: {
                fontSize: 8,
                bold: true, 
              },
            },
            {
              text: equipment.description,
            },
          ],
          style: {
            alignment: 'left',
          },
        },
        {
          border: [true, false, false, false],
          text: equipment.qty,
          style: {
            fontSize: 8,
          },
        },
        {
          border: [true, false, false, false],
          text: 'kg',
        },
        {
          border: [true, false, false, false],
          text: equipment.totalGrossWeight,
          style: {
            fontSize: 8,
          },
        },
        {
          border: [true, false, false, false],
          text: `$${equipment.value}`, 
          style: {
            fontSize: 8,
          },
        },
        {
          border: [true, false, true, false],
          text: equipment.totalValue,
          style: {
            fontSize: 8,
          },
        },
      ];
      rows.push(row);
    });
    return rows;
  }

function getPalletRows3(equipments) {
    let rows = [];
    equipments.forEach(function (equipment) {
      let row = [
        {
          border: [true, false, true, false],
          text: equipment.productNumber,
        },
        {
          border: [false, false, true, false],
          text: equipment.tariffNumber,
        },
        {
          border: [false, false, true, false],
          text: equipment.numberOfPackages,
        },
        {
          border: [false, false, true, false],
          text: equipment.totalGrossWeight, 
        },
        {
          border: [false, false, true, false],
          text: equipment.totalNetWeight,
        },
        {
          border: [false, false, true, false],
          stack: [
            {
              text: equipment.name,
            },
            {
              text: equipment.description,
            },
          ],
          style: {
            alignment: 'left',
          },
        },
      ];
      rows.push(row);
    });
    return rows;
  }

  function getPalletRows4(equipments) {
    let rows = [];
    equipments.forEach(function (equipment) {
      let row = [
        {
          border: [false, false, true, false],
          text: equipment.name,
          style: {
            alignment: 'left',
            color: darkGray,
          },
        },
        {
          border: [false, false, true, false],
          text: equipment.tariffNumber,
          style: {
            alignment: 'left',
            color: darkGray,
          },
        },
        {
          border: [false, false, true, false],
          text: ' ',
        },
        {
          border: [false, false, true, false],
          text: equipment.producer, 
          style: {
            alignment: 'left',
            color: darkGray,
          },
        },
        {
          border: [false, false, true, false],
          text: equipment.totalValue,
          style: {
            alignment: 'right',
            color: darkGray,
          },
        },
        {
          border: [false, false, false, false],
          text: equipment.origin,
          style: {
            alignment: 'left',
            color: darkGray,
          },
        },
      ];
      rows.push(row);
    });
    return rows;
  }

};
