/**
 * SavingsReport.js
 *
 * @description :: A cost savings report for a single project and month.
 */

module.exports = {

  attributes: {

    // The project that this savings report is for.
    name: {
      type: 'string',
      required: true
    },

    // The month (YYYY-MM) that this report represents, e.g. 2017-05.
    // This should correspond to the month on the customer's electric bill.
    description: {
      type: 'string',
      required: true
    },

    // The first day of the billing cycle that this report represents, as a JS timestamp.
    // This may be used to retrieve meter data from Xeco to compare to the data on a customer's bill.
    project: {
      type: 'Number',
      allowNull: true, 
    },

    // The last day of the billing cycle that this report represents, as a JS timestamp.
    // This may be used to retrieve meter data from Xeco to compare to the data on a customer's bill.
    url: {
      type: 'string',
      required: true
    },


  },

};

