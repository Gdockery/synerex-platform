/**
 * get-brand-name.js
 *
 * @description :: API endpoint to get the brand name for the current request.
 */

module.exports = {

  friendlyName: 'Get brand name',

  description: 'Returns the brand name based on the request hostname.',

  exits: {
    success: {
      outputExample: {
        brandName: 'Xeco'
      }
    }
  },

  fn: function(inputs, exits) {
    sails.helpers.web.whitelabel.getBrandName({req: this.req})
      .exec(function(err, brandName) {
        if (err) {
          return exits.error(err);
        }

        return exits.success({
          brandName: brandName
        });
      });
  }

};
