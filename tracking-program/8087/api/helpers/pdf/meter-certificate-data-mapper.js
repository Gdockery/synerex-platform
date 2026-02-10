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
    meter: {
      description: 'Meter ID.',
      example: 123,
      required: true
    },

  },

  exits: {

    success: {
      outputExample: '===',
    }

  },

  fn: function(inputs, exits) {
    Meter.findOne({
      id: inputs.meter
    }).exec(function (err, meter) {
        if (err) { return exits.error(err); }
        
        let serialNumber = meter.meterSerialNumber;

        //let stream = sails.services.pdfservice.generateMeterCertificate(serialNumber);
        //stream.end();
        return exits.success(data);
      
    });
  }

};
