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
  alerts: function(sails) { // eslint-disable-line
                            // ^^^ hooks should always accept the "sails" arg
    return {
      routes: {
        before: {
          // A cron job will post to this endpoint once per minute.
          'POST /schedule': 'rollup/schedule-tasks',

          // This endpoint will be POSTed to by the scheduler above.
          'POST /cache-instantaneous-readings': 'rollup/cache-instantaneous-readings',

          // This endpoint will be POSTed to cron job directly at 00:15 every day
          //'POST /generate-automatic-monthly-reports': 'rollup/generate-automatic-monthly-reports',

          // This endpoint will be POSTed to by the cron job directly.
          'POST /perform-rollup': 'rollup/perform-rollup',

          // This endpoint will be POSTed to by the cron job directly.
          'POST /calculate-tests': 'rollup/calculate-tests',

          'POST /accumulate-savings': 'rollup/accumulate-savings',


          

          // Don't allow any other requests through.
          '/*': function (req, res) { return res.serverError(new Error('Rollup service received request to ' + req.url + ' (should only get POST / requests).')); }

        }
      }
    };
  }
};

conf.bootstrap = function(cb) { return cb(); };

// Start server.
sails.lift(conf);
