/**
 * getImageUrl helper
 *
 * @description :: Returns image URL path for use in EJS templates
 * @help        :: See http://sailsjs.com/docs/concepts/helpers
 */

module.exports = {

  friendlyName: 'Get image URL',

  description: 'Returns the URL path for an image asset, which will be resolved by the route handler to whitelabel or default.',

  inputs: {
    req: {
      type: 'ref',
      description: 'Sails request object (to access req.hostname)',
      required: true
    },
    filename: {
      type: 'string',
      description: 'Name of the image file (e.g., "logo-small.png")',
      required: true
    }
  },

  exits: {
    success: {
      outputFriendlyName: 'Image URL',
      outputDescription: 'URL path to the image',
      outputType: 'string'
    }
  },

  fn: function(inputs, exits) {
    // Always return the standard path - backend route handler will resolve to whitelabel or default
    return exits.success('/images/' + inputs.filename);
  }

};
