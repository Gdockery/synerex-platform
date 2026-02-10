module.exports = {


  friendlyName: 'Update reporting meters',


  description: 'Update reporting meters so portal knows which meters to uses for reporting',


  inputs: {

    project: {
      description: 'The ID of the project to pull recent meter data for.',
      example: 123,
      required: true
    },

    meters: {
      description: 'The array of IDs of the meters to use for reporting',
      example: [1, 2, 3],
      required: true
    },


  },


  exits: {

    success: {
      // TODO: change to match the `meta` + `response` conventions throughout the rest of XECO
    },

    unauthorized: {
      statusCode: 404
    }

  },


  fn: function (inputs, exits) {
    Meter.find({project: inputs.project, isDeleted: false}).select(['id']).exec(function(err, meters) {
      if (err) { return exits.error(err); }

      meters = _.pluck(meters, 'id');

      let notReporting = meters.filter(function(x) { 
        return inputs.meters.indexOf(x) < 0;
      });

      for (nmeter of notReporting) {
        Meter.update({id: nmeter}).set({isReporting: false}).meta({fetch: true}).exec(function(err) {
          if (err) {console.log('error update isReporting for meter ')} 

        });
      }

      for (rmeter of inputs.meters) {
        Meter.update({id: rmeter}).set({isReporting: true}).meta({fetch: true}).exec(function(err) {
          if (err) {console.log('error update isReporting for meter ')} 

        });
      }
      
      return exits.success({
      });

    });//</ User.find().exec() >

  }

};
