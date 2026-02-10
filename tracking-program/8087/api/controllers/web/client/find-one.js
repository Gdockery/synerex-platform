module.exports = {


  friendlyName: 'Find one (Client)',


  description: 'Get details about the specified record.',


  extendedDescription: 'Note that this action returns even "soft-deleted" records.',


  inputs: {

    id: {
      description: 'The ID of the record to look up.',
      example: 123,
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
        meta: {},
        response: {
          // Basics:
          isDeleted: true,
          name: 'ACME',
          legalName: 'Acme, Inc.',
          logoImgSrc: 'http://sailsjs.com/images/logo.png',

          address: '1234 Tiger Street\nSuite 200',
          city: 'Austin',
          state: 'Texas',
          zip: 78731,
          country: 'United States',
          // Primary contact:
          contactName: 'Jabbo Greenly',
          contactTitle: 'President',
          contactPhone: '231-872-4386',
          // Manager?----(should maybe move to project level?)
          managerName: 'Georgiana Fortescue',
          managerCertificate: 2375691,
          managerPhone: '517-923-8769',
          managerEmail: 'g.fortescue@acmeinc.com',
          managerLocation: 'The Netherlands',
          // ------------------------
          // Install info:
          marketSegment: 'Aerospace',
          shippingTerms: '3 days',
          paymentTerms: '15 days',
          salesTax: 6,//%  (sales tax %)
          // Finance department contact
          financeEmail: 'billing@acmeinc.com',
          financePhone: '314-228-1392',
        }
      }
    },

    notFound: { statusCode: 404 }

  },


  fn: function(inputs, exits) {
    Client.findOne({ id: inputs.id })
    .exec(function(err, record){
      if (err) { return exits.error(err); }
      if (!record) { return exits.notFound(); }

      return exits.success({
        response: record
      });
    });
  }

};
