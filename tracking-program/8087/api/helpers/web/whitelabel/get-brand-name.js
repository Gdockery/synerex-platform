/**
 * get-brand-name.js
 *
 * @description :: Helper to get the brand name based on the request hostname.
 * Reads from whitelabel/{branding}/brandname.txt if exists, otherwise defaults to "Xeco".
 */

module.exports = {

  friendlyName: 'Get brand name',

  description: 'Get the brand name for the current request based on hostname.',

  inputs: {
    req: {
      type: 'ref',
      description: 'The request object (required to get hostname)',
      required: true
    }
  },

  exits: {
    success: {
      outputFriendlyName: 'Brand name',
      outputDescription: 'The brand name string (e.g., "Xeco" or "Synerex")'
    }
  },

  fn: function(inputs, exits) {
    var whitelabelConfig = sails.config.whitelabel;
    var hostname = inputs.req.hostname || inputs.req.get('host') || '';
    
    var brandName = whitelabelConfig.getBrandName(hostname);

    return exits.success(brandName);
  }

};
