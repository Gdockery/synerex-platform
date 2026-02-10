/**
 * getAssetPath helper
 *
 * @description :: Resolves asset paths based on URL-based whitelabel branding
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */

var path = require('path');
var fs = require('fs');

module.exports = {

  friendlyName: 'Get asset path',

  description: 'Resolves asset file paths and URL paths based on hostname-based branding. Checks whitelabel directory first, then falls back to default assets.',

  inputs: {
    req: {
      type: 'ref',
      description: 'Sails request object (to access req.hostname)',
      required: true
    },
    assetName: {
      type: 'string',
      description: 'Name of the asset file (e.g., "logo-small.png")',
      required: true
    },
    type: {
      type: 'string',
      description: 'Type of asset: "image" or "pdf-resource"',
      required: true,
      isIn: ['image', 'pdf-resource']
    }
  },

  exits: {
    success: {
      outputFriendlyName: 'Asset path info',
      outputDescription: 'Object containing filePath, urlPath, and branding identifier',
      outputType: {
        filePath: 'string',
        urlPath: 'string',
        branding: 'string'
      }
    }
  },

  fn: function(inputs, exits) {
    var whitelabelConfig = sails.config.whitelabel;
    var hostname = inputs.req.hostname || inputs.req.get('host') || '';
    
    // Get branding identifier from hostname
    var branding = whitelabelConfig.getBrandingFromHostname(hostname);
    
    // Check custom domain mappings
    if (whitelabelConfig.domainMappings[hostname]) {
      branding = whitelabelConfig.domainMappings[hostname];
    }

    var filePath;
    var urlPath;
    var defaultPath;
    var whitelabelPath;

    if (inputs.type === 'image') {
      defaultPath = path.join(whitelabelConfig.defaultPaths.images, inputs.assetName);
      urlPath = '/images/' + inputs.assetName;
      
      // If branding is null (portal), always use defaults
      if (branding === null) {
        filePath = defaultPath;
      } else {
        // Check whitelabel directory first
        whitelabelPath = path.join(whitelabelConfig.basePath, branding, 'images', inputs.assetName);
        if (fs.existsSync(whitelabelPath)) {
          filePath = whitelabelPath;
        } else {
          filePath = defaultPath;
        }
      }
    } else if (inputs.type === 'pdf-resource') {
      defaultPath = path.join(whitelabelConfig.defaultPaths.pdfResources, inputs.assetName);
      urlPath = '/api/services/pdf/resources/' + inputs.assetName; // Not typically used as URL, but included for consistency
      
      // If branding is null (portal), always use defaults
      if (branding === null) {
        filePath = defaultPath;
      } else {
        // Check whitelabel directory first
        whitelabelPath = path.join(whitelabelConfig.basePath, branding, 'pdf-resources', inputs.assetName);
        if (fs.existsSync(whitelabelPath)) {
          filePath = whitelabelPath;
        } else {
          filePath = defaultPath;
        }
      }
    }

    return exits.success({
      filePath: filePath,
      urlPath: urlPath,
      branding: branding
    });
  }

};
