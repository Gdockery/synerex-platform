module.exports = function (printer) {

  const gray = '#868686',
    lightGrayBG = '#d9d9d9',
    green = '#006411',
    blueBG = '#00b0f0',
    xecoSavingsColor = '#333333',
    darkGreen = '#363600',
    noBordersCell = [false, false, false, false];

  return {
    generate: generate
  };

  function generate (co2Data, logoPath, headPath, graphPath, energyPath, graphicPath) {
    let docDefinition = {
      pageMargins: [50, 50, 50, 50],
      header: function (page) {
        if (page != 3) {
          return {
            margin: [0, 30, 50, 0],
            alignment: 'right',
            columns: [
              {
                width: '*',
                text: `Report No.: ${co2Data.reportNumber}`,
                style: {
                  bold: true,
                  fontSize: 10
                }
              }
            ]
          }
        }
      },
      footer: function (page) {
	      return {
	        margin: [50, 20, 50, 0],
	        layout: 'noBorders',
	        table: {
	          widths: [220, 150, '*'],
	          body: [
	            [
	              {
	                text: 'Synerex Labs Corp, - Facility Engineering Services',
	                style: {
	                    bold: true
	                }
	              },
	              {
	                text: 'Confidential Client Carbon Report',
	                style: {
	                  bold: true,
	                  alignment: 'center'
	                }
	              },
	              {
	                text: `Page ${page}`,
	                style: {
	                  alignment: 'right',
	                  bold: true,
	                  fontSize: 10
	                }
	              }
	            ]
	          ],
	        },
	        style: {
	          fontSize: 8
	        }
	      }
      },
      content: [
      	//------------------ Cover Page  ------------------
        {
          margin: [20, 50, 0, 0],
          alignment: 'center',
		      columns: [
  	        { width: '*', text: '' },
  	        {
  	            width: 'auto',
  	            layout: 'noBorders',
  	            table: {
  	                body: [
  	                    [{
  		                  margin: [0, 0, 0, 0],
  		                  image: logoPath,
  		                  width: 200,
  		                }]
  	                ]
  	            }
  	        },
  	        { width: '*', text: '' },
	        ]
        },
        {
          margin: [0, 50, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'Carbon Emission Reduction Report',
                  style: {
                    alignment: 'center',
                    bold: true,
                    color: 'black',
                    fontSize: 16
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          alignment: 'center',
		      columns: [
  	        { width: '*', text: '' },
  	        {
  	            width: 'auto',
  	            layout: 'noBorders',
  	            table:{
  	            	body:[
  	            		[{
  	            			columns:[
  				            	{ width: 100, text:'Facility:', margin: [0, 5, 0, 0], style:{ alignment: 'right' } },
  				            	{ width: 200,
  				            	  margin: [5, 0, 0, 0],
  				            	  layout: 'noBorders',
  				            	  alignment: 'left',
  				            	  table:{
  				            	  	body:[
  				            	  		[{text: `${co2Data.facilityLine1}`, style:{ bold: true, color: 'black', fontSize: 13 }}],
  				            	  		[{text: `${co2Data.facilityLine2}`, style:{ bold: true, color: 'black', fontSize: 13 }}],
  				            	  		[{text: `${co2Data.facilityLine3}`, style:{ bold: true, color: 'black', fontSize: 13 }}],
  				            	  	]
  				            	  }
  				            	},
  			           		]
  			        	}],
  			        	[{  margin: [0, 10, 0, 0],
  	            			columns:[
  				            	{ width: 100, text:'Report Month:', margin: [0, 5, 0, 0], style:{ alignment: 'right' } },
  				            	{ width: 200,
  				            	  margin: [5, 0, 0, 0],
  				            	  layout: 'noBorders',
  				            	  alignment: 'left',
  				            	  table:{
  				            	  	body:[
  				            	  		[{text: `${co2Data.reportDate}`, style:{ bold: true, color: 'black', fontSize: 13 }}]
  				            	  	]
  				            	  }
  				            	},
  			           		]
  			        	}],
  			        	[{  margin: [0, 10, 0, 0],
  	            			columns:[
  				            	{ width: 100, text:'Location:', margin: [0, 5, 0, 0], style:{ alignment: 'right' } },
  				            	{ width: 200,
  				            	  margin: [5, 0, 0, 0],
  				            	  layout: 'noBorders',
  				            	  alignment: 'left',
  				            	  table:{
  				            	  	body:[
  				            	  		[{text: `${co2Data.location}`, style:{ bold: true, color: 'black', fontSize: 13 }}]
  				            	  	]
  				            	  }
  				            	},
  			           		]
  			        	}],
  			        	[{  margin: [0, 0, 0, 0],
  	            			columns:[
  				            	{ width: 100, text:'Circuit Portion:', margin: [0, 5, 0, 0], style:{ alignment: 'right' } },
  				            	{ width: 200,
  				            	  margin: [5, 0, 0, 0],
  				            	  layout: 'noBorders',
  				            	  alignment: 'left',
  				            	  table:{
  				            	  	body:[
  				            	  		[{text: `${co2Data.circuitPortion}`, style:{ bold: true, color: 'black', fontSize: 13, decoration: 'underline' }}]
  				            	  	]
  				            	  }
  				            	},
  			           		]
  			        	}],
  	            	]
  	            }
  	        },
  	        { width: '*', text: '' },
  	     ]
        },
        {
          margin: [0, 80, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}]
        },
        {
          margin: [0, 5, 0, 0],
          width: '100%',
          style: {
          	borderTop: '1px solid black'
          },
          columns: [
          	{
                text: [
                   {
                   	text: 'Disclaimer:',
                   	style: {
                      bold: true,
                      decoration: 'underline'
                    }
                   },
                   ' This Carbon Emission Reduction Report (Report) has been prepared for the proposed Client by Synerex Labs (Synerex), based on assumptions as identified throughout the text and upon information and data supplied by others. The Report is to be read in the context of the methodology, procedures and techniques used, Synerex’s assumptions, and the circumstances and constraints under which the Report was written. The Report is to be read as a whole, and sections or parts thereof should therefore not be read or relied upon out of context. Synerex has, in preparing the Report, followed methodology and procedures, and exercised due care consistent with the intended level of accuracy, using its professional judgment and reasonable care. However, no warranty should be implied as to the accuracy of estimates or other values and all estimates and other values are only valid as at the date of the Report and will vary thereafter. Parts of the Report have been prepared or arranged by Client or third party contributors, as detailed in the document. While the contents of those parts have been generally reviewed by Synerex for inclusion into the Report, they have not been fully audited or sought to be verified by Synerex. Synerex is not in a position to, and does not, verify the accuracy or completeness of, or adopt as its own, the information and data supplied by others and disclaims all liability, damages or loss with respect to such information and data. In respect of all parts of the Report, whether or not prepared by Synerex no express or implied representation or warranty is made by Synerex or by any person acting for and/or on behalf of Synerex to any third party that the contents of the Report are verified, accurate, suitably qualified, reasonable or free from errors, omissions or other defects of any kind or nature. Third parties who rely upon the Report do so at their own risk and Synerex disclaims all liability, damages or loss with respect to such reliance. Synerex disclaims any liability, damage and loss to Client and to third parties in respect of the publication, reference, quoting or distribution of the Report or any of its contents to and reliance thereon by any third party. This disclaimer must accompany every copy of this Report, which is an integral document and must be read in its entirety.'
                ],
               	style: {
                    fontSize: 8,
                    italics: true
                }
            }
           ]
        },
        {
          margin: [0, 5, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}]
        },
        {
          margin: [0, 10, 0, 0],
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: `Project Mananger: ${co2Data.projectManager}`,
                  style: {
                    alignment: 'right',
                    bold: true,
                    color: 'black',
                    fontSize: 12
                  }
                }
              ]
            ]
          }
        },
        //------------------ 2 Page  ------------------
        {
          margin: [0, 100, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  image: headPath,
                  width: 480,
                  style: {
                  	fillColor: 'black',
                    alignment: 'center',
                    bold: true,
                    color: 'black',
                    fontSize: 16
                  }
                }
              ]
            ]
          }
        },
        {
          width: 100,
          relativePosition: {x: 400, y: -25},
          text: `${co2Data.reportNumber}`,
          style: {
            bold: true,
            fontSize: 10
          }
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'Carbon Emission Reduction Report',
                  style: {
                  	fillColor: lightGrayBG,
                    alignment: 'center',
                    bold: true,
                    color: darkGreen,
                    fontSize: 16
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  columns:[
                    { width: '*',
                      margin: [5, 5, 0, 0],
                      layout: 'noBorders',
                      alignment: 'left',
                      style: {
                        fontSize: 10
                      },
                      columns: [
                        { width:70, text:'Prepared for:', style:{ bold: true } },
                        { width: '*',
                          margin: [5, 0, 0, 0],
                          layout: 'noBorders',
                          alignment: 'left',
                          table:{
                            body:[
                              [{text: `${co2Data.facilityLine1}`}],
                              [{text: `${co2Data.facilityLine2}`}],
                              [{text: `${co2Data.facilityLine3}`}],
                            ]
                          }
                        },
                      ]
                    },
                    { width: '*',
                      margin: [5, 5, 0, 0],
                      layout: 'noBorders',
                      alignment: 'left',
                      style: {
                        fontSize: 10
                      },
                      columns: [
                        { width:100,
                          margin: [5, 0, 0, 0],
                          layout: 'noBorders',
                          alignment: 'right',
                          table:{
                            body:[
                              [{text: `Date of Report:`, style:{ bold: true}}],
                              [{text: `Project Mananger:`, style:{ bold: true }}],
                              [{text: `Referenced Circuit:`, style:{ bold: true}}],
                            ]
                          }
                        },
                        { width: '*',
                          margin: [5, 0, 0, 0],
                          layout: 'noBorders',
                          alignment: 'left',
                          table:{
                            body:[
                              [{text: `${co2Data.reportDate}`}],
                              [{text: `${co2Data.projectManager}`}],
                              [{text: `${co2Data.circuitPortion}`}],
                            ]
                          }
                        },
                      ]
                    },
                  ]
                }
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          canvas: [
            {type: 'line', x1: 0, y1: 7, x2: 495, y2: 7, lineWidth: 15},
            {type: 'line', x1: 0, y1: 10, x2: 495, y2: 10, dash: {length: 3}, lineColor: 'white'},
          ]
        },
        {
          margin: [0, 0, 0, 0],
          layout: {
              hLineColor: function(i, node) {
                  return (i === 0 || i === 3)?'black':'white';
              }
          },
          table: {
            widths: ['*'],
            body: [
              [
                {
                  margin: [10, 10, 10, 10],
                  layout: {
                      vLineColor: function(i, node) {
                          return 'grey';
                      },
                      hLineColor: function(i, node) {
                          return (i === 1 )?lightGrayBG:'grey';
                      }
                  },
                  table:{
                    body: [
                      [
                        { width: '*',
                          margin: [0,0,0,0],
                          layout: 'noBorders',
                          alignment: 'left',
                          style: {
                            fontSize: 12,
                            fillColor: lightGrayBG,
                            bold: true,
                            color: '#333333'
                          },
                          text: 'Electricity production generates the largest share of greenhouse gas emissions. Over 70% of our electricity comes from burning fossil fuels, mostly coal and natural gas.'
                        }
                      ],[
                        { width: '*',
                          margin: [0,0,0,0],
                          layout: 'noBorders',
                          alignment: 'right',
                          style: {
                            fontSize: 22,
                            fillColor: lightGrayBG,
                            bold: true,
                            decoration: 'underline'
                          },
                          text: 'Reduce Your ENERGY CONSUMPTION!'
                        }
                      ]
                    ]
                  }
                }
              ],[
                { width: '*',
                  margin: [10,0,10,0],
                  layout: 'noBorders',
                  alignment: 'left',
                  style: {
                    fontSize: 11
                  },
                  text: 'In order to design an effective sustainability strategy a company must collect usage data, develop a streamlined project plan, identify potential costs and analyze the specific regulatory policies, government subsidies, incentives and the capital required to implement the desired program. Synerex Corporation produces a comprehensive carbon credit analysis to meet the unique needs of companies who desire to establish a sustainability program or must comply with greenhouse gas regulations.'
                },
              ],[
                { width: '*',
                  margin: [10, 10, 10, 10],
                  layout: 'noBorders',
                  alignment: 'left',
                  style: {
                    fontSize: 11
                  },
                  columns: [
                    { width:'*',
                      margin: [0, 0, 10, 0],
                      layout: 'noBorders',
                      alignment: 'left',
                      table:{
                        body:[
                          [{text: `Synerex's XPS technology will reduce overall carbon emissions throughout a company’s operations and supply chain by reducing the kilowatt/hour consumption of the facility. Synerex calculates the reduction of GHG emissions using EPA formulated calculations to measure and identify opportunities for carbon offset projects. Our approach combines detailed technical assessments and a full analysis of the overall corporate wide GHG emission reduction strategy.`}],
                          [{ margin: [0, 10, 0, 0], text: `This approach is being applied to companies in the U.S. and other regions of the world.`}],
                          [{ margin: [0, 10, 0, 0], text: `Actual project or baseline emissions may differ from the estimated XPS carbon credit reduction of the facility.`}],
                        ]
                      }
                    },
                    { width: '*',
                      margin: [0, 0, 0, 0],
                      layout: 'noBorders',
                      alignment: 'left',
                      style: {
                        fontSize: 8
                      },
                      table:{
                        body:[
                          [{
                            margin: [0, 0, 0, 10],
                            image: graphPath,
                            width: 230,
                          }],
                          [{text: `Total Emissions in 2011 = 6,702 Million Metric Tons of CO2 equivalent`}],
                          [{text: `* Land Use, Land-Use Change, and Forestry in the United States is a net sink and offsets approximately 14% of these greenhouse gas emissions.`}],
                          [{text: `All emission estimates from the Inventory of U.S. Greenhouse Gas Emissions and Sinks: 1990-2011`}],
                        ]
                      }
                    },
                  ]
                },
              ]
            ]
          }
        },
        {
          width: '*',
          margin: [0, 10, 0, 0],
          layout: 'noBorders',
          columns: [
            { width: 390,
              margin: [0, 0, 0, 0],
              layout: 'noBorders',
              alignment: 'left',
              style: {
                fontSize: 8
              },
              table:{
                body:[
                  [{
                    margin: [0, 0, 0, 0],
                    image: logoPath,
                    width: 120,
                  }],
                  [{ margin: [0, 0, 0, 0], text: `Project Manager: ${co2Data.projectManager}`, style: {bold: true}}],
                ]
              }
            },
            { width: 200,
              margin: [0, 0, 0, 0],
              layout: 'noBorders',
              alignment: 'right',
              style: {
                fontSize: 8
              },
              table:{
                body:[
                  [{
                    margin: [0, 0, 0, 0],
                    image: energyPath,
                    width: 100,
                  }],
                  [{ text: `Report No.: ${co2Data.reportNumber}`, style: { bold: true } }],
                ]
              }
            },
          ]
        },
        {
          margin: [0, 10, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'Carbon Emission(CO2e) Savings Report',
                  style: {
                    fillColor: 'black',
                    alignment: 'center',
                    bold: true,
                    color: 'white',
                    fontSize: 16
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'Test Profile',
                  style: {
                    fillColor: lightGrayBG,
                    alignment: 'left',
                    bold: true,
                    color: 'black',
                    fontSize: 8
                  }
                }
              ]
            ]
          }
        },
        {
          margin: [0, 0, 0, 0],
          table: {
            widths: ['*','*'],
            body: [
              [
                { width: '*',
                  margin: [-5, 0, -5, -2],
                  alignment: 'left',
                  layout: 'noBorders',
                  style: {
                    fontSize: 8,
                    bold: true
                  },
                  table:{
                    widths: ['*'],
                    body:[
                      [
                        {
                          width: '*',
                          columns: [
                            {
                              margin: [10, 0, 0, 0],
                              width: 'auto',
                              layout: 'noBorders',
                              alignment: 'right',
                              table:{
                                body:[
                                  [{ text: `Date:`}],
                                  [{ text: `Company:`}],
                                  [{ text: `Address:`}],
                                  [{ text: `City, State, Zip:`}],
                                ]
                              }
                            },
                            {
                              margin: [5, 0, 0, 0],
                              width: 'auto',
                              layout: 'noBorders',
                              table:{
                                body:[
                                  [{ text: `${co2Data.reportDate}`}],
                                  [{ text: `${co2Data.facilityLine1}`}],
                                  [{ text: `${co2Data.facilityLine2}`}],
                                  [{ text: `${co2Data.facilityLine3}`}],
                                ]
                              }
                            },
                          ]
                        }
                      ],
                      [
                        {
                          width: '*',
                          text: 'Referenced Circuit:',
                          style: {
                            fillColor: 'black',
                            alignment: 'center',
                            bold: true,
                            color: 'white',
                            fontSize: 10
                          }
                        }
                      ],
                      [
                        {
                          width: '*',
                          text: `${co2Data.circuitPortion}`,
                          style: {
                            alignment: 'center',
                            bold: true,
                            fontSize: 12
                          }
                        }
                      ]
                    ]
                  }
                },
                { width: '*',
                  margin: [-5, -2, -5, -2],
                  alignment: 'left',

                  style: {
                    fontSize: 8,
                    bold: true
                  },
                  table:{
                    widths: ['*'],
                    body:[
                      [
                        {
                          width: '*',
                          text: `Carbon Emission Savings: ${co2Data.circuitPortion}`,
                          style: {
                            fillColor: 'black',
                            alignment: 'center',
                            bold: true,
                            color: 'white',
                            fontSize: 10
                          }
                        }
                      ],
                      [
                        {
                          margin: [0, 3, 0, 3],
                          width: '*',
                          style:{
                            fontSize: 10
                          },
                          columns: [
                            {
                              width: 80,
                              alignment: 'center',
                              text: `${co2Data.co2PerMonth}`,
                              style:{
                                fontSize: 12
                              },
                            },
                            {
                              width: '*',
                              alignment: 'left',
                              text: `CO2e Metric Tons per Month`,
                            },
                          ]
                        }
                      ],
                      [
                        {
                          margin: [0, 3, 0, 3],
                          width: '*',
                          style:{
                            fontSize: 10
                          },
                          columns: [
                            {
                              width: 80,
                              alignment: 'center',
                              text: `${co2Data.co2PerYear}`,
                               style:{
                                fontSize: 12
                              },
                            },
                            {
                              width: '*',
                              alignment: 'left',
                              text: `CO2e Metric Tons per Year`
                            },
                          ]
                        }
                      ],
                      [
                        {
                          width: '*',
                          text: `NOTE: Tax incentives vary from state to state. Before taking any tax credits, please check with local state and federal laws.`,
                          style: {
                            fillColor: 'black',
                            alignment: 'left',
                            bold: true,
                            color: 'white',
                            fontSize: 8
                          }
                        }
                      ],
                    ]
                  }
                },
              ]
            ]
          }
        },
        {
          margin: [0, 2, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}]
        },
        {
          margin: [0, 2, 0, 0],
          width: '100%',
          columns: [
            {
                text: 'Choosing to permanently install the SYNEREX POWER SYSTEMS technology onto the identified electrical equipment will result in the Carbon Emission Savings as calculated above.',
                style: {
                    fontSize: 8,
                    bold: true
                }
            }
           ]
        },
        {
          margin: [0, 2, 0, 0],
          canvas: [{type: 'line', x1: 0, y1: 5, x2: 495, y2: 5, lineWidth: 1}]
        },
        {
          margin: [0, 10, 0, 0],
          layout: {
            hLineColor: function(i, node) {
                return (i === 0)?'black':lightGrayBG;
            }
          },
          table: {
            widths: ['*'],
            body: [
              [
                {
                  text: 'The Carbon Emissions (CO2e) Savings above is equivalent to the following:',
                  style: {
                    fontSize: 10,
                    bold: true,
                    fillColor: lightGrayBG,
                    alignment: 'center',
                    color: 'black',
                  },
                }
              ],
              [
                {
                  text: '(Calculations used for this report are derived from the Green Energy division of the U.S. Environmental Protection Agency.)',
                  style: {
                    fontSize: 8,
                    bold: true,
                    fillColor: lightGrayBG,
                    alignment: 'center',
                    color: 'black',
                  },
                }
              ],
              [
                {
                  style: {
                    fillColor: lightGrayBG,
                    color: 'black',
                    fontSize: 8
                  },
                  columns:[
                    { width: '*', text: '' },
                    {
                      width: 'auto',
                      margin: [ -10, 0, 0 ,0],
                      columns:[
                        {
                          layout: 'noBorders',
                          table:{
                            body:[
                              [{
                                  width: 200,
                                  margin: [0, -3, 5, 0],
                                  alignment: 'right',
                                  text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' Annual Green House Gas Emissions from'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' CO2 Emissions from'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' CO2 Emissions from'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' CO2 Emissions from'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' CO2 Emissions from the electricity use of'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:'  CO2 Emissions from the energy use of'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:'  Carbon sequestered by'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:'  Carbon sequestered annually by'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:'  Carbon sequestered annually by'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' CO2 Emissions from'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' Emissions from burning'} ]
                              }],
                              [{
                                width: 200,
                                margin: [0, -3, 5, 0],
                                alignment: 'right',
                                text:[ {text: 'Save', style:{bold:true, underline: true}}, {text:' Greenhouse Gas Emissions avoided by recycling'} ]
                              }]
                            ]
                          }
                        },
                        {
                          width: 'auto',
                          table:{
                            body: [
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingVehicle}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingGasoline}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingBarrels}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingTankerTruck}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsHomeElectricity}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsHomeEnergy}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsTreeSeedlings}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsPineFirForest}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsAcresDeforested}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsPropaneCylinders}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsRailcarsOfCoal}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ],
                              [
                                {
                                  margin: [20, -2, 20, -2],
                                  text: `${co2Data.savingsFromRecycling}`,
                                  style: {
                                    fillColor: 'white',
                                    color: 'black',
                                  },
                                }
                              ]
                            ]
                          }
                        },
                        {
                          width: 'auto',
                          layout: 'noBorders',
                          table:{
                            body:[
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'passenger vehicles.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'gallons of gasoline consumed.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'barrels of oil consumed.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: `tanker truck's worth of gasoline.`
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'homes for one year.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'homes for one year.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'tree seedlings grown for 10 years.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'acres of pine or fir forests.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'acres of forest preserved from deforestation.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'propane cylinders used for home barbeques.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'railcars worth of coal.'
                             }],
                             [{
                                margin: [5, -3, 0, 0],
                                text: 'ton of waste instead of sending it to landfill'
                             }],
                            ]
                          }
                        }
                      ]
                    },
                    { width: '*', text: '' }
                  ]
                }
              ],
              [
                {
                  text: 'NOTE: This calculation does not include any greenhouse gases other than CO2. This calculation does not include line losses.',
                  style: {
                    fontSize: 7,
                    bold: true,
                    fillColor: 'black',
                    alignment: 'left',
                    color: 'white',
                  },
                }
              ]
            ]
          }
        },
        {
          margin: [0, 2, 0, 0],
          text: 'This report may be useful in communicating your greenhouse gas reduction strategy, reduction targets or other initiatives aimed at reducing greenhouse gas emissions.',
          style: {
            fontSize: 8,
            bold: true,
            alignment: 'left',
          },
        },
        {
          margin: [0, 5, 0, 0],
          text: 'Carbon Emission(CO2e) Reduction Chart',
          style: {
            fontSize: 12,
            bold: true,
            alignment: 'center',
          },
        },
        {
          margin: [0, 2, 0, 0],
          width: '*',
          layout: {
            hLineColor: function(i, node) {
                return (i === 0 || i ===3 )?'black':lightGrayBG;
            }
          },
          table:{
            widths: ['*'],
            body:[
              [{
                text: '(Metric Tons Per Month)',
                style: {
                  bold:true,
                  fillColor: lightGrayBG,
                  alignment: 'center',
                  color: 'black',
                  fontSize: 8
                }
              }],
              [{
                 style: {
                  fillColor: lightGrayBG,
                  alignment: 'center',
                  color: 'black',
                },
                columns:[
                  {
                    table:{
                      body:[
                        [{
                          margin: [0, 0, 0, 0],
                          width: 380,
                          image: graphicPath,
                          style: {
                            fillColor: 'white',
                          }
                        }],
                      ]
                    }
                  },
                  {
                    width: 100,
                    margin: [5,0,5,5],
                    layout: 'noBorders',
                    alignment: 'left',
                    style:{
                      fontSize: 8,
                    },
                    table:{
                      body:[
                        [{ text: 'Carbon Emission Reduction Chart represents the estimated monthly amount of CO2 Emissions being reduced in the facility as a result of a complete XPS installation.', style:{ fontSize: 7 }}],
                        [{ margin:[0, 2, 0, 0], text: 'CO2e Savings (Metric Tons/Month', style: { bold:true, underline: true } }],
                        [{ margin:[0, 2, 0, 0], text: `${co2Data.emissionsBeforeXeco}`, style: { bold:true, fontSize:16 }, alignment:'center' }]
                      ]
                    }
                  }
                ]
              }],
              [{
                style: {
                  fillColor: lightGrayBG,
                  color: 'black',
                  fontSize: 8, italics: true
                },
                text: '©Copyright 2016 to Present by Synerex Labs Corpration. All rights reserved. Federal copyright law prohibits unauthorized reproduction by any means and imposes fines up to $25,000 for violation. This material may not be duplicated for any profit-driven enterprise.' }]
            ]
          }
        }
      ]
    };

    return printer.createPdfKitDocument(docDefinition);

  }
};
