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
  },

  exits: {

    success: {
      outputExample: '==='
    }

  },

  fn: function(inputs, exits) {
    Project.findOne({id: inputs.project}).populate('client').populate('xecoManager').exec(function (err, project) {
      if (err) { return exits.error(err); }

      var currencyFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: project.currencyCode,
      	minimumFractionDigits: 2,
      });

      //let equipment = project.equipmentInfo;
      let equipmentCalculator = require('../../services/utilities/equipment-calculations.js');
      let equipment = equipmentCalculator.calculate(project);

       //get model and count
      var xecoModel = 0, modelCount = 0 , modelPrice = 0, boosterCount = 0, filterCount = 0;
      equipment.items.forEach(function(item) {
        console.log("item: ", item)
        if (item.count > 0 && (item.name == 'XPS400' || item.name == 'XPS600')) {
          xecoModel = item.name;
          //modelCount += item.count;
          modelPrice = item.price;
        }
       /*if (item.count > 0 && item.name == 'XPF480-100') {
          filterCount += item.count;
        }
        if (item.count > 0 && item.name == 'XECO600B') {
          boosterCount += item.count;
        }*/
      });
      modelCount = equipment.items.reduce((sum, item) => { return (item.name == xecoModel) ? sum += parseInt(item.count) : sum}, 0);
      filterCount = equipment.items.reduce((sum, item) => { return (item.name == "XPF480-100") ? sum += parseInt(item.count) : sum}, 0);
      boosterCount = equipment.items.reduce((sum, item) => { return (item.name == "XECO600B") ? sum += parseInt(item.count) : sum}, 0);
      
      if (xecoModel == null) {
        console.log("no xeco equipment model entered");
      }

      var meterCount;
      equipment.parts.forEach(function(part) {
        if (part.name == "Revenue Grade Meter") {
          meterCount = part.count;
        }
      });

      let materials = [
        {'name': '1/4" Spring Nuts', 'qty': 100, 'unit': 'pcs', 'cost': 0.380, 'supplier': 'Fastenal', 'partNumber': '48601', 'kgs': _.round(3.3, 5)},
        {'name': '1/4" x 1" HEX Screws', 'qty': 100, 'unit': 'pcs','cost': 0.055, 'supplier': 'Fastenal', 'partNumber': '110120304', 'kgs': _.round(0.80, 5)},
        {'name': '3/4" Flex Couplers', 'qty': modelCount,'unit': 'pcs','cost': 3.6, 'supplier': 'Home Depot', 'partNumber': 'NMLT7-1', 'kgs': _.round(0.036 * modelCount, 5)},
        {'name': '3/4" Right Angle Coup', 'qty': modelCount,'unit': 'ft','cost': 3.75, 'supplier': 'Home Depot', 'partNumber': '', 'kgs': _.round(0.06 * modelCount, 5)},
        {'name': 'Flex Conduit', 'qty': modelCount * 5,'unit': 'ft',  'cost': 0.757, 'supplier': 'Home Depot', 'partNumber': '58046301', 'kgs': _.round(0.078 * modelCount * 6, 5)},
        {'name': '1/2" x 3" Hex Screws', 'qty': meterCount * 6,'unit': 'pcs', 'cost': 0.65, 'supplier': 'Fastenal', 'partNumber': '13824', 'kgs': _.round(0.062 * meterCount * 16, 5)},
        {'name': '1/2" x 1.5 Washers', 'qty': meterCount * 12, 'unit': 'pcs', 'cost': 0.08, 'supplier': 'Fastenal', 'partNumber': '1133012', 'kgs': _.round(0.014 * meterCount * 32, 5)},
        {'name': '1/2 Nuts', 'qty': meterCount * 6, 'unit': 'pcs', 'cost': 0.095, 'supplier': 'Fastenal', 'partNumber': '1136310', 'kgs': _.round(0.016 * meterCount * 16, 5)},
        {'name': 'Brown Electrical Tape', 'qty': Math.ceil(modelCount / 20), 'unit': 'rolls','cost': 1.5, 'supplier': 'Cabletiesandmore.com', 'partNumber': 'ETAPE0.75-10-Brown (10-Pack)', 'kgs': _.round(0.102 * Math.ceil(modelCount / 10), 5)},
        {'name': 'Orange Electrical Tape','qty': Math.ceil(modelCount / 20), 'unit': 'rolls', 'cost': 1.5, 'supplier': 'Cabletiesandmore.com', 'partNumber': 'ETAPE0.75-10-Orange (10-Pack)', 'kgs': _.round(0.102 * Math.ceil(modelCount / 10), 5)},
        {'name': 'Yellow Electrical Tape', 'qty': Math.ceil(modelCount / 20),'unit': 'rolls', 'cost': 1.5, 'supplier': 'Cabletiesandmore.com', 'partNumber': 'ETAPE0.75-10-Yellow (10-Pack)', 'kgs': _.round(0.102 * Math.ceil(modelCount / 10), 5)},
        {'name': '1/4 x 1.25" Masonry Screws', 'qty': 100,'unit': 'pcs', 'cost': 0.275, 'supplier': 'Home Depot', 'partNumber': '24315', 'kgs': _.round(0.533, 5)},
        {'name': '1/4" Washers', 'qty': 100,'unit': 'pcs', 'cost': 0.023, 'supplier': 'Fastenal', 'partNumber': '1133004', 'kgs': _.round(0.5, 5)},
        {'name': '6 Guage  THHN Wire', 'qty': 1,'unit': 'ft','cost': 0.526, 'supplier': 'Home Depot', 'partNumber': '2049330', 'kgs': _.round(0.044 * modelCount * 24, 5)},
        {'name': '14G THHN Standed (Brown)', 'qty': meterCount * 6,'unit': 'ft', 'cost': 0.115, 'supplier': 'Home Depot', 'partNumber': '11586558', 'kgs': _.round(0.006 * meterCount * 12, 5)},
        {'name': '14G THHN Standed (Orng)', 'qty': meterCount * 6, 'unit': 'ft','cost': 0.115, 'supplier': 'Home Depot', 'partNumber': '11586558', 'kgs': _.round(0.006 * meterCount * 12, 5)},
        {'name': '14G THHN Standed (YLW)', 'qty': meterCount * 6, 'unit': 'ft', 'cost': 0.115, 'supplier': 'Home Depot', 'partNumber': '11586558', 'kgs': _.round(0.006 * meterCount * 12, 5)},
        {'name': '1" Flex Clamps', 'qty': Math.ceil(modelCount / 8 * 4), 'unit': 'pcs','cost': 0.25, 'supplier': 'Home Depot', 'partNumber': 'RACO 2084', 'kgs': _.round(0.028 * modelCount, 5)},
        {'name': 'Plastic Mollys', 'qty': 100, 'unit': 'pcs','cost': 0.35, 'supplier': 'Home Depot', 'partNumber': '25200', 'kgs': _.round(0.1, 5)},
        {'name': 'Strut (Rack) Base', 'qty': meterCount + modelCount, 'unit': 'pcs','cost': 3.25, 'supplier': 'Xeco', 'partNumber': 'Xeco Strut Rack', 'kgs': _.round(0.786 * meterCount * 10 + (0.786 * modelCount * 3), 5)},
        {'name': 'Switch Gear Rack', 'qty': modelCount, 'unit': 'pcs','cost': 3.25, 'supplier': 'Xeco', 'partNumber': 'Xeco Strut Rack', 'kgs': _.round(1.31 * modelCount, 5)},
        {'name': '90 Degree Strut Bracket', 'qty': meterCount * 4, 'unit': 'pcs','cost': 6, 'supplier': 'Xeco', 'partNumber': '---', 'kgs': _.round(0.318 * meterCount * 4, 5)},
        {'name': 'Metal Flex for Meter', 'qty': meterCount * 8, 'unit': 'ft','cost': 1.25, 'supplier': 'Xeco', 'partNumber': '---', 'kgs': _.round(0.026 * meterCount * 4, 5)},
        {'name': 'Metal Coupler for Meter', 'qty': meterCount * 2, 'unit': 'pcs','cost': 2.50, 'supplier': 'Xeco', 'partNumber': '---', 'kgs': _.round(0.036 * meterCount * 2, 5)},
      ];

      var subtotal = 0;


      materials.forEach(function (material) {
        material.totalCost = currencyFormatter.format(material.qty * material.cost);
	      subtotal += material.qty * material.cost;
      });


      let requirements = [
        {'name': 'Xeco Model', 'model': xecoModel, 'qty': modelCount, 'kgs': 16.8 * modelCount},
        {'name': 'Xeco Power Booster Rack', 'model': 'XECO600B', 'qty': boosterCount, 'kgs': 6.92 * boosterCount},
        {'name': 'Xeco Active Power Filter', 'model': 'XPF480-100', 'qty': filterCount, 'kgs': 35 * filterCount},
        {'name': 'Xeco Active Power Filter Stand', 'model': 'XPF480-S', 'qty': filterCount, 'kgs': 5 * filterCount},
        {'name': 'Xeco 60 Amp Load Controller', 'model': 'XLC60', 'qty': modelCount, 'kgs': 3.474 * modelCount},
        {'name': 'Xeco 90 Amp Load Controller', 'model': 'XLC90', 'qty': boosterCount, 'kgs': 6.92 * boosterCount},
        {'name': 'Xeco Power Filter Load Controller', 'model':  'XPF480-LC5A', 'qty': filterCount, 'kgs': 6.92 * filterCount},
        {'name': 'Xeco Data Server 500', 'model': 'Xeco Server', 'qty': 1, 'kgs': 5.172},
        {'name': 'Xeco Power Quality Meter', 'model': 'Dent 3HD', 'qty': meterCount, 'kgs': 2.78 * meterCount},
        {'name': 'Xeco Meter CT', 'model': '24" RoCoils', 'qty': meterCount * 3, 'kgs': 2 * meterCount},
        {'name': 'Xeco Gateway', 'model': 'Xeco GTWY', 'qty': Math.ceil(modelCount / 8), 'kgs': 0.236 * (modelCount / 8)},
        {'name': 'Xeco Repeater', 'model': 'Xeco RPTR', 'qty': 1, 'kgs': 0.1},
      ];

      let tools = [
        {'name': 'Hammer Drill', 'qty': 2, 'kgs': 5.09837 * 2},
        {'name': 'Band Saw', 'qty': 1, 'kgs': 5.8967 },
        {'name': 'Masonry bits', 'qty': 10, 'kgs': 0.0068038 * 10},
        {'name': 'Full Electrician Tools', 'qty': 1, 'kgs': 0},
      ];

      var totalWeight = 0;

      materials.forEach(function (item) {
	totalWeight += item.kgs;
      });
	
      requirements.forEach(function (item) {
	totalWeight += item.kgs;
      });

      tools.forEach(function (item) {
	totalWeight += item.kgs;
      });

      let data = {
        projectName: project.name,
        projectManager: project.xecoManager.firstName + ' ' + project.xecoManager.lastName,
        facilityLocation: project.location,
        facilityContact: project.client.contactName,
        contactPhone: project.client.contactPhone,
        materials: materials,
        requirements: requirements,
        tools: tools,
	     totalWeight: _.round(totalWeight,2),
	     subtotal: currencyFormatter.format(subtotal),
      };



      return exits.success(data);
    });
  }
};
