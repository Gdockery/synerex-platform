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

  function generate (data, pmGraph, brandName) {
    brandName = brandName || 'Synerex'; // Default fallback


    let docDefinition = {
      pageMargins: [20, 20, 20, 20],
      
      content: [
      
        //------------------ Supply-Side Considerations: ------------------
        {
          margin: [0,0,0,20],
          table: {
            widths: [90, 70, 90, 70, 90],
            body: [
              [
                {
                  text: data.facilityLocation,
                  border: [false, false, false, false],
                  style: {
                    alignment: 'right',
                    bold: false,
                    fontSize: 8,
                  }
                },
                {
                  text: brandName + ' Energy Corporation',
                  border: [false, false, false, false],
                  style: {
                    alignment: 'center',
                    bold: true,
                    fontSize: 12,
                  },
                  colSpan: 4,
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
                  text: '',
                  border: [false, false, false, false],
                },
                {
                  text: 'Project: ',
                  border: [false, false, false, false],
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  text: data.projectName,
                  border: [false, false, false, true],
                },
                {
                  text: 'Facility Contact: ',
                  border: [false, false, false, false],
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  text: data.facilityContact,
                  border: [false, false, false, true],
                },
              ],
              [
                {
                  text: '',
                  border: [false, false, false, false],
                },
                {
                  text: 'Project Manager: ',
                  border: [false, false, false, false],
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  text: data.projectManager,
                  border: [false, false, false, true],
                },
                {
                  text: 'Tel: ',
                  border: [false, false, false, false],
                  style: {
                    alignment: 'right',
                  }
                },
                {
                  text: data.contactPhone,
                  border: [false, false, false, true],
                },
              ],
            ],
          },
          border: [false, false, false, false],
          style: {
            bold: false,
            fontSize: 7,
          }
        },
        {
          margin: [0,0,0,0],
          table: {
            widths: [65, 50, 15, 10, 80, 22, 20, 60, 65, 30, 30],
            body: getPartsRows(data.materials, data.requirements, data.tools),
          },
          style: {
            bold: false,
            fontSize: 6,
          }
        },
        {
          margin: [0,80,0,0],
          table: {
            widths: [120,80,160,80],
            body: [
              [
                {
                  border: [false, false, false, false],
                  text: 'Total Cost of Parts:',
                  style: {
                    alignment: 'right',
                    fontSize: 7,
                  }
                },
                {
                  border: [false, false, false, true],
                  text: data.subtotal,
                  style: {
                    alignment: 'right',
                    bold: true,
                  }
                },
                {
                  border: [false, false, false, false],
                  text: 'Total Weight(kgs) of Parts, Tools & Equipment',
                  style: {
                    alignment: 'right',
                    fontSize: 7,
                  }
                },
                {
                  border: [false, false, false, true],
                  text: data.totalWeight,
                  style: {
                    alignment: 'right',
                    bold: true,
                  }
                },

              ],
            ],
          },
          
          style: {
            fontSize: 8,
          }
        },

      ]
    };

    return printer.createPdfKitDocument(docDefinition);
  }

  function getPartsRows(parts, requirements, tools) {
    let partsRows = [];
    parts.forEach(function (part) {
      let row = [
        {
          border: [false, true, false, true],
          text: part.name,
          style: {
            alignment: 'right',
            bold: true,
            fontSize: 7,
          }
        },
        {
          border: [false, true, false, true],
          text: part.qty,
          style: {
            alignment: 'center',
            bold: false,
          }
        },
        {
          border: [false, true, false, true],
          text: part.cost,
        },
        {
          border: [false, true, false, true],
          text: part.supplier,
        },
        {
          border: [false, true, false, true],
          text: part.partNumber,
        },
        {
          border: [false, true, false, true],
          text: part.kgs,
        },
        {
          border: [false, true, false, true],
          text: part.totalCost,
        }
      ];
      partsRows.push(row);
    });

    let requirementsCols = [];
    requirements.forEach(function (requirement) {
      let reqCols = [
        {
          border: [false, true, false, true],
          text: requirement.name,
          style: {
            bold: true,
            alignment: 'right',
          },
        },
        {
          border: [false, true, false, true],
          text: requirement.model,
          style: {
            bold: false,
            alignment: 'center',
          },
        },
        {
          border: [false, true, false, true],
          text: requirement.qty,
        },
        {
          border: [false, false, false, false],
          text: '',
        },
      ];
      requirementsCols.push(reqCols);
    });

    let toolsCols = [];
    tools.forEach(function (tool) {
      let tlCols = [
        {
          border: [false, false, false, false],
          text: '',
        },
        {
          border: [false, true, false, true],
          text: tool.name,
          style: {
            bold: false,
            alignment: 'right',
          }
        },
        {
          border: [false, true, false, true],
          text: tool.qty,
          style: {
            alignment: 'center',
          }
        },
        {
          border: [false, false, false, false],
          text: '',
        },
      ];
      toolsCols.push(tlCols);
    });

    let blankCols = [
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
        border: [false, false, false, false],
        text: '',
      },
    ];


    let toolsTitle = [
      {
        border: [false, false, false, false],
        text: '',
      },
      {
        border: [false, false, false, false],
        text: 'Tool Requirements',
        style: {
          bold: true,
          alignment: 'center',
          fontSize: 8,
        },
        colSpan: 2,
      },
      {
        border: [false, true, false, true],
        text: '',
      },
      {
        border: [false, false, false, false],
        text: '',
      },
    ];


    for (var i = 0; i < requirementsCols.length; i++) {
      partsRows[i] = requirementsCols[i].concat(partsRows[i]);
    }

    for (var i = requirementsCols.length; i < requirementsCols.length + 3; i++) {
      partsRows[i] = blankCols.concat(partsRows[i]);
    }

    partsRows[requirementsCols.length + 3] = toolsTitle.concat(partsRows[requirementsCols.length + 3]);

    for (var h = 0; h < toolsCols.length; h++) {
      partsRows[requirementsCols.length + 4 + h] = toolsCols[h].concat(partsRows[requirementsCols.length + 4 + h]);
    }

    for (var i = requirementsCols.length + 4 + toolsCols.length; i < partsRows.length; i++) {
      partsRows[i] = blankCols.concat(partsRows[i]);
    }

    let labels = 
      [[
        {
          text: 'Project Requirements',
          border: [false, false, false, false],
          style: {
            fontSize: 8,
            bold: true,
          },
          colSpan: 3,
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
          border: [false, false, false, false],
          text: 'Description',
        },
        {
          border: [false, false, false, false],
          text: 'QTY Needed',
        },
        {
          border: [false, false, false, false],
          text: 'Cost Each',
        },
        {
          border: [false, false, false, false],
          text: 'Supplier',
        },
        {
          border: [false, false, false, false],
          text: 'Part Number',
        },
        {
          border: [false, false, false, false],
          text: 'kgs',
        },
        {
          border: [false, false, false, false],
          text: 'Total Cost',
        },
      ]];

      partsRows = labels.concat(partsRows);

  /*

    partsRows.unshift(
      [
        {
          border: [false, false, false, false],
          text: 'Required Materials & Specifications',
          style: {
            fontSize: 10,
            alignment: 'center',
            bold: true,
          },
          colSpan: 10,
          margin: [0,0,0,10],
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
      ]       
    ); */
    return partsRows;
  }


};

