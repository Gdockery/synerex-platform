module.exports = {


  friendlyName: 'Map bill analytic data',


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
      outputExample: '===',
    }

  },

  fn: function(inputs, exits) {
    Xeco.find().exec(function(err, xecos) {
      if (err) { return exits.error(err); }
      let xeco = xecos[0];
      Project.findOne({
        id: inputs.project
      }).populate('client')
        .populate('xecoManager')
        .exec(function (err, project) {

        if (err) { return exits.error(err); }
        let _ = require('lodash');
        let moment = require('moment-timezone');
        let allCharges = [];
        let selectedBillCalculator = require('../../services/utilities/selected-bill-analytic-calculations.js');
        let equipmentCalculator = require('../../services/utilities/equipment-calculations.js');
   
        project.electricBillAnalysis = selectedBillCalculator.calculate(project, inputs.metersToReport);
        project.equipmentInfo = equipmentCalculator.calculate(project, inputs.metersToReport);
        project.electricBillAnalysis.meterBills.forEach(function(bill) {
          if (bill && (!(inputs.metersToReport) || inputs.metersToReport.includes(bill.meterNumber))) {
       
            bill.lineItems.forEach(function(lineItem) {
              allCharges.push(lineItem);
            });
          }
        });
	console.log("project.equipmentInfo.items: " , project.equipmentInfo.items);

        let calculator = require('../../services/utilities/bill-analytic-calculations.js');
        let calculatedData = calculator.calculate(project);
 
        var currencyFormatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          //maximumFractionDigits: 0,
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
          	}, 0) / 100;
        let baselineSavingsPercent = (project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) + extraSavingsbyPowerFilter;
        let estimatedSavingsPercent = baselineSavingsPercent * 1.47; 
	let extraSavingsbyPowerFilterOffset = baselineSavingsPercent / (project.electricBillAnalysis.totalSavings / calculatedData.totalCharges);
	console.log("extraSavingsbyPowerFilterOffset",extraSavingsbyPowerFilterOffset);

        let charges = allCharges.map(charge => {
          return {
            description: charge.name,
            amount: currencyFormatter.format(charge.cost),
            savings: currencyFormatter.format(charge.savings * extraSavingsbyPowerFilterOffset),
            reference: 2
          }
        });

        let reference2Section1Charges = _.slice(project.electricBillAnalysis.lineItems, 0,4).map(charge => {
          charge.amount = currencyFormatter.format(charge.cost);
          return charge;
        });
        let totalReference2Section1Charges = _.round(reference2Section1Charges.reduce((sum, charge) => {
          return sum += parseFloat(charge.cost);
        }, 0), 2);



        let reference2Section2Charges = _.slice(project.electricBillAnalysis.lineItems, 3,10).map(charge => {
          charge.amount = currencyFormatter.format(charge.cost);
          return charge;
        });
        let totalReference2Section2Charges = currencyFormatter.format(reference2Section2Charges.reduce((sum, charge) => {
          return sum += parseFloat(charge.cost);
        }, 0));

        for(var i = reference2Section2Charges.length;i < 10; i++) {
          reference2Section2Charges.push({
            name: '',
            amount: ''
          })
        }

        let reference3Charges = _.slice(project.electricBillAnalysis.lineItems.splice(10, project.electricBillAnalysis.lineItems.length + 1)).map(charge => {
          charge.amount = currencyFormatter.format(charge.cost);
          return charge;
        });
        // let reference3Charges = [];
        

        let reference3Total = currencyFormatter.format(reference3Charges.reduce((sum, charge) => {
          return sum += parseFloat(charge.cost);
        }, 0) + parseFloat(project.electricBillAnalysis.customerCharge));

        let data = {
          projectCurrency: project.currencyCode,
          date: moment(project.electricBillAnalysis.date).format('MMMM DD, YYYY'),
          reportNumber: project.proposalNumber,
          clientName: project.client.name,
          clientAddress: project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
          clientAccount: project.electricBillAnalysis.accountNumber, // Electric company account number.
          clientSupplier: project.electricBillAnalysis.electricCompanyName,
          location: project.location,
          preparedFor: project.client.legalName + " \n" + project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
          preparedBy: project.xecoManager.firstName + ' ' + project.xecoManager.lastName || '',
          auditedBy: project.xecoManager.firstName + ' ' + project.xecoManager.lastName  || '',
          attn: project.client.contactName + ', ' + project.client.contactTitle,
          estimatedSavingsPercent: (estimatedSavingsPercent * 100).toFixed(2),
          baselineSavingsPercent: (baselineSavingsPercent * 100).toFixed(2),
          estimatedROI: Math.ceil(project.equipmentInfo.total.total / (calculatedData.totalCharges * estimatedSavingsPercent)),
          baselineROI: Math.ceil(project.equipmentInfo.total.total / (calculatedData.totalCharges * baselineSavingsPercent)),
          recommendedUnits: project.equipmentInfo.items.reduce((sum, item) => { return sum += parseInt(item.count)}, 0),
          reference: project.electricBillAnalysis.billReference,
          reportDate: moment(project.electricBillAnalysis.billDate).format('MMMM DD, YYYY'), 
          version: '1', //@todo: Not sure this is needed
          regulatoryCharges: '$3,272.88',// @todo: this should just be a part of charges
          greenChoicePatron15: '$41,800.00',// @todo: this should just be a part of charges
          powerSupplyAdjustment: '$67,708.67',// @todo: this should just be a part of charges
          loadProfile: '$60,00', // @todo: this should just be a part of charges

        }

        data.estimatedSavings = {
          totalCharges: currencyFormatter.format(calculatedData.totalCharges),
          monthEndCharge: currencyFormatter.format(project.electricBillAnalysis.billAmount),
          customerCharge: currencyFormatter.format(project.electricBillAnalysis.customerCharge),
          totalSavings: currencyFormatter.format(project.electricBillAnalysis.totalSavings*extraSavingsbyPowerFilterOffset),
          bill: currencyFormatter.format(calculatedData.totalCharges - project.electricBillAnalysis.totalSavings*extraSavingsbyPowerFilterOffset),
          annualSavings: currencyFormatter.format(project.electricBillAnalysis.totalSavings * extraSavingsbyPowerFilterOffset * 12),
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
          co2Reduction: _.round(calculatedData.co2Reduction, 2),
          charges: charges, 
          salesTax: currencyFormatter.format(project.equipmentInfo.total.tax)
        };

        data.billAnalysis = {
          bill: currencyFormatter.format(project.electricBillAnalysis.billAmount),
          kwhConsumed: _.round(project.electricBillAnalysis.totalKwh),
          kwhTotalRate: _.round(calculatedData.combinedKwhRate,6),
          demandChargeRate: currencyFormatter.format(project.electricBillAnalysis.kwRatePerTariff), // changed from dollar sign to project currency
          baselineKwh: numberFormatter.format(calculatedData.baselineKwh),
          demand: numberFormatter.format(calculatedData.demandKwh),//I changed this from supply to demand cause previous field seems to be supply
          totalOverageCost: currencyFormatter.format(calculatedData.totalOverageCost, 2),
          totalCharges: currencyFormatter.format(calculatedData.totalCharges),
          totalReference2Section1Charges:  currencyFormatter.format(totalReference2Section1Charges),
          reference2Section1Charges: reference2Section1Charges,
          totalReference2Section2Charges: totalReference2Section2Charges,
          reference2Section2Charges: reference2Section2Charges,
          reference3Charges: reference3Charges, 
        };

        data.calculatedWaste = { 
          kwhConsumed: numberFormatter.format(project.electricBillAnalysis.totalKwh),
          Kw15Min: numberFormatter.format(calculatedData.kw15MinuteInterval),
          avgAmpDraw: numberFormatter.format(calculatedData.ampDraw),
          avgAmpDrawNum: calculatedData.ampDraw,
          powerFactor: _.round(calculatedData.demandSidePowerFactor * 100, 2),
          reactiveKvarWaste: _.round(calculatedData.demandSideReactiveEnergy * 100, 2),
          reactiveKvarSupplyWasteAmps: _.round(calculatedData.ampDraw * calculatedData.demandSideReactiveEnergy),
          ampSavings: numberFormatter.format(calculatedData.ampSavings),
          kwSavings: numberFormatter.format(calculatedData.calculatedKwSavings),
          kwhSavings: numberFormatter.format(calculatedData.calculatedKwhSavings),
        };
    
        data.reference3 = {
          customerCharge: currencyFormatter.format(project.electricBillAnalysis.customerCharge),
          totalAdditional: reference3Total,
          totalCurrent: currencyFormatter.format(calculatedData.totalCharges)
        };
        
        data.supplySide = {
          billedKw: _.round(project.electricBillAnalysis.kwPeak),
          billedKWAsOf: moment(project.electricBillAnalysis.billDate).format('MMMM DD, YYYY'),
          current: {
            kwUsage: numberFormatter.format(calculatedData.kw15MinuteInterval),
            kwSupplyReserve: '----',
            kwSavings: '',
            rateKw: ''
          },
          afterXeco: {
            kwUsage: numberFormatter.format(calculatedData.afterXecoKwUsage),
            kwSupplyReserve: numberFormatter.format(calculatedData.newKwSupplyReserve), //@todo: not sure where 1.3 comes from
            kwSavings: numberFormatter.format(calculatedData.montlyKwSavings),
            //rateKw: currencyFormatter.format(calculatedData.rateKwAfter)
            rateKw: currencyFormatter.format((project.electricBillAnalysis.kwRatePerTariff * _.round(calculatedData.montlyKwSavings , 0)))
          }
        };
        console.log("kwRatePerTariff: " , project.electricBillAnalysis.kwRatePerTariff);
        console.log("montly: " , calculatedData.montlyKwSavings);
        console.log("rateKw: " , data.supplySide.afterXeco.rateKw);
        console.log("calc Data before: " , calculatedData.rateKwAfter);

        data.reserveCalculations = {
          current: {
            reserve: numberFormatter.format(calculatedData.currentCalculatedReservePercent * 100),
            unusedKwOversupply: numberFormatter.format(calculatedData.currentUnusedKwOversupply),
            overbill: currencyFormatter.format(calculatedData.currentOverbill),
          },
          recommended: {
            reserve: numberFormatter.format(calculatedData.recommendedCalculatedReservePercent * 100),
            unusedKwOversupply: numberFormatter.format(calculatedData.recommendedUnusedKwOversupply),
            overbill: currencyFormatter.format(calculatedData.recommendedOverbill),
          },
          savings: {
            reserve: numberFormatter.format(calculatedData.additionalCalculatedReservePercent * 100),
            unusedKwOversupply: numberFormatter.format(calculatedData.additionalUnusedKwOversupply),
            overbill: currencyFormatter.format(calculatedData.additionalOverbill),
          },
        };

        data.totalReserveSavings= currencyFormatter.format(calculatedData.estimatedMonthlySavingsWithReserveAdjustment);
        data.totalReserveSavingsPercent= numberFormatter.format(calculatedData.estimatedMonthlySavingsPercent);
      
        console.log("done with bill analytic data mapper");
        //let stream = sails.services.pdfservice.generateBillAnalytic(data);
        //stream.end();
        return exits.success(data);

        
      });
    });
  }

};
