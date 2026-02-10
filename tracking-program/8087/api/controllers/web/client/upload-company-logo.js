module.exports = {


  friendlyName: 'Upload logo for client',


  description: 'Upload a logo for client',


  files: ['logo'],


  inputs: {

    client: {
      description: 'clientId',
      example: '2',
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
    Client.findOne({ id: inputs.client }).exec(function(err, client) {
      if (err) { return exits.error(err); }
      inputs.logo.upload({
        dirname: require('path').resolve(sails.config.appPath, 'assets/images/client_company_logo'),
        saveAs: [client.id, 'client', 'logo'].join('-') + ''
      },function (err, uploadedFiles) {
        if (err) return exits.serverError(err);
        //Client.update({id: inputs.user}).set({clientLogo: true}).exec(function(err) {});

        Client.update({id: client.id }).set({logoImgSrc: [client.id, 'client', 'logo'].join('-') + ''}).meta({fetch: true}).exec(function(err, updatedProject){
          if (err) {
            console.log('update client logoImgSrc error ' + client.id);
          }
          console.log("update client logoImgSrc");
        
          return exits.success({
            message: uploadedFiles.length + ' file(s) uploaded successfully!'
          });
        });
      });
    });
  }


};
