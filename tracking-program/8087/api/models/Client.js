/**
 * Client.js
 *
 * @description :: A client of Xeco.
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    // The name of the client.
    name: {
      type: 'string',
      required: true
    },

    // The full legal name of the client, if different than `name`.
    legalName: {
      type: 'string',
    },

    // The client's street address (multiline if desired)
    address: {
      type: 'string',
    },

    // The client's city.
    city: {
      type: 'string',
    },

    // The client's state (or province, etc.)
    state: {
      type: 'string',
    },

    // The client's postal code.
    zip: {
      type: 'string',
    },

    // The client's country.
    country: {
      type: 'string',
      defaultsTo: 'United States'
    },


    // PRIMARY CONTACT
    // ================================================

    // Full name of the primary contact for the client.
    contactName: {
      type: 'string',
    },

    // Job title for the primary contact for the client.
    contactTitle: {
      type: 'string',
    },

    // Phone number of the primary contact for the client.
    contactPhone: {
      type: 'string',
    },

    // MISC SETTINGS
    // ================================================

    // The client's market segment.  Can be overridden on the project.
    marketSegment: {
      type: 'string',
    },

    // Payment terms for the client.
    taxId: {
      type: 'string',
    },

    // Shipment terms for the client.
    shippingTerms: {
      type: 'string',
    },

    // Sales tax in the client's region (state/etc)
    // (Note that project sales tax is based on this unless overridden)
    salesTax: {
      type: 'number',
    },

    createdBy: {
      model: 'User' 
    },

    // FINANCIAL CONTACT
    // ================================================

    financeEmail: {
      type: 'string',
    },

    financePhone: {
      type: 'string',
    },



    // MANAGER
    // ================================================
    // > (Note that this is different than the "XECO manager" concept.
    // > We're not sure what it means exactly, to tell you the truth.
    // > But we know it's different, and we've got it in here.)

    managerName: {
      type: 'string', // full name (e,g. "Margaret Thatcher")
    },
    managerCertificate: {
      type: 'string' // (an id)
    },
    managerPhone: {
      type: 'string'
    },
    managerEmail: {
      type: 'string'
    },
    managerLocation: {
      type: 'string' // free-form text?
    },


    // MISC
    // ================================================

    // URL of the client's logo.
    logoImgSrc: {
      type: 'string',
    },

    // Whether or not this client has been deleted from the system.
    isDeleted: {
      type: 'boolean'
    },


    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝



    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // User accounts who represent this client.
    users: {
      collection: 'user',
      via: 'client'
    },

  },

};

