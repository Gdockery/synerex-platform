/**
 * Local environment settings
 *
 * Use this file to configure settings for your local development environment.
 * This file is typically in .gitignore and not committed to version control.
 *
 * For more information, see:
 * https://sailsjs.com/docs/concepts/configuration/the-local-js-file
 */

module.exports = {

  // The port to run on
  port: process.env.PORT,

  // Environment
  environment: process.env.NODE_ENV,

  // Synerex License Service Integration
  // The tracking program validates licenses against this service
  licenseService: {
    url: process.env.LICENSE_SERVICE_URL,
    programId: 'tracking'
  },

  // Synerex Platform URLs
  synerex: {
    // EMV Program (for My Account page link)
    emvUrl: process.env.EMV_URL,
    // License Service
    licenseServiceUrl: process.env.LICENSE_SERVICE_URL,
    // My Account page (shared across programs)
    myAccountUrl: process.env.MY_ACCOUNT_URL
  },

  // Database configuration (if different from default)
  // datastores: {
  //   default: {
  //     adapter: 'sails-mysql',
  //     url: process.env.TRACKING_DB_URL
  //   }
  // },

  // Disable Redis for sockets (use memory adapter for development)
  sockets: {
    adapter: undefined,  // Use memory adapter instead of Redis
    // Allow local dev origins for socket.io
    onlyAllowOrigins: [
      process.env.TRACKING_BASE_URL
    ]
  },

  // Disable hooks that require external services or cause conflicts
  hooks: {
    sockets: true,
    pubsub: false,   // Disable pubsub (also requires Redis)
    grunt: false,    // Disable grunt 
    webpack: false   // Disable webpack/livereload to avoid port conflicts
  },

  // Use file-based sessions instead of Redis
  session: {
    adapter: undefined  // Use default memory/file sessions
  },

  // Model migration strategy - use 'safe' since tables exist
  models: {
    migrate: 'safe'  // Tables created manually, use 'safe' mode
  },

  // Skip production warnings for sails-disk
  orm: {
    skipProductionWarnings: true
  }

};
