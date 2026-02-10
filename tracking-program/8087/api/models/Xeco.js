/**
 * Xeco.js
 *
 * @description :: A model definition.  Represents a database table/collection/etc.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    // XECO Energy's billing email address.
    billingEmail: {
      type: 'string',
      isEmail: true,
      required: true,
      unique: true
    },

    // XECO Energy's billing phone number.
    billingPhone: {
      type: 'string',
    },

    // XECO Energy's corporate street address.
    // (Using newlines to separate lines)
    address: {
      type: 'string',
      required: true
    },

    // XECO Energy's city.
    city: {
      type: 'string',
      required: true
    },

    // XECO Energy's state (or province, etc.)
    state: {
      type: 'string',
      required: true
    },

    // XECO Energy's postal code.
    zip: {
      type: 'string',
      required: true
    },

    // Carbon credit rate (USD/Kwh), for use in calculations.
    // (e.g. `11.0`)
    carbonCreditRate: {
      type: 'number',
      required: true
    },

    // % of subtotal to bill for the "XECO project manager"
    // (e.g. `5.0`)
    xecoManagerCostPercent: {
      type: 'number',
      required: true
    }

  },

};

