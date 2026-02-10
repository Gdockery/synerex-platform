module.exports = {

  friendlyName: 'Get current savings',

  description: 'Get a breakdown of a cost savings for a project for the current day, month, year and all-time.',

  inputs: {

    project: {
      description: 'The ID of this project.',
      example: 123,
      required: true
    },

    clientLogoName: {
      description: 'logo image name',
      example: '71-client-logo',
    },

    type: {
      description: 'invoice or report',
      example: 'invoice',
      required: true
    },

    meters: {
      description: 'string  of meterIds to calculate savings',
      example: "1,2,3", //using strings since http.get does not allow arrays
      required: true
    },

    startDate: {
      description: 'Start of budget',
      example: '2019-01-02',
    },

    endDate: {
      description: 'End of project budget',
      example: '2019-01-02',
    },

    budgetRange: {
      description: 'buget range, number of month',
      example: 3,
    },

    kwPeakRate: {
      description: 'The rate budget.',
      example: 123,
    },

    sharedPercent: {
      description: 'percent of energy usage for project',
      example: 123,
    },

    kwhRate: {
      description: 'The rate budget.',
      example: 123,
    },

    clientName: {
      description: 'Name of client',
      example: 'other',
     
    },
    clientAddress: {
      description: 'address of client',
      example: '3211 Pal Lane, Detoit MI 78759',
    
    },
    clientCity: {
      description: 'city',
      example: 'Austin',
      
    },
    clientState: {
      description: 'state',
      example: 'TX',
     
    },
    clientPhone: {
      description: 'phone',
      example: '123-456-6666',
    },
    clientZip: {
      description: 'zipcode',
      example: '78799',
    },
    invoiceNumber: {
      description: 'XYZ123',
      example: 'iXYZ123',
    },
    contactName: {
      description: 'Contact Name',
      example: 'Adam James',
    },
    contactPhone: {
      description: 'Contact Phone Number',
      example: '12345678',
    },

  },


  exits: {
    success: {
      outputExample: {
        response: {
          clientLogoName: '71-user-logo',
          company: {},
          client: {},
          startDate: '2019-01-02',
          toDate: '2019-02-02',
          endDate: '2019-02-02',
          invoiceStartDate: '2019-01-02',
          invoiceEndDate: '2019-01-02',
          kwPeakRate: '$0.10',
          kwhRate: '$.07',
          sharedPercent: 56,
          kwhUsage: 123,
          avgKwh: 123,
          hoursInProject: 200,
          kwhCost: '$2000',
          tax: '$20',
          kwPeak: 200,
          kwPeakCost: '$300',
          subtotal: '$200', 
          totalCost: '$1200',
          invoiceNumber: 'XECO20190718',
          invoiceDate: '2019-01-02',
          contactName: 'Adam James',
          contactPhone: '1234567890',
        },
      }
    },

    unauthorized: {
      statusCode: 404
    },

    invalidRowIds: {
      statusCode: 400,
      description: 'One or more of the provided row IDs are not valid for the given test.'
    }

  },


  fn: function (inputs, exits) {

    var Moment = require('moment-timezone');
    var req = this.req;
    var sails = req._sails;
    var current = (new Date()).getTime();
    
    // Make sure that the logged-in user has access to this project.
    if ( !_.find(req.user.projects, {id: inputs.project} )) {return exits.unauthorized();}
    Xeco.find().exec(function(err, xecos) {
      let xeco = xecos[0];
    // Get the project record.
    Project.findOne({ id: inputs.project }).populate('client').exec(function(err, project) {
      if (err) { return exits.error(err); }
      //use most recent test that is not currentl running results if no test is manuall selected
      var testFind;
      if (project.selectedTest == null)  {
        testFind = Test.find({project: project.id, isDeleted: 0, endAt: {'<': current}});
      } else{
        testFind = Test.find({project: project.id, isDeleted: 0, id: project.selectedTest});
      }

     
      
      testFind.sort('createdAt DESC').limit(1).exec(function(err, test) {
        if (err) { return exits.error("Something went wrong when querying for tests in get-current-savings.js"); }
        if (test.length == 0){return exits.error("A test must be entered to run get-current-savings.js");}
        //get test results from selected meters
        var now = Moment.tz(new Moment(), project.timeZoneId);
        var today = Moment(now).format('YYYY-MM-DD');
        var estimatedStartDate = Moment(inputs.startDate).subtract(inputs.budgetRange, 'month').format('YYYY-MM-DD');
        var daysInProject = inputs.startDate == inputs.endDate ? 1 : Moment.duration(Moment(inputs.endDate).diff(Moment(inputs.startDate))).asDays();
        var hoursInProject = daysInProject * 24;

        var toDate =  Moment(inputs.startDate).add(inputs.budgetRange, 'month').format('YYYY-MM-DD');

        sails.helpers.web.test.calculateTestResults({testId: test[0].id, meters: inputs.meters}).exec(function(err, testResults) {
          if (err) { return exits.error(err); }
       
          var kwhPercentSaved = parseFloat(testResults.percentSaved.kwh);
          var kwpPercentSaved = parseFloat(testResults.percentSaved.kwPeak);
            
          var billingRate = (inputs.kwPeakRate && inputs.kwPeakRate > 0) ? inputs.kwPeakRate : parseFloat(project.kwRate);
          var avgRate = (inputs.kwhRate && inputs.kwhRate > 0) ? inputs.kwhRate : parseFloat(project.kwhRate);
          

          var taxPercent = parseFloat(project.salesTax) / 100;

          var currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: project.currencyCode,
            minimumFractionDigits: 2,
          });

          var kwhRateFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: project.currencyCode,
            minimumFractionDigits: 5,
          });

          var meterIdsIn = '(' + inputs.meters.split(",").join() + ')';
          var sharedPercent = inputs.sharedPercent ? parseFloat(inputs.sharedPercent) : 100;

         var SQL = 'SELECT AVG(metersum.sumKw) as avgKw, ' 
                    + 'MAX(metersum.sumKw) as peak FROM ' 
                    + '(SELECT SUM(avgKw) as sumKw, '  
                    + 'intervalId, day FROM permeterdataaggregate '  
                    + 'WHERE meter IN ' + meterIdsIn 
                    + ' GROUP BY intervalId, day) as metersum '
                    + ' WHERE day >= \'' + estimatedStartDate + '\' AND day < \'' + inputs.startDate + '\'' ;


        
          sails.getDatastore().sendNativeQuery(SQL).exec(function(err, result) {
            if (err) { return exits.error(err); }
            if (result.rows.length == 0) {return exits.error("No meteraggregate data found 30 days prior to startDate.");}
          
            var tax = (parseFloat(project.salesTax)/ 100) * result.rows[0].avgKw * hoursInProject * avgRate * (sharedPercent / 100);

            let data = {
              clientLogoName: inputs.clientLogoName,
              company: {
                address: project.client.address + "\n" + project.client.city + ', ' + project.client.state + ' ' + project.client.zip,
                contact: project.reportFields.invoiceContactName,
                phone: inputs.contactPhone ? inputs.contactPhone : "",
                contactName: inputs.contactName ? inputs.contactName : "",
                legalName: project.client.legalName,
                logoImg: project.client.logoImgSrc,
                location: project.location,
                electricCompany: project.electricBillAnalysis.electricCompanyName,
              },
              client: {
                name: inputs.clientName ? inputs.clientName : "",
                address: inputs.clientAddress ? inputs.clientAddress + "\n" + inputs.clientCity + ', ' + inputs.clientState + ' ' + inputs.clientZip : "",
                phone: inputs.clientPhone ? inputs.clientPhone : "",
              },
              startDate: inputs.startDate,
              toDate: toDate,
              endDate: inputs.endDate,
              invoiceStartDate: inputs.startDate,
              invoiceEndDate: inputs.endDate,
              kwPeakRate: currencyFormatter.format(billingRate),
              kwhRate: kwhRateFormatter.format(avgRate),
              sharedPercent: sharedPercent,
              kwhUsage: _.round(result.rows[0].avgKw * hoursInProject * (sharedPercent / 100), 2),
              avgKwh: _.round(result.rows[0].avgKw, 2),
              hoursInProject: hoursInProject,
              kwhCost: currencyFormatter.format(result.rows[0].avgKw * hoursInProject * avgRate * (sharedPercent / 100)  * (1 + taxPercent)),
              tax:  currencyFormatter.format(tax),
              kwPeak: _.round(result.rows[0].peak,2),
              kwPeakCost: currencyFormatter.format(result.rows[0].peak * billingRate * (sharedPercent / 100)), 
              subtotal: currencyFormatter.format(result.rows[0].peak * billingRate * (sharedPercent / 100) + result.rows[0].avgKw * hoursInProject * avgRate * (sharedPercent / 100)* (1 + taxPercent)),
              totalCost: currencyFormatter.format(result.rows[0].peak * billingRate * (sharedPercent / 100) + result.rows[0].avgKw * hoursInProject * avgRate * (sharedPercent / 100) * (1 + taxPercent)),
              invoiceNumber: inputs.invoiceNumber,
              invoiceDate: today,

            };

            var projectSet;

            if (inputs.type == 'invoice'){
              projectSet = Project.update({id: project.id}).set({lastBudgetInvoice: data}).meta({fetch: true});
            } else {
              projectSet = Project.update({id: project.id}).set({lastBudget: data}).meta({fetch: true});
            }

            projectSet.exec(function (err, updatedRecords) {
              
              if (err) {
                return exits.error(err);
              }

              if (updatedRecords.length === 0) {
                return exits.notFound();
              }
         
              return exits.success({
                meta: {},
                response: data,
              });
            });
           });
          });                   
        });
      });
    });
  }
};
