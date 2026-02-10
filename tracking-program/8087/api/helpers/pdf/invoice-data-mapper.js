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

    type: {
      description: 'Type of invoice.',
      example: 'proposalInvoice',
      required: true
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
        .exec(function (err, project) {
          if (err) { return exits.error(err); }

          let calculator = require('../../services/utilities/bill-analytic-calculations.js');
          let calculatedData = calculator.calculate(project);
          let moment = require('moment-timezone');
          console.log ('calculatedData: ' + calculatedData)

          let type = '';
          let invoiceDate = '';
          let costMultiplier = 0;
          let invoiceNumber = '';

          switch (inputs.type) {
            case 'depositInvoice':
              type = 'Deposit';
              costMultiplier = project.reportFields.depositInvoicePercent / 100;
              invoiceDate = moment(project.reportFields.depositInvoiceDate).format('MMMM DD, YYYY');
              invoiceNumber = project.invoiceNumber.deposit;
              break;
            case 'installationInvoice':
              type = 'Installation';
              costMultiplier = project.reportFields.installationInvoicePercent / 100;
              invoiceDate = moment(project.reportFields.installationInvoiceDate).format('MMMM DD, YYYY');
              invoiceNumber = project.invoiceNumber.installation;
              break;
            case 'finalInvoice':
              type = 'Final';
              costMultiplier = project.reportFields.finalInvoicePercent / 100;
              invoiceDate = moment(project.reportFields.finalInvoiceDate).format('MMMM DD, YYYY');
              invoiceNumber = project.invoiceNumber.final;
              break;
            case 'totalInvoice':
              type = 'Total';
              costMultiplier = 1;
              invoiceDate = moment(project.reportFields.depositInvoiceDate).format('MMMM DD, YYYY');
              invoiceNumber = project.invoiceNumber.total;
              break;
          }

          var currencyFormatter = new Intl.NumberFormat('en-US', {
            //style: 'currency',
            currency: project.currencyCode,
            style: 'currency',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

          var numberFormatter = new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

          var items = project.equipmentInfo.items.map(item => {
            return {
              type: 'XECO Model',
              name: item.name,
              quantity: item.count,
              price: currencyFormatter.format(item.price),
              status: 'ok',
              cost: currencyFormatter.format(item.price * item.count * (1 - project.discount / 100)),
	            tax: currencyFormatter.format(item.price * item.count * (1 - project.discount / 100) * (parseFloat(project.salesTax) / 100)),
            }
          });

          items = items.filter(item => item.quantity > 0);

          var parts = project.equipmentInfo.parts.map(part => {
            return {
              type: 'test',
              name: part.name,
              quantity: part.count,
              price: currencyFormatter.format(part.price),
              status: '',
	            tax: currencyFormatter.format(part.price * part.count * (parseFloat(project.salesTax) / 100)),
	            cost: currencyFormatter.format(part.price * part.count),
	  
            }
          });

          var services = project.equipmentInfo.services.map(service => {
            return {
              type: 'test',
              name: service.name,
              quantity: '',
              status: '',
              price: currencyFormatter.format(service.price),
              tax: currencyFormatter.format(service.price * (parseFloat(project.salesTax) / 100)),
              cost: currencyFormatter.format(service.price),
    
            }
          });


          let nameToShow = project.client.name;;
 
    
          let data = {
            invoiceType: type,
            invoiceNumber: invoiceNumber,
            invoiceDate: invoiceDate,
            xecoAddress: xeco.address,
            xecoCity: '' + xeco.city + ', ' + xeco.state + ' ' + xeco.zip,
            contact: project.reportFields.invoiceContactName,
            phone: project.reportFields.invoiceContactPhone,
            clientName: project.client.legalName,
            currencyCode: project.currencyCode,
            shipToAddress: project.reportFields.shipToAddress + ',\n' + project.reportFields.shipToZip + ' ' + project.reportFields.shipToCity + ', ' + project.reportFields.shipToState + ', ' + project.reportFields.shipToCountry,
            billToAddress: project.reportFields.billToAddress + ',\n' + project.reportFields.billToZip + ' ' + project.reportFields.billToCity + ', ' + project.reportFields.billToState + ', ' + project.reportFields.billToCountry,
            clientAttn: nameToShow, 
            clientPhone: project.client.contactPhone,
            clientRfcCode: project.reportFields.rfcCode,
            clientCompanyPo: project.purchaseOrder,
            estimatedCo2SavingsPerMonth: numberFormatter.format(calculatedData.co2Reduction / 12),
            estimatedCo2SavingsPerYear: numberFormatter.format(calculatedData.co2Reduction),
            estimatedCarbonCreditValue: currencyFormatter.format(calculatedData.co2Reduction * project.carbonCreditRate),
            items: items,
            parts: parts,
            services: services,
            totalAmount: currencyFormatter.format(project.equipmentInfo.total.subtotal), //total before tax/discount
            discount: currencyFormatter.format(project.equipmentInfo.total.discount),
            salesTax: currencyFormatter.format(project.equipmentInfo.total.tax),
            totalCost: currencyFormatter.format(project.equipmentInfo.total.total), //total after tax/discount
            subtotalDue: currencyFormatter.format(costMultiplier * project.equipmentInfo.total.subtotal - costMultiplier * project.equipmentInfo.total.discount), //amount due for this type of invoice minus tax
            taxDue: currencyFormatter.format(costMultiplier * project.equipmentInfo.total.tax),//amount of tax due for this type
            amountDue: currencyFormatter.format(costMultiplier * project.equipmentInfo.total.total), //Amount due for this type of invoice
            shippingTerms: project.client.shippingTerms,
            paymentTerms: '' + project.reportFields.downPaymentPercent + '% down',
            costMultiplier: costMultiplier * 100,
            estimatedSavings: {
              totalCharges: currencyFormatter.format(calculatedData.totalCharges),
              monthEndCharge: currencyFormatter.format(project.electricBillAnalysis.billAmount),
              customerCharge: currencyFormatter.format(project.electricBillAnalysis.customerCharge),
              totalSavings: currencyFormatter.format(project.electricBillAnalysis.totalSavings),
              bill: currencyFormatter.format(calculatedData.totalCharges - project.electricBillAnalysis.totalSavings),
              annualSavings: currencyFormatter.format(project.electricBillAnalysis.totalSavings * 12),
              xecoEquipmentCost: currencyFormatter.format(project.equipmentInfo.items.reduce((sum, item) => {
                return sum += parseFloat(item.count) * parseFloat(item.price)
              }, 0)),
              partCost: currencyFormatter.format(project.equipmentInfo.parts.reduce((sum, item) => {
                return sum += parseFloat(item.count) * parseFloat(item.price)
              }, 0)),
              meteringFee: currencyFormatter.format(project.equipmentInfo.services.find(item => item.name == "Annual Metering/Server Fee" || item.name == "ANNUAL METERING/SERVER FEE").price),
              discount: '-' + project.equipmentInfo.total.itemTotal * project.discount / 100,
              subtotal: currencyFormatter.format(project.equipmentInfo.total.subtotal),
              co2Reduction: numberFormatter.format(calculatedData.co2Reduction),
              //charges: charges,
              estimatedRoi: _.round(project.equipmentInfo.total.total / project.electricBillAnalysis.totalSavings),
              baselineSavingsPercent: ((project.electricBillAnalysis.totalSavings / calculatedData.totalCharges) * 100).toFixed(2),
              xecoUnits: project.equipmentInfo.items.reduce((sum, item) => {
                return sum += parseInt(item.count)
              }, 0),
              estimatedCo2Reduction: numberFormatter.format(calculatedData.co2Reduction),
              salesTax: currencyFormatter.format(project.equipmentInfo.total.tax),
              totalCost: currencyFormatter.format(project.equipmentInfo.total.total),
            },
            invoiceSubtotal: currencyFormatter.format(costMultiplier * project.equipmentInfo.total.subtotal),
            invoiceTax: currencyFormatter.format(costMultiplier * project.equipmentInfo.total.tax),
            invoiceTotal: currencyFormatter.format(costMultiplier * project.equipmentInfo.total.total),
          };
          //let stream = sails.services.pdfservice.generateInvoice(data);
          //stream.end();

          return exits.success(data);
        });
    });
  }

};
