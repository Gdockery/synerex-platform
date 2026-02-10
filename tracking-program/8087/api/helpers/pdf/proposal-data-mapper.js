module.exports = {


  friendlyName: 'Map invoice data',


  description: 'Maps data into PDF generator structure.',


  extendedDescription: '',


  inputs: {

    project: {
      description: 'Project ID.',
      example: 123,
      required: true
    },

    metersToReport: {
      description: 'Project ID.',
      example: ["meter1", "meter2"],
    },

  },

  exits: {

    success: {
      outputExample: '==='
    }

  },

  fn: function(inputs, exits) {
    Xeco.find().exec(function(err, xecos) {
      let xeco = xecos[0];
      Project.findOne({
        id: inputs.project
      }).populate('client')
        .populate('xecoManager')
        .exec(function (err, project) {
          if (err) { return exits.error(err); }

          let moment = require('moment-timezone');

          let allCharges = [];
          if (inputs.metersToReport) {
            let selectedBillCalculator = require('../../services/utilities/selected-bill-analytic-calculations.js');
            let equipmentCalculator = require('../../services/utilities/equipment-calculations.js');
            project.electricBillAnalysis = selectedBillCalculator.calculate(project, inputs.metersToReport);
            project.equipmentInfo = equipmentCalculator.calculate(project, inputs.metersToReport);
          } else {
            project.electricBillAnalysis.meterBills.forEach(function(bill) {
              bill.lineItems.forEach(function(lineItem) {
                allCharges.push(lineItem);
              });
            });
          }

          let calculator = require('../../services/utilities/bill-analytic-calculations.js');
          let calculatedData = calculator.calculate(project);
   	  console.log("calculated project"); 

          var currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: project.currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

          var numberFormatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

   	  let extraSavingsbyPowerFilter =  
                project.equipmentInfo.items.reduce((sum, item) => {
                  if (item.name == "XPF480-100")
                    if (item.count < 6)
                      return parseFloat(item.count * .25);
                    else
                      return parseFloat(6 * .25);
                  else
                    return sum;
                }, 0) ;
	  let baselineSavingsPercent = (project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) + (extraSavingsbyPowerFilter/100);
	  let estimatedSavingsPercent = baselineSavingsPercent * 1.47;
	  let extraSavingsbyPowerFilterOffset =
		((project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) * 100 + extraSavingsbyPowerFilter) 
		/
		((project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) * 100);
		
		

          let charges = allCharges.map(charge => {
            return {
              chargeName: charge.name,
              amount: currencyFormatter.format(charge.cost),
              savingsAmount: currencyFormatter.format(charge.savings*extraSavingsbyPowerFilterOffset)
            }
          });

          var items = project.equipmentInfo.items.map(item => {
            return {
              name: item.name,
              quantity: item.count,
              price: currencyFormatter.format(item.price),
              cost: currencyFormatter.format(item.price * item.count)
            }
          });

          var parts = project.equipmentInfo.parts.map(part => {
            return {
              name: part.name,
              quantity: part.count,
              price: currencyFormatter.format(part.price),
              cost: currencyFormatter.format(part.price * part.count) // was missing
            }
          });

          let nameToShow = "";

          if (!project.reportFields.invoiceContactName || project.reportFields.invoiceContactName == "") {
            nameToShow = project.client.name;
           
          } else {
            nameToShow = project.reportFields.invoiceContactName;

          }
	    console.log('nameToShow', nameToShow);  

          let data = {
            proposalNumber: project.proposalNumber,
            projectCurrency: project.currencyCode,
            clientName: nameToShow,
            clientAddress: project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
            location: project.location,
            preparedBy: project.xecoManager.firstName + ' ' + project.xecoManager.lastName || '',
            xecoName: "Xeco Energy Corporation",
            xecoAddress: '2006 Windy Terrace, Unit B',
            xecoAddress2: 'Cedar Park, Texas 78613',
            proposalDate: moment(project.proposalDate).format('MMMM DD, YYYY'),
            billDate: moment(project.electricBillAnalysis.billDate).format('MMMM DD, YYYY'),
            analyticsDate: moment(project.electricBillAnalysis.date).format('MMMM DD, YYYY'),
            meterNumber: project.electricBillAnalysis.meterNumber,
            electricCompanyName: project.electricBillAnalysis.electricCompanyName, 
            clientManagerName: project.client.contactName,
            depositAmount: currencyFormatter.format(parseFloat(project.reportFields.depositInvoicePercent) / 100 * project.equipmentInfo.total.total),
            installationAmount: currencyFormatter.format(parseFloat(project.reportFields.installationInvoicePercent) / 100 * project.equipmentInfo.total.total),
            finalAmount: currencyFormatter.format(parseFloat(project.reportFields.finalInvoicePercent) / 100 * project.equipmentInfo.total.total), 
 
            estimatedSavings: {
              totalCharges: currencyFormatter.format(calculatedData.totalCharges),
              monthEndCharge: currencyFormatter.format(project.electricBillAnalysis.billAmount),
              customerCharge: currencyFormatter.format(project.electricBillAnalysis.customerCharge),
              totalSavings: currencyFormatter.format(project.electricBillAnalysis.totalSavings*extraSavingsbyPowerFilterOffset),
              bill: currencyFormatter.format(calculatedData.totalCharges - project.electricBillAnalysis.totalSavings*extraSavingsbyPowerFilterOffset),
              annualSavings: currencyFormatter.format(project.electricBillAnalysis.totalSavings*extraSavingsbyPowerFilterOffset * 12),
              xecoEquipmentCost: currencyFormatter.format(project.equipmentInfo.items.reduce((sum, item) => {
                return sum += parseFloat(item.count) * parseFloat(item.price)
              }, 0) + project.equipmentInfo.parts.reduce((sum, item) => {
                return sum += parseFloat(item.count) * parseFloat(item.price)
              }, 0)),
              partCost: currencyFormatter.format(project.equipmentInfo.parts.reduce((sum, item) => {
                return sum += parseFloat(item.count) * parseFloat(item.price)
              }, 0)),
         
              projectManagementCost: currencyFormatter.format(project.equipmentInfo.services.find(item => item.name == "ENGINEERING/SERVICES/INSTALLATIONS").price),
              meteringFee: currencyFormatter.format(project.equipmentInfo.services.find(item => item.name == "ANNUAL METERING/SERVER FEE").price),
              shippingFee: currencyFormatter.format(project.equipmentInfo.services.find(item => item.name == "SHIPPING COSTS").price),
              discount: '-' + currencyFormatter.format(project.equipmentInfo.items.reduce((sum, item) => {
                return sum += parseFloat(item.count) * parseFloat(item.price) * project.discount / 100;
              }, 0)),
              totalCost: currencyFormatter.format(project.equipmentInfo.total.total),
              co2Reduction: numberFormatter.format(calculatedData.co2Reduction),
              charges: charges,
              estimatedSavingsPercent: (estimatedSavingsPercent * 100).toFixed(2),
              baselineSavingsPercent: (baselineSavingsPercent * 100).toFixed(2),
              estimatedROI: Math.ceil(project.equipmentInfo.total.total / (calculatedData.totalCharges * estimatedSavingsPercent)),
              baselineROI: Math.ceil(project.equipmentInfo.total.total / (calculatedData.totalCharges * baselineSavingsPercent)),
              //baselineROI: Math.ceil(project.equipmentInfo.total.total / project.electricBillAnalysis.totalSavings) + extraSavingsbyPowerFilter,
              //estimatedROI: Math.ceil(project.equipmentInfo.total.total / (project.electricBillAnalysis.totalSavings * 1.47)) + extraSavingsbyPowerFilter,
             // baselineSavingsPercent: ((project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) * 100 + extraSavingsbyPowerFilter),
              //estimatedSavingsPercent: ((project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) * 147 + extraSavingsbyPowerFilter),
              xecoUnits: project.equipmentInfo.items.reduce((sum, item) => {
                return sum += parseInt(item.count)
              }, 0),
              estimatedCo2Reduction: numberFormatter.format(calculatedData.co2Reduction),
              salesTax: currencyFormatter.format(project.equipmentInfo.total.tax),
            },
            identifiedEquipment: {
              items: items,
              parts: parts,
              total: currencyFormatter.format(project.equipmentInfo.total.subtotal),
              tax: currencyFormatter.format(project.equipmentInfo.total.tax),
              discount: currencyFormatter.format(project.equipmentInfo.total.discount),
              totalProjectCost: currencyFormatter.format(project.equipmentInfo.total.total),
              totalMainCircuits: project.electricBillAnalysis.mainCircuitCount,
              totalSgMcc: project.electricBillAnalysis.switchGearCount
            }
          };
        
          return exits.success(data);
        });
    });
  }

};
