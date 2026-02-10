module.exports = {


  friendlyName: 'Upload logo for user',


  description: 'Upload a logo for user.',


  files: ['logo'],


  inputs: {

    user: {
      description: 'The month (YYYY-MM) that this report represents.',
      example: '2017-05',
      required: true
    },

    logo: {
      example: '===',
      required: true
    }

  },


  exits: {
    serverError: { statusCode: 500 }
  },


  fn: function (inputs, exits) {

    // TODO: check project ownership
    inputs.logo.upload({
      dirname: require('path').resolve(sails.config.appPath, 'assets/images/user_company_logo'),
      saveAs: [inputs.user, 'user-logo'].join('-') + ''
    },function (err, uploadedFiles) {
      if (err) return exits.serverError(err);
      User.update({id: inputs.user}).set({userLogo: true}).exec(function(err) {});
    
      return exits.success({
        message: uploadedFiles.length + ' file(s) uploaded successfully!'
      });
    });

  }


};
