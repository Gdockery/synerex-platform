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
    Project.findOne({id: inputs.project}).populate('client').populate('xecoManager').exec(function (err, project) {
      if (err) { return exits.error(err); }
      console.log("here in shipping documents generator");

      var Moment = require('moment-timezone');

      if (inputs.metersToReport) {
        let equipmentCalculator = require('../../services/utilities/equipment-calculations.js');
        project.equipmentInfo = equipmentCalculator.calculate(project, inputs.metersToReport);
      }
      var now = Moment.tz(new Moment(), project.timeZoneId);
      let year = Moment(now).format('YYYY').toString();
      let month = Moment(now).format('MMMM').toString();
      let day = Moment(now).format('D').toString();
      var currencyFormatter = new Intl.NumberFormat('en-US', {
      	style: 'currency',
      	currency: project.currencyCode,
      	minimumFractionDigits: 2,
      });

      console.log("*******")

      let equipment = project.equipmentInfo;
    
       //get model and count
      let pallet1 = [];
      var xecoModel;
   
      equipment.items.forEach(function(item) {
        if (item.count > 0) {
          xecoModel = item.name;
          pallet1.push({'name': '3 PHASE POWER STABILIZER', 'productNumber': item.name, 'description': '(2 pcs. Ea. Per Carton 13.5 kgs(N.W.) and 17.0 kgs (G.W.)', 'qty': item.count, 'netWeight': 6.75, 'grossWeight': 8.5, 'perCarton': 2, 'cubicFt': 1.125 , 'value': item.price, 'tariffNumber': '8532.30.00.90', 'producer': 'YES', 'origin': 'TW'});
        }
      });

      console.log("hhhheee");


     
      let meterCount = 0;
      equipment.parts.forEach(function(part) {
        if (part.name == "REVENUE GRADE METER") {
          meterCount = part.count;
          pallet1.push({'name': part.name, 'productNumber': 'XM3HD-1', 'description': '(1 pcs. Ea. Per Carton 2.676 kgs(N.W.) and 2.78 kgs (G.W.)', 'qty': part.count, 'netWeight': 2.676, 'grossWeight': 2.78, 'perCarton': 1, 'cubicFt': .3594 , 'value': part.price, 'tariffNumber': '9031.80.80.60', 'producer': 'NO-1', 'origin': 'US'});
        } else if (part.name.includes('24" ROCOIL')) {
          pallet1.push({'name': part.name, 'productNumber': 'XCT-24', 'description': '(3 pcs. Ea. Per Carton 0.774 kgs (N.W.) and 0.942 kgs (G.W.)', 'qty': part.count, 'netWeight': 0.774, 'grossWeight': 0.942, 'perCarton': 3,'cubicFt': .0599 , 'value': part.price, 'tariffNumber': '8504.31.20.00', 'producer': 'NO-1', 'origin': 'US'});
        } else if (part.name == 'XECO GATEWAYS') {
          pallet1.push({'name': part.name, 'productNumber': 'XGW-24', 'description': '(' + part.count + ' pcs. Ea. Per Carton 0.15 kgs (N.W.) and ' + _.round(part.count * 0.236, 2) + ' kgs (G.W.)', 'qty': part.count, 'netWeight': 0.15,'grossWeight': 0.236, 'perCarton': part.count,'cubicFt': .0055 , 'value': part.price, 'tariffNumber': '8473.30.91', 'producer': 'NO-1', 'origin': 'US'});
        } else if (part.name == 'COMPUTER SERVER') {
          pallet1.push({'name': part.name, 'productNumber': 'XSVR500GB', 'description': '(1 pcs. Ea. Per Carton 4.872 kgs(N.W.) and 5.172 kgs (G.W.)', 'qty': part.count, 'netWeight': 4.872,'grossWeight': 5.172, 'perCarton': 1, 'cubicFt': .833 , 'value': part.price, 'tariffNumber': '8471.41.90.00', 'producer': 'NO-1', 'origin': 'CN'});
        } else if (part.name == 'LOAD CONTROLLER/SAFETY SWITCH') {
          pallet1.push({'name': part.name, 'productNumber': xecoModel + 'LC', 'description': '(1 pcs. Ea. Per Carton 3.364 kgs(N.W.) and 3.474 kgs (G.W.)', 'qty': part.count, 'netWeight': 3.364, 'grossWeight': 3.474, 'perCarton': 1,'cubicFt': .3594 , 'value': part.price, 'tariffNumber': '8536.10.00.40', 'producer': 'YES', 'origin': 'US'});
        } else if (part.name == '90 Amp Load Controller') {
          pallet1.push({'name': part.name, 'productNumber': xecoModel + '90LC', 'description': '(1 pcs. Ea. Per Carton 6.7 kgs(N.W.) and 6.92 kgs (G.W.)', 'qty': part.count, 'netWeight': 3.364, 'grossWeight': 3.474, 'perCarton': 1,'cubicFt': .3594 , 'value': part.price, 'tariffNumber': '8536.10.00.40', 'producer': 'YES', 'origin': 'US'});
        } else if (part.name.includes('MISC PARTS')) {
          pallet1.push({'name': 'MISC PARTS (screws, washers, nuts, couplers, clamps, electric tape, screws, washers)', 'productNumber': 'XCFLXSBX1', 'description': '(555 pcs. Ea. Per Carton 3.21 kgs(N.W.) and 3.6 kgs (G.W.)', 'qty': part.count, 'netWeight': 3.21, 'grossWeight': 3.6, 'perCarton': 100, 'cubicFt': 0 , 'value': part.price, 'tariffNumber': '7318.14.50.20', 'producer': 'NO-1', 'origin': 'US'});
        } else if (part.name == 'METAL STRUT BASE') {
          pallet1.push({'name': part.name, 'productNumber': 'ZA12HS10EG', 'description': '(12 guage metal strut, 0.786 N.W. & G.W.)', 'qty': part.count, 'netWeight': 0.786, 'grossWeight': 0.786, 'perCarton': 12,'cubicFt': 0 , 'value': part.price, 'tariffNumber': '7216.99.00.10', 'producer': 'YES', 'origin': 'US'});
        } else if (part.name == 'METAL STRUT RACKS') {
          pallet1.push({'name': part.name, 'productNumber': 'ZA12HS10EG', 'description': '(12 guage metal strut, 1.31 N.W. & G.W.)', 'qty': part.count, 'netWeight': 1.31, 'grossWeight': 1.31, 'perCarton': 12,'cubicFt': 0 , 'value': part.price, 'tariffNumber': '7216.99.00.10', 'producer': 'YES', 'origin': 'US'});
        }  else if (part.name == '6 GUAGE THHN STRANDED WIRE') {
          pallet1.push({'name': part.name, 'productNumber': '20493301', 'description': '(1 pcs. Ea. Per Carton 0.044 kgs(N.W.) and 0.044 kgs (G.W.)', 'qty': _.round(part.count), 'netWeight': 0.044, 'grossWeight': 0.044, 'perCarton': 1, 'cubicFt': 0 , 'value': part.price, 'tariffNumber': '8544.11.00.20', 'producer': 'NO-1', 'origin': 'US'});
        } 
      });

      console.log("here");


      let palletsTotalQty = 0;
      let palletsTotalWeight = 0;
      let palletsTotalNetWeight = 0;
      let palletsSubtotal = 0;
      let palletsTotalCubitFt = 0;
      pallet1.forEach(function (item) {
        palletsTotalWeight += parseFloat(item.qty) * parseFloat(item.grossWeight);
        palletsTotalNetWeight += parseFloat(item.qty) * parseFloat(item.netWeight);
        palletsTotalCubitFt += parseFloat(item.qty) * parseFloat(item.cubicFt);
        item.totalCubitFt = _.round(parseFloat(item.qty) * parseFloat(item.cubicFt), 3);
        item.totalGrossWeight = _.round(parseFloat(item.qty) * parseFloat(item.grossWeight), 2);
        item.totalNetWeight = _.round(parseFloat(item.qty) * parseFloat(item.netWeight), 2);
        item.numberOfPackages = Math.ceil(parseFloat(item.qty) / parseFloat(item.perCarton));
        item.totalValue = currencyFormatter.format(parseFloat(item.qty) * parseFloat(item.value));
        palletsSubtotal += parseFloat(item.qty) * parseFloat(item.value);
        palletsTotalQty += parseFloat(item.numberOfPackages);
      });

      console.log('here2');

      let requirements = [
        {'name': 'Gateway', 'model': 'Xeco GTWY', 'qty': meterCount, 'kgs': 0.1},
      ];

      let tools = [
        {'name': 'Hammer Drill', 'qty': 2, 'kgs': 5.09837 * 2},
        {'name': 'Band Saw', 'qty': 1, 'kgs': 5.8967 },
        {'name': 'Masonry bits', 'qty': 10, 'kgs': 0.0068038 * 10},
        {'name': 'Full Electrician Tools', 'qty': 1, 'kgs': 0},
      ];

      var totalWeight = 0;

      totalWeight += palletsTotalWeight;

      let payment = '30% Down, 30 % Install, 40% Net';

      if (project.reportFields.paymentPlan == 2) {
        payment = '' + project.reportFields.downPaymentPercent + '% Down, ' + project.reportFields.interestRate + '% Interest';
      }

      console.log("here3");

      let numberOfPallets = 0;
      if (_.round(palletsTotalCubitFt / 54) < 1) {
        numberOfPallets = 1;
      } else {
        numberOfPallets = _.round(palletsTotalCubitFt / 54);
      }
      console.log("numberOfPallets: " , numberOfPallets);

      let data = {
        projectName: project.name,
        PONumber: project.purchaseOrder,
        projectManager: project.xecoManager.firstName + ' ' + project.xecoManager.lastName,
        client: project.client, 
        clientAddress: project.client.address + ', ' + project.client.city + ' ' + project.client.zip + ', ' + project.client.state + ' ' + project.client.country,
        facilityLocation: project.location,
        facilityContact: project.client.contactName,
        contactPhone: project.client.contactPhone,
        billToInfo: project.reportFields,
        currency: project.currencyCode,
        requirements: requirements,
        fromDate: Moment(now).format('MM/DD/YYYY').toString(),
        toDate: Moment(now).add(1, 'month').format('MM/DD/YYYY').toString(),
        tools: tools,
        pallet1: pallet1,
        palletsTotalQty: palletsTotalQty,
        palletsTotalWeight: _.round(palletsTotalWeight),
	      totalWeight: _.round(totalWeight,2),
        palletsSubtotal: currencyFormatter.format(palletsSubtotal),
        totalNetWeight: _.round(palletsTotalNetWeight, 2),
        palletsTotalWeightLb:  _.round(palletsTotalWeight * 2.20462, 2),
        totalNetWeightLb: _.round(palletsTotalNetWeight * 2, 2),
        palletsTotalCubitFt: _.round(palletsTotalCubitFt),
        numberOfPallets: numberOfPallets,
        year: year,
        month: month,
        day: day, 
        payment: payment,
      };
      console.log("data: ",data);

      //let stream = sails.services.pdfservice.generateShippingDocuments(data);
      //stream.end();
      console.log("exited shipping documents generator");
      return exits.success(data);
    });
  }
};
