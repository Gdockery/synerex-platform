/**
 * Project.js
 *
 * @description :: A single project (aka "facility") containing meters, switches and repeaters.
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    // The name of the project.
    name: {
      type: 'string',
      columnType: 'VARCHAR(255) CHARACTER SET utf8mb4',// (example of supporting emojis)
      required: true
    },

    // Slug used for MQTT message segregation.
    slug: {
      type: 'string',
      required: true,
      unique: true
    },

    // Location of the electric meter for the project (factory).
    // This is sometimes listed on the client's electricity bill.
    // Otherwise, use the city/town of the meter, or "Original Service".
    location: {
      type: 'string', // free-form text?
    },

    // SEMANTIC BUSINESS PROCESS IDENTIFIERS
    // ================================================================

    // Proposal number for the project?
    proposalNumber: {
      type: 'string',
    },

    // Invoice number for the project?
    invoiceNumber: {
      type: 'json',
      defaultsTo: null
    },

    // The work order identifier for this project.
    workOrder: {
      type: 'string'
    },

    // The purchase order identifier for this project
    purchaseOrder: {
      type: 'string'
    },

    // FINANCIAL INFO
    // ================================================================

    // The amount given as a deposit to start this project.
    depositAmount: {
      type: 'number'
    },

    // The percentage discount applied to this project.
    discount: {
      type: 'number'
    },

    // Total cost for this project.
    totalCost: {
      type: 'number'
    },

    // The carbon credit rate for this project.
    carbonCreditRate: {
      type: 'number'
    },

    // The currency type for this project
    // > https://en.wikipedia.org/wiki/ISO_4217#Active_codes
    currencyCode: {
      type: 'string',
      defaultsTo: 'USD',
      isIn: [
        // • Americas • • • • • • • • • • • •
        'USD',
        'CAD',
        'MXN',
        'BRL',//(Brazilian Real)
        'PEN',//(Peruvian Sol)
        'ZAR',
        'MUR',

        // • • Europe and Central Asia • • • • • • • • • • • •
        'GBP',
        'EUR',
        'RUB',
        'INR',
        'THB', //(Thai baht)

        // • • East Asia and Australia • • • • • • • • • • • •
        'CNY',
        'JPY',
        'AUD',
        'NZD',

        // • • Africa • • • • • • • • • • • •
        'NGN',//(Nigerian naira)

        // • • Cryptocurrencies • • • • • • • • • • • •
        'XBT',//(bitcoin)
        'ETH'//(ether)
      ]
    },

    // The currency exchange rate to USD for this project.
    currencyExchangeRate: {
      type: 'number'
    },

    // Sales tax in the project's region (state/etc)
    // (usually the same as parent Client's `salesTax`)
    salesTax: {
      type: 'number',
    },

    // TIMELINE
    // ================================================================

    // The start date for this project, as a string (YYYY-MM-DD)
    startDate: {
      type: 'string'
    },

    // Whether or not this project has been sub.
    subNeeded: {
      type: 'boolean',
      defaultsTo: false
    },

    // The start date for the sub for project, as a string (YYYY-MM-DD)
    subStartDate: {
      type: 'string'
    },

    // The project's timezone ID, e.g. "America/Chicago", "America/Mexico_City" or "Asia/Dubai"
    timeZoneId: {
      type: 'string',
      required: true
    },

    selectedTest: {
      type: 'number',
      allowNull: true
    },

    // Slack channel ID for routing notifications (1-indexed, maps to slackHooks.urls array)
    slackChannel: {
      type: 'number',
      allowNull: true
    },

    // MISC
    // ================================================================

    // The time when meter data for this project was last "rolled up" to an aggregate.
    lastRollupAt: {
      type: 'number',
      defaultsTo: 0
    },

    // The JS timestamp indicating when this electric bill analysis was last updated
    electricBillAnalysisUpdatedAt: {
      type: 'number',
      defaultsTo: 0
    },

    // Whether or not this project has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    // A unique token that identifies this project for use in magic links to proposals and invoices.
    documentShareToken: {
      type: 'string',
      required: true
    },

    // URLs for this project's proposal and each of three kinds of invoices.
    // (If the relevant file has not been generated yet, these will be empty string.)
    proposalSrc: { type: 'string' },
    depositInvoiceSrc: { type: 'string' },
    finalInvoiceSrc: { type: 'string' },
    installationInvoiceSrc: { type: 'string' },

    //  ╔═╗╔═╗╔═╗╦ ╦╔═╗╔╦╗  ╔═╗╔═╗╦  ╦╦╔╗╔╔═╗╔═╗  O┬
    //  ║  ╠═╣║  ╠═╣║╣  ║║  ╚═╗╠═╣╚╗╔╝║║║║║ ╦╚═╗  ┌┘
    //  ╚═╝╩ ╩╚═╝╩ ╩╚═╝═╩╝  ╚═╝╩ ╩ ╚╝ ╩╝╚╝╚═╝╚═╝  ┴O

    kwPeakSavings: { type: 'number' , defaultsTo: 0},
    pfSavings: { type: 'number' , defaultsTo: 0},
    kvarSavings: { type: 'number' , defaultsTo: 0},
    kvaSavings: { type: 'number' , defaultsTo: 0},
    kwhSavings: { type: 'number' , defaultsTo: 0},

    //  ╦═╗╔═╗╔═╗╔═╗╔╗╔╔╦╗  ╔═╗╔═╗╦ ╦╔═╗╦═╗  ╦═╗╔═╗╔═╗╔╦╗╦╔╗╔╔═╗╔═╗
    //  ╠╦╝║╣ ║  ║╣ ║║║ ║   ╠═╝║ ║║║║║╣ ╠╦╝  ╠╦╝║╣ ╠═╣ ║║║║║║║ ╦╚═╗
    //  ╩╚═╚═╝╚═╝╚═╝╝╚╝ ╩   ╩  ╚═╝╚╩╝╚═╝╩╚═  ╩╚═╚═╝╩ ╩═╩╝╩╝╚╝╚═╝╚═╝

    lastKwh: {type: 'number', defaultsTo: 0},
    avg15MinuteKva: { type: 'number' , defaultsTo: 0},

    totalAmpLoad: { type: 'number' , defaultsTo: 0},
    lastTotalPf: { type: 'number' , defaultsTo: 100},
    initialPf: { type: 'number' , defaultsTo: 100},
    ILRatio: { type: 'number' , defaultsTo: 100},
    gwControl: { type: 'boolean' , defaultsTo: false},
    kwRate: {type: 'number', defaultsTo: 0},
    kwhRate: {type: 'number', defaultsTo: 0},
    taxRate: {type: 'number', defaultsTo: 0},
    
    // Thresholds for automatic switch control based on main meter amps
    // If amps < lowAmpsThreshold, switches turn OFF
    // If amps > highAmpsThreshold, switches turn ON
    // Hysteresis prevents rapid toggling
    lowAmpsThreshold: {type: 'number', allowNull: true},
    highAmpsThreshold: {type: 'number', allowNull: true},
    
    // Track the last switch state sent due to threshold control ('on', 'off', or null)
    // Used to avoid sending duplicate commands when amps haven't crossed a threshold
    lastThresholdSwitchState: {type: 'string', allowNull: true},


    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝

    // A dictionary of data representing the project's electric bill analysis.
    electricBillAnalysis: {
      type: 'json',
      defaultsTo: null
    },

    // A dictionary of data representing info about the equipment that will be used in this project,
    // including the estimated cost, tax, discount, and list of each type of equipment and its quantity.
    equipmentInfo: {
      type: 'json',
      defaultsTo: {}
    },

    // A dictionary of data representing the project's electric bill analysis.
    reportFields: {
      type: 'json',
      defaultsTo: {}
    },

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝

    // The project client.
    client: {
      model: 'client',
      required: true
    },

    multiplier: {type: 'number', defaultsTo: 1},
    peakMultiplier: {type: 'number', defaultsTo: 1},

    // The XECO manager who is the primary point of contact for this project.
    xecoManager: {
      model: 'User'
    },

    // The users with access to this project.
    users: {
      collection: 'user',
      via: 'projects'
    },

    // The set of power meters attached to this project.
    meters: {
      collection: 'meter',
      via: 'project'
    },

    // The set of repeaters attached to this project.
    repeaters: {
      collection: 'repeater',
      via: 'project'
    },

    // The set of switches attached to this project.
    switches: {
      collection: 'switch',
      via: 'project'
    },

    servicePlan: {
      model: 'ServicePlan'
    },

    lastBudgetInvoice: {
      type: 'json',
      defaultsTo: {}
    },

    lastBudget: {
      type: 'json',
      defaultsTo: {}
    },

  },

  populateServicePlansIn(projects, callback) {
    ServicePlan.find({
      id: {
        in:
          projects.map(project => project.servicePlan)
            .filter(el => el)
      }
    })
      .then(plans => {
        for (let plan of plans) {
          projects.find(project => project.servicePlan == plan.id)
            .servicePlan = plan
        }

        callback()
      })
      .catch(err => {
        callback(err)
      })
  }

};

