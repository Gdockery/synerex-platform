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
  policies: false,
  security: false,
  i18n: false,
  session: false,
  auth: false,
  user: false,
  webpack: false,

  // Create the "alerts" hook that will run this service.
  alerts: function (sails) { // eslint-disable-line
    // ^^^ hooks should always accept the "sails" arg
    return {
      routes: {
        before: {
          // A cron job will post to this endpoint once a day
          'POST /schedule-switch': 'schedule/schedule-switches',

          // Don't allow any other requests through.
          '/*': function (req, res) {
            return res.serverError(new Error(
              'Schedule service received request to ' + req.url + ' (should only get POST / requests).'
            ))
          }

        }
      }
    };
  }
};

conf.bootstrap = function (cb) { return cb(); };

// Start server.
sails.lift(conf);
