// Attempt to import `sails` dependency, as well as `rc` (for loading `.sailsrc` files).
var sails;
var rc;
try {
  sails = require('sails');
  rc = require('sails/accessible/rc');
} catch (e) {
  console.error('Encountered an error when attempting to require(\'sails\'):');
  console.error(e.stack);
  return;
}//-•

// Get the config from the environment.
var conf = rc('sails');

// Turn off most hooks.
conf.hooks = {
  request: false,
  views: false,
  blueprints: false,
  pubsub: false,
  policies: false,
  security: false,
  i18n: false,
  session: false,
  sockets: false,
  auth: false,
  user: false,
  webpack: false,

  // Create the "devices" hook that will run this service.
  devices: function(sails) { // eslint-disable-line
                             // ^^^ hooks should always accept the "sails" arg
    return {
      routes: {
        before: {

          // When a message is received in the SQS queue, it will be posted to /.
          // This route will differentiate the different messages and use the appropriate
          // helper to process them.
          'POST /': 'devices/process-queue-message',

          // Don't allow any other requests through.
          '/*': function (req, res) { return res.serverError(new Error('Devices service received request to ' + req.url + ' (should only get POST / requests).')); }
        }
      }
    };
  }
};

conf.bootstrap = function(cb) { return cb(); };

// Start server.
sails.lift(conf);
