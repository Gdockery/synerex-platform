
module.exports = {


  friendlyName: 'Get current savings',


  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',


  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    meters: {
      description: 'string  of meterIds to calculate savings',
      example: "1,2,3", //using strings since http.get does not allow arrays
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
        response: {
        	  p1Kvar: 200,
            p2Kvar: 200,
            p3Kvar: 200,
            p1Volt: 200,
            p2Volt: 200,
            p3Volt: 200,
            amp: 200,
            beforeAmp: 400,
            ampPercent: 68,
            pf: 90,
            beforePf: 85,

        },
        
      }
    },

    notFound: { statusCode: 404 }

  },


  fn: function (inputs, exits) {

    var Moment = require('moment-timezone');

    var req = this.req;
    var sails = req._sails;
    
    var current = (new Date()).getTime();

    var meterIds = inputs.meters.split(",");  
    
    // Make sure that the logged-in user has access to this project.
    if ( !_.find(req.user.projects, {id: inputs.project} )) {
      return exits.unauthorized();
    }

    Project.findOne({ id: inputs.project }).exec(function(err, project) {
      if (err) { return exits.error(err); }

      sails.helpers.web.test.calculateTestResults({
          testId: project.selectedTest,
          meters: inputs.meters,
        }).exec(function(err, testResults) {
        if (err) { return exits.error(err);}
        var avgl1Kvar = 0;
        var avgl2Kvar = 0;
        var avgl3Kvar = 0;
        var avgl1Volt = 0;
        var avgl2Volt = 0;
        var avgl3Volt = 0;
        var totalAmp = 0;
        var beforeAmp = 0;
        var pf = 0;
        var beforePf = 0;
        var p1KvarReduction = 0;
        var p2KvarReduction = 0;
        var p3KvarReduction = 0;

  	   Meter.find({id: meterIds, isDeleted: false, lastL1Kw: {'>': 0}}).exec(function(err, meterData) {
        if (err) { return exits.error(err); }
        if (meterData.length !== 0) {
          //calculate average and sums if there are multiple meters
        var l1Volts = _.pluck(meterData, 'lastL1Volt');
        var l2Volts = _.pluck(meterData, 'lastL2Volt');
        var l3Volts = _.pluck(meterData, 'lastL3Volt');
        var l1Kvars = _.pluck(meterData, 'lastL1Kvar');
        var l2Kvars = _.pluck(meterData, 'lastL2Kvar');
        var l3Kvars = _.pluck(meterData, 'lastL3Kvar');
        var totalAmps = _.pluck(meterData, 'lastTotalAmp');
        var totalKw = _.pluck(meterData, 'lastTotalKw');
        var totalKva = _.pluck(meterData, 'lastTotalKva');
        var totalPf = _.pluck(meterData, 'lastTotalPf');

        //adjustments for powerfactor lead
        totalPf.forEach(function(pf){
          if (pf <= 70) {
            pf = 100;
          }
        });
        
        const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const sum = arr => arr.reduce((a, b) => a + b, 0);

        avgl1Volt = average(l1Volts);
        avgl2Volt = average(l2Volts);
        avgl3Volt = average(l3Volts);

        avgl1Kvar = average(l1Kvars);
        avgl2Kvar = average(l2Kvars);
        avgl3Kvar = average(l3Kvars);
        totalAmp = sum(totalAmps);
        pf = average(totalPf);
  
        // Calculate before values using project-level savings
        beforePf = pf / (1 - project.pfSavings);
        beforeAmp = totalAmp / (1 - project.kwhSavings);
        
        // Calculate before KVAR values and then the reduction
        // Handle negative KVAR (leading power factor) by using absolute values for calculation
        // If current is negative, before was positive (lagging), so we use absolute value
        // to calculate the before magnitude, then compute reduction
        var beforeP1KvarMagnitude = Math.abs(avgl1Kvar) / (1 - project.kvarSavings);
        var beforeP2KvarMagnitude = Math.abs(avgl2Kvar) / (1 - project.kvarSavings);
        var beforeP3KvarMagnitude = Math.abs(avgl3Kvar) / (1 - project.kvarSavings);
        
        // If current is negative, before was positive, so before = positive magnitude
        // If current is positive, before was also positive, so before = positive magnitude
        var beforeP1Kvar = beforeP1KvarMagnitude;
        var beforeP2Kvar = beforeP2KvarMagnitude;
        var beforeP3Kvar = beforeP3KvarMagnitude;
        
        // Reduction = before - current
        // This correctly handles negative current: e.g., if before=10 and current=-1, reduction=10-(-1)=11
        var p1KvarReduction = beforeP1Kvar - avgl1Kvar;
        var p2KvarReduction = beforeP2Kvar - avgl2Kvar;
        var p3KvarReduction = beforeP3Kvar - avgl3Kvar;
     
        } 
    	  

        let data = { 
            p1Kvar: _.round(p1KvarReduction, 1),
            p2Kvar: _.round(p2KvarReduction, 1),
            p3Kvar: _.round(p3KvarReduction, 1),
            p1Volt: _.round(avgl1Volt, 1),
            p2Volt: _.round(avgl2Volt, 1),
            p3Volt: _.round(avgl3Volt, 1),
            amp: _.round(totalAmp, 2),
            beforeAmp: _.round(beforeAmp, 2),
            ampPercent: _.round((totalAmp/600) * 100),
            pf: pf,
            beforePf: _.round(beforePf, 2),
 
      	};

      	return exits.success({
        	response: data,
      	});                    
      });
     }); 
  });
	  
  }
};
