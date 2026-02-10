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

  function generate (data, logoImg) {
    console.log("in generator js");
    let docDefinition = {
      pageMargins: [20, 20, 20, 20],
      fontSize: 9,
      content: [
        //------------------- Cover -------------------
        //-------------------Page 2-------------------
        {
          image: logoImg,
          width: 80
        },
        {
          text: data.clientAddressLine,
          style: {
            fontSize: 8,
          }
        },
        {
          border: noBordersCell,
          text: `AGREEMENT NO.: ${data.reportNumber}`,
          alignment: 'right',
          style: {
            fontSize: 8,
          }
        },
        {
          margin: [0, 10, 0, 0],
          table: {
            widths: ['*', 'auto', '*'],
            body: [
              [
                {
                  border: noBordersCell,
                  text: '',
                },
                {
                  margin: [10, 0, 10, 0],
                  border: noBordersCell,
                  stack: [
                    {
                      text: 'EQUIPMENT FINANCING AGREEMENT',
                      
                      style: {
                        alignment: 'center',
                        bold: true
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
            widths: [200,100, 100, 100],
            body: [
              [ 
                {
                  colSpan: 4,
                  stack: [
                    {
                      text: 'Debtor',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 9,
                      },
                    },
                    {
                      text: data.clientName,
                      style: {
                        alignment: 'left',
                        fontSize: 8,
                      }
                    },
                  ],
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
              ],
              [
                {
                  stack: [
                    {
                      text: 'Billing Address',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 9,
                      }
                    },
                    {
                      text: data.clientAddress,
                      style: {
                        alignment: 'left',
                        fontSize: 8,
                      }
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: 'City',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 9,
                      }
                    },
                    {
                      text: data.clientCity,
                      style: {
                        alignment: 'left',
                        fontSize: 8,
                      }
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: 'State',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 9,
                      }
                    },
                    {
                      text: data.clientState,
                      style: {
                        alignment: 'left',
                        fontSize: 8,
                      }
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: 'Zip',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 9,
                      }
                    },
                    {
                      text: data.clientZip,
                      style: {
                        alignment: 'left',
                        fontSize: 8,
                      }
                    },
                  ],
                },
              ],
            ],
          },
        },
        {
          margin: [0,0,0,0],
          table: {
            widths: [100, 418],
            body: [
              [
                {
                  text: 'Quantity',
                  border: [true, false, true, true],
                  style: {
                    fontSize: 9,
                  },
                },
                {
                  text: 'Full Description of Equipment, Including Make, Model and Serial Number',
                  style: {
                    fontSize: 8,
                  },
                  border: [true, false, true, true],
                }
              ],
              [
                {
                  text: '',
                  border: [true, false, true, true],
                },
                {
                  text: 'Energy Management System Installation with wireless controls and reporting capability',
                  style: {
                    fontSize: 8
                  },
                  border: [true, false, true, true],
                }
              ],
            ],
          },
        },
        {
          margin: [0,10,0,0],
          table: {
            widths: [150, 220, 140],
            body: [
              [
                {
                  stack: [
                    {
                      text: 'Monthly Payment Criteria:',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 7
                      },
                    },
                    {
                      text: 'Monthly payments are established as follows:',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 7
                      }
                    },
                    {
                      text: '1. Down payment upon the Execution of the Agreement.',
                      style: {
                        alignment: 'left',
                        fontSize: 7,
                      }
                    },
                    {
                      text: '2. Second payment when Xeco installs equipment in the Debtor facility.',
                      style: {
                        alignment: 'left',
                        fontSize: 7,
                      }
                    },
                    {
                      text: '3. Monthly payments determined Xeco performs equipment test to establish the monthly energy savings for establishing the monthly payment.',
                      style: {
                        alignment: 'left',
                        fontSize: 7,
                      }
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: `Down Payment (to accompany agreement) ${data.downPayment}`,
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 7,
                      },
                    },
                    {
                      text: `Monthly Payment ${data.monthlyPayment} in ${data.monthsToPay} months`,
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 7,
                      },
                    },
                    {
                      text: `The monthly payment amount is determined ` + 
                      'based on the results of a real-time performance test conducted immediately after the ' +
                      'installation of Xeco’s equipment. The test compares consumption data gathered when Xeco’s ' + 
                      'equipment is ‘ON’ versus when it is ‘OFF’. Client will be billed the monthly payment ' + 
                      'amount every month until the Total Cost of the installed equipment has been paid to Xeco at ' + 
                      'which time billing will cease except for monthly service fees if applicable.',
                      style: {
                        alignment: 'left',
                        fontSize: 7,
                      },
                    },
                  ],
                },
                {
                  stack: [
                    {
                      text: 'Equipment Cost calculated from Bill and Bill Analytic:',
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 7,
                      }
                    },
                    {
                      text: data.billAnalysis.totalCost,
                      style: {
                        alignment: 'left',
                        bold: true,
                        fontSize: 9,
                      }
                    },
                    {
                      text: '+',
                      style: {
                        alignment: 'center',
                        fontSize: 9,
                      }
                    },
                    {
                      text: `Total Interest Rate: ${data.interestRate}%`,
                      style: {
                        alignment: 'left',
                        fontSize: 9,
                      }
                    },
                    {
                      text: 'Total Financing Cost:',
                      style: {
                        alignment: 'left',
                        fontSize: 9,
                      }
                    },
                    {
                      text: data.totalFinancingCost,
                      style: {
                        alignment: 'left',
                        fontSize: 9,
                        bold: true,
                      }
                    },
                    {
                      margin: [0,10,0,0],
                      text: `= ${data.totalProjectCost}`,
                      style: {
                        alignment: 'left',
                        fontSize: 10,
                        bold: true,
                      }
                    },
                  ],
                },
              ],
              [
                {
                  text: 'Equipment Location',
                  style: {
                    alignment: 'left',
                    fontSize: 9,
                  }
                },
                {
                  colSpan: 2,
                  text: data.location,
                  style: {
                    alignment: 'left',
                    fontSize: 9,
                  }

                },
                {

                },
              ],
          
            ],
          },
        },
        {
          margin: [0, 10, 0, 0],
          text: 'Debtor and Creditor agree that Creditor will finance the above-described personal property (collectively and including replacements the "Equipment" and individually an "Item") under the terms of this ' +
                'equipment financing agreement ("agreement") which are set forth here and on page 2 of this agreement.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '1. SECURITY INTEREST. Debtor hereby grants Creditor a security interest under the Uniform Commercial Code in the Equipment. The grant as to an Item and Debtor’s related obligations ' +
                'will be effective as of the later of execution hereof or when Debtor acquires an interest therein. The security interest secures Debtor\'s performance of Debtor\'s obligations hereunder ' + 
                'and under any other agreement under which Debtor now or hereafter has obligations to Creditor. Subject to Creditor’s proper perfection and maintenance of its security interest, Debtor shallensure ' + 
                'that no other lien will take priority over this security interest.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '2. PAYMENTS. Debtor will repay the Equipment Cost/Advance shown above in the payments shown above. The payment amounts shown above are based on the Equipment Cost/Advance ' +
                'plus four and one quarter percent (4.25%).Monthly payments are made in an amount as set out above in the Monthly Payment section. The down payment and the second payment amounts are estimations ' +
                'of the Monthly Payment amount, and any excess or deficiency between the down payment or the second payment and the actual monthly amount as finally determined will be payable with or credited ' +
                'to the third payment. The first monthly payment is due on the first day of the month after completed installation. If execution of the Disbursement Authorization occurs on or before the 15th of the ' +
                'month, then the second monthly installment payment for item 3 in the Monthly Payment Criteria will be due on the 1st of each month, or other period set forth above. If execution of the Disbursement ' +
                'Authorization after the 15 th of the month, then the second monthly installment payment for item 3 in the Monthly Payment Criteria will be due on the 15th of the following month, or other period set forth above. ' +
                'Subsequent payments will be due on the same day of the month as the second payment for item 3 in the Monthly Payment Criteria until the full amount and interest are paid, and whether or not an invoice is ' +
                'rendered. Other amounts due not specifically outlined here are payable 60 days after Debtor\'s receipt of an invoice therefor. Debtor will pay Creditor amounts due under this agreement at Creditor\'s ' +
                'address shown above or as Creditor may otherwise notify Debtor. Subject to the terms of Section 12, and Debtors compliance with its material duties under this Agreement, Creditor shall apply ' +
                'payment amounts for payments made by Debtor under item 3 in the Monthly Payment Criteria in inverse order, with financing advance charges applied before principle amounts are applied, until the total ' +
                'amount is paid. If there is a default, payments may be applied to Debtor\'s obligations as Creditor chooses.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '3. CREDITOR TERMINATION. If the Disbursement Authorization has not been executed and delivered to Creditor, Creditor may terminate its obligations to finance the Equipment on notice ' +
                'to Debtor (a) subsequent to 60 days from the agreement date, (b) upon a material adverse change in Debtor’s financial condition, (c) if the actual advance would exceed the Equipment Cost/Advance by ' +
                'more than 10%, or (d) if the Debtor is in default',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '4. LOCATION; INSPECTION; USE. Debtor will keep, or permanently garage and not remove from such location for more than 30 days, or from the United States for any period, each Item in ' +
                'Debtor\'s possession and control at the Equipment Location or such other location to which Creditor may consent in writing. Upon request, Debtor will advise Creditor as to the exact location of an Item. ' +
                'Upon request, and subject to confidentiality and site security requirements, Creditor may inspect an Item during normal business hours, and Debtor will ensure Creditor\'s access for such purpose. Each Item ' +
                'will be operated carefully and properly in compliance with all applicable governmental, insurance and manufacturer\'s warranty requirements and all manufacturer\'s reasonable instructions.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '5. MAINTENANCE; ALTERATIONS. Debtor will maintain each Item in good condition and repair and as specified in the manufacturer’s requirements. Debtor shall maintain and service each ' +
                'Item in accordance with the manufacturer’s requirements, but in no event shall Debtor use less than reasonable care in maintaining and servicing each Item. Debtor will not make any alterations or additions ' +
                'to an Item which detract from its economic value or functional utility except as stated in the two preceding sentences. Alterations or additions not readily removable or made to comply with governmental ' +
                'requirements will be deemed accessions to the Item.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '6. LOSS AND DAMAGE; STIPULATED VALUE. Debtor will bear all risk of loss, theft, destruction or requisition of or damage to an Item ("Casualty Occurrence"). Debtor will give Creditor ' +
                'prompt notice of a Casualty Occurrence and will then repair the Item; provided, if the Item is lost, stolen, destroyed or damaged beyond repair or is requisitioned or suffers a constructive loss under an ' +
                'insurance policy carried hereunder, Debtor will pay Creditor the "Stipulated Value" equal to (a) any amounts due to Creditor from Debtor at the time of the payment and (b) the remaining payments as to ' +
                'the Item with each discounted to present value at 10% per annum from the date due to the date of payment. Upon such payment Creditor\'s security interest will terminate as to the Item; provided Debtor is ' +
                'not in default.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '7. TITLING; REGISTRATION. Each Item subject to title registration laws will at all times be titled and/or registered by Debtor in such a manner and jurisdictions as Creditor directs. Debtor ' +
                'will promptly notify Creditor of any necessary or advisable retitling and/or re-registration of an Item in a different jurisdiction.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '8. TAXES. Debtor will make all filings and pay all taxes and other governmental assessments relative to the Equipment as required by law. Debtor will pay or reimburse Creditor for any other ' + 
                'taxes and other governmental assessments other than Creditor\'s net income taxes related to the payments due under or otherwise related to this agreement. Returns in connection with these latter matters' +
                'will be filed by Creditor or Debtor as Creditor specifies.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '9. INSURANCE. Debtor will maintain all risk insurance on the Equipment for not less than its full replacement value naming Creditor as Loss Payee. Creditor may require Debtor to maintain ' +
                'combined public liability and property damage insurance with a single limit of not less than $500,000 per occurrence, or such other amount as Creditor may require on notice to Debtor, naming Creditor as ' +
                'an Additional Insured. All required insurance must be in a form and with companies approved by Creditor, must name Debtor as a Named Insured, must provide at least ten (10) days advance written ' +
                'notice to Creditor of change or cancellation, must provide breach of warranty protection, where relevant, and must provide that the coverage is "primary." Insurance proceeds, at Creditor\'s option, will be ' +
                'applied to (a) the repair of applicable Items, (b) payment of the Stipulated Value and/or (c) payment of other obligations to Creditor. Any excess will belong to Debtor. Debtor appoints Creditor as ' +
                'Debtor\'s attorney-in-fact to do all things necessary or advisable to secure payments under any policy contemplated hereby on account of a Casualty Occurrence. Debtor will cause Creditor to receive ' +
                'evidence reasonably requested by Creditor of the coverage required above.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '10. CREDITOR’S PAYMENT. If Debtor fails to perform any obligation hereunder, Creditor may perform the obligation, and Debtor will reimburse Creditor’s direct and substantiated related ' +
                'costs. However, before Creditor purchases insurance because Debtor has failed to comply with paragraph 9, Creditor will give Debtor notice and an opportunity to obtain the required coverage. If ' +
                'Debtor does not do so and Creditor places coverage, the charge for the replacement insurance Creditor obtains, which will be billed and be payable with the installment payments, will include a fee on the ' +
                'premium as well as the allocable premium. Also, any insurance Creditor obtains will not provide any liability coverage whatsoever, will insure Creditor only and will not relieve Debtor from Debtor’s ' +
                'liability for the difference between the insurance proceeds and Debtor’s responsibility for the Stipulated Value if the agreement must be paid off as to any Equipment after a Casualty Occurrence or cover ' +
                'any equity Debtor may have. No further insurance charges will be imposed once and for so long as Debtor complies with paragraph 9.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '11. INDEMNITY. Debtor will indemnify, defend and hold harmless Creditor against any liabilities, losses, claims, actions and expenses, including court costs and legal expenses, incurred by ' +
                'Creditor and arising from third party claims which relate to this agreement or the Equipment, including claims of latent or other defects, strict liability claims (whether in either case relating to an event while ' +
                'Creditor has a security interest therein). Each party will give the other notice of any covered event promptly after learning thereof.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '12. DEFAULT. Debtor will be in default of this agreement if (a) Debtor fails to pay any amount hereunder when due; (b) Debtor fails to perform any other material obligation hereunder or under ' + 
                'any other agreement between Creditor and Debtor; (c) Debtor dies or is declared legally incompetent, if an individual; (d) a petition is filed by or against Debtor under the Bankruptcy Act or under any ' +
                'other law providing relief for debtors; (e) Debtor makes an assignment for the benefit of creditors, a receiver or trustee is appointed for Debtor, a proceeding contemplating winding up of Debtor\'s affairs ' +
                'is instituted, Debtor ceases business affairs or Debtor makes an abnormal transfer of a material portion of Debtor\'s assets; (f) an event described in (c), (d) or (e) occurs as to a guarantor of Debtor\'s ' +
                'obligations hereunder; or (g) there is a material misrepresentation to Creditor by Debtor or a guarantor in connection with this agreement or a default occurs under a real estate lease or mortgage ' +
                'covering property where an Item is located allowing exercise of default remedies thereunder.', 
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '13. REMEDIES. If the Debtor is in default of this Agreement, Creditor may, at its option, do any one or more of the following: (a) accelerate the remaining payments and declare due the Stipulated ' +
                'Value; (b) use self-help and other lawful remedies to take possession of any Items; (c) sell or otherwise dispose of any Items in a manner which is commercially reasonable; (d) recover from Debtor all ' +
                'amounts then due and owing hereunder less the net sales price (net of all Creditor’s costs and expenses of sale) of any Items Creditor has repossessed and sold; or (e) utilize any other remedy available to ' +
                'Creditor under the Uniform Commercial Code or otherwise at law or in equity. All remedies are cumulative and may be exercised concurrently or separately from time to time. Any waiver by Creditor of a provision of this agreement must be in writing, and forbearance by ' +
                'Creditor will not constitute a waiver.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '14. ASSIGNMENT. Without the prior written consent of Creditor, Debtor will not lease, transfer an interest in, or allow a lien against any Item for longer than 15 days, or transfer any obligation under ' +
                'this agreement except a lien in an Item created by Creditor. Debtor\'s obligations are not assignable by operation of law. All Creditor\'s rights under this agreement and interest in the Equipment may be ' +
                'disposed of without notice to Debtor. Debtor will acknowledge receipt of any notice of assignment in writing and will pay any assigned amounts as directed in the notice. If Creditor assigns this ' +
                'agreement or any interest herein, Debtor will not assert against the assignee any claim or defense it may have against Creditor, and Debtor will pursue any rights on account thereof solely against Creditor ' +
                'personally. No assignee will be obligated to perform any obligation of Creditor under this agreement unless assumed by the assignee. Subject to the foregoing, this agreement is for the benefit of, and ' +
                'binds, the heirs, legatees, personal representatives, successors and assigns of the parties.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '15. PERSONAL PROPERTY. Debtor will mark the Equipment or Equipment Location at Creditor’s request to indicate Creditor’s security interest in the Equipment. Each Item will remain ' +
                'personalty despite attachment to realty. Debtor will obtain and deliver to Creditor, upon Creditor’s request, real property waivers in form satisfactory to Creditor from all persons claiming an interest in the ' +
                'real property on which an Item is or is to be located.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '16. ADDITIONAL DOCUMENTS. Debtor will obtain and deliver to Creditor such documents as Creditor requests to protect its interest in this agreement and the Equipment, including financing ' +
                'statements and fixture filings.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '17. LATE PAYMENT. If Debtor fails to pay an amount hereunder within 10 days of when due, Debtor will pay Creditor’s standard returned check charge, if relevant. ' +
                'statements and fixture filings. ',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '18. DEPOSIT. Any deposit Debtor furnishes in connection with this agreement will not bear interest and may be applied by Creditor to any obligations of Debtor to Creditor which are in default. ' +
                'When Debtor has satisfied all Debtor\'s obligations hereunder, Creditor will return any remaining balance of the deposit to Debtor.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [0, 10, 0, 0],
          text: '19. GENERAL. This agreement contains the entire agreement between Creditor and Debtor concerning the financing of the Equipment and may be amended only by a written agreement signed by ' +
                'the party to be charged. Notices hereunder must be in writing and mailed with appropriate U.S. First Class Mail postage prepaid to the party involved at its respective address set forth above or at such other ' +
                'address as such party may provide the other on notice. Notices will be effective upon receipt. Each party will promptly notify the other of any change in address. The singular includes the plural and the ' +
                'word "Creditor" includes all assignees of Creditor. The liability of co-debtors is joint and several, however Creitor must exhaust its remedies against Debtor before exercising any rights it may have against ' +
                'a guarantor of Debtor. Paragraph titles are not an aid in interpretation.',
          style: {
            fontSize: 6
          }
        },
        {
          margin: [50, 10, 0, 0],
          style: {
            alignment: 'center'
          },
          table: {
            widths: [450],
            body: [
              [
                {
                  margin: [0, 0, 0, 0],
                  stack: [
                    {
                      margin: [0, 5, 0, 0],
                      text: '20. GOVERNING LAW; VENUE. THIS AGREEMENT WILL BE GOVERNED BY THE INTERNAL LAWS OF TEXAS. VENUE FOR ANY RELATED ACTION WILL BE IN AN APPROPRIATE COURT IN TRAVIS COUNTY, TEXAS SELECTED BY CREDITOR WHICH DEBTOR CONSENTS OR IN ANOTHER COURT ' +
                        'CREDITOR SELECTS HAVING JURISDICTION . Creditor and arising from third party claims which relate to this agreement or the Equipment, including claims of latent or other defects, strict liability claims (whether in either case relating to an event while ' +
                        'Creditor has a security interest therein). Each party will give the other notice of any covered event promptly after learning thereof.',
                      style: {
                        fontSize: 8,
                        alignment: 'left',
                      }
                    },
                    {
                      margin: [0, 5, 0, 0],
                      text: '21. NO OFFSET; PREPAYMENT. DEBTOR\'S OBLIGATION TO MAKE ALL PAYMENTS UNDER THIS AGREEMENT IS ABSOLUTE AND UNCONDITIONAL AND WILL NOT BE SUBJECT TO ANY ABATEMENT, COUNTERCLAIM, RECOUPMENT, OFFSET OR DEFENSE. DEBTOR MAY NOT VOLUNTARILY PREPAY ITS ' +
                            'OBLIGATIONS HEREUNDER.',
                      style: {
                        fontSize: 8,
                        alignment: 'left',
                      }
                    },
                    {
                      margin: [0, 5, 0, 0],
                      text: '22. NO AGENCY. DEBTOR ACKNOWLEDGES THAT NO SUPPLIER NOR ANY FINANCIAL INTERMEDIARY NOR ANY AGENT OR EITHER IS AN AGENT OF CREDITOR, THAT NONE OF SUCH PARTIES IS AUTHORIZED TO WAIVE OR ALTER ANY TERM OR CONDITION OF THIS AGREEMENT AND THAT NO ' +
                            'REPRESENTATION AS TO THE EQUIPMENT OR ANY OTHER MATTER BY ANY SUCH PARTY IS BINDING UPON CREDITOR.',
                      style: {
                        fontSize: 8,
                        alignment: 'left',
                      }
                    },
                    {
                      margin: [0, 5, 0, 0],
                      text: '23. FINANCING. THIS AGREEMENT IS SOLELY A FINANCING AGREEMENT. CREDITOR HAS HAD NO INVOLVEMENT IN THE SELECTION OR PURCHASE OF AND HAS MADE NO AGREEMENT, REPRESENTATION OR WARRANTY AS TO ANY ITEM.',
                      style: {
                        fontSize: 8,
                        alignment: 'left',
                      }
                    },
                  ],
                },
              ],
            ],
          },
        },
        {
          margin: [50, 10, 0, 0],
          text: `Dated as of: ${data.date}`,
          style: {
            fontSize: 8
          }
        },
        {
          margin: [0, 10, 0, 0],
          columns: [
            {
              width: '*',
              stack: [
                {
                  margin: [50, 0, 0, 0],
                  text: 'Creditor: Xeco Energy Corporate',
                  style: {
                    bold: true
                  }
                },
                {
                  margin: [50, 25, 0, 0],
                  text: 'Signature: ____________________________________'
                },
                {
                  margin: [50, 15, 0, 0],
                  text: 'Title: __________________________________'
                },
                {
                  margin: [50, 15, 0, 0],
                  text: 'Date: __________________________________'
                }
              ]
            },
            {
              width: '*',
              stack: [
                {
                  text: `Debtor: ${data.clientName}`,
                  style: {
                    bold: true
                  }
                },
                {
                  margin: [0, 25, 0, 0],
                  text: 'Signature: ____________________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'Title: ____________________________________'
                },
                {
                  margin: [0, 15, 0, 0],
                  text: 'Date: __________________________________'
                },
              ]
            }
          ],
          style: {
            fontSize: 9
          }
        },
        //-------------------Page 4 - Index-------------------
        
      ],
      styles: {
        title: {
          fontSize: 11,
          bold: true,
        }
      }
    };

    return printer.createPdfKitDocument(docDefinition);
  }
};

