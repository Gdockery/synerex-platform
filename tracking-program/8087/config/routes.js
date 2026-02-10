/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.com/anatomy/config/routes-js
 */

var path = require('path');
var fs = require('fs');
var tmpPublicPath = path.resolve(__dirname, '..', '.tmp', 'public');
var assetsPath = path.resolve(__dirname, '..', 'assets');
var staticRoot = fs.existsSync(tmpPublicPath) ? tmpPublicPath : assetsPath;
var serveStatic = require('serve-static')(staticRoot);
var serveFonts = require('serve-static')(path.resolve(__dirname, '..', 'assets'));
var serveStorage, serveStorageInitiated = false;
var appVersion = require('../package.json').version;

module.exports.routes = {

  /* Home route */
  'GET /': 'web/index',

  'POST /assets/images/company_logo': '/assets/images/company_logo/',

  //  ╔╦╗╔═╗╔╦╗╔═╗╦═╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ║║║║╣  ║ ║╣ ╠╦╝  ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╩ ╩╚═╝ ╩ ╚═╝╩╚═  └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* METER API */
  'GET /api/meter': 'web/meter/list-meters',
  'GET /api/meter/:id': 'web/meter/find-one',
  'POST /api/meter': 'web/meter/create',
  'PUT /api/meter/:id': 'web/meter/update',
  'DELETE /api/meter/:id': 'web/meter/destroy',

  'GET /api/meter/data': 'web/meter/get-recent-data',
  'GET /api/project/ticker': 'web/project/ticker',
  'GET /api/project/close-ticker-sockets': 'web/project/close-ticker-sockets',
  'GET /api/meter/period': 'web/meter/get-data-for-period',
  'GET /api/meter/quality': 'web/meter/get-recent-power-quality',
  'GET /api/meter/quality-chart': 'web/project/get-power-quality-chart',
  'GET /api/meter/data/export': 'web/meter/export-recent-data',
  'GET /api/meter/daily': 'web/meter/get-daily-data',
  'GET /api/meter/monthly': 'web/meter/get-monthly-data',

  /* METER ALERT API */
  'GET /api/meter/alert': 'web/meter-alert/list-alerts',
  'GET /api/meter/alert/:id': 'web/meter-alert/get-alert-details',
  'GET /api/meter/alert/events': 'web/meter-alert/list-alert-events',
  'POST /api/meter/alert': 'web/meter-alert/create-alert',
  'PUT /api/meter/alert/:id': 'web/meter-alert/update-alert',
  'DELETE /api/meter/alert/:id': 'web/meter-alert/remove-alert',

  /* METER CSV REPORT API */
  'POST /api/meter/csv/:id/create': 'web/meter-csv/create-report',
  'GET /api/meter/csv': 'web/meter-csv/list-reports',
  'GET /api/meter/csv/:id': 'web/meter-csv/get-report-details', 
  'GET /api/meter/csv/:id/download': 'web/meter-csv/get-report-url',
  'DELETE /api/meter/csv/:id': 'web/meter-csv/remove-report',
  'GET /api/meter/csv/:project/list': 'web/meter-csv/list-reports',



  //  ╦═╗╔═╗╔═╗╔═╗╔═╗╔╦╗╔═╗╦═╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ╠╦╝║╣ ╠═╝║╣ ╠═╣ ║ ║╣ ╠╦╝  ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╩╚═╚═╝╩  ╚═╝╩ ╩ ╩ ╚═╝╩╚═  └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* REPEATER API */
  'GET /api/repeater': 'web/repeater/list-repeaters',
  'GET /api/repeater/:id': 'web/repeater/find-one',
  'POST /api/repeater': 'web/repeater/create',
  'PUT /api/repeater/:id': 'web/repeater/update',
  'DELETE /api/repeater/:id': 'web/repeater/destroy',

  /* REPEATER ALERT API */
  'GET /api/repeater/alert': 'web/repeater-alert/list-alerts',
  'GET /api/repeater/alert/:id': 'web/repeater-alert/get-alert-details',
  'GET /api/repeater/alert/events': 'web/repeater-alert/list-alert-events',
  'POST /api/repeater/alert': 'web/repeater-alert/create-alert',
  'PUT /api/repeater/alert/:id': 'web/repeater-alert/update-alert',
  'DELETE /api/repeater/alert/:id': 'web/repeater-alert/remove-alert',

  //  ╔═╗╔═╗╔╦╗╔═╗╦ ╦╔═╗╦ ╦  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ║ ╦╠═╣ ║ ║╣ ║║║╠═╣╚╦╝  ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╚═╝╩ ╩ ╩ ╚═╝╚╩╝╩ ╩ ╩   └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* GATEWAY API */
  'GET /api/gateway': 'web/gateway/list-gateways',
  'GET /api/gateway/:id': 'web/gateway/find-one',
  'POST /api/gateway': 'web/gateway/create',
  'PUT /api/gateway/:id': 'web/gateway/update',
  'DELETE /api/gateway/:id': 'web/gateway/destroy',

  //  ╔═╗╦ ╦╦╔╦╗╔═╗╦ ╦  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ╚═╗║║║║ ║ ║  ╠═╣  ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╚═╝╚╩╝╩ ╩ ╚═╝╩ ╩  └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* SWITCH API */
  'GET /api/switch': 'web/switch/list-switches',
  'GET /api/switch/schedulers': 'web/switch/list-schedulers',
  'GET /api/switch/:id': 'web/switch/find-one',
  'GET /api/switch/event/:id': 'web/switch/find-one-event',
  'POST /api/switch': 'web/switch/create', 
  'PUT /api/switch/:id': 'web/switch/update',
  'DELETE /api/switch/:id': 'web/switch/destroy',

  'GET /api/switch/event': 'web/switch/list-events',// todo verify this
  'POST /api/switch/event': 'web/switch/schedule-event',// todo verify this
  'DELETE /api/switch/event/:id': 'web/switch/cancel-event',// todo verify this
  'DELETE /api/switch/events': 'web/switch/clear-schedule',// todo verify this

  'GET /api/switch/get-savings' : 'web/switch/get-equipment-savings',

  /* SWITCH ALERT API */
  'GET /api/switch/alert': 'web/switch-alert/list-alerts',
  'GET /api/switch/alert/:id': 'web/switch-alert/get-alert-details',
  'GET /api/switch/alert/events': 'web/switch-alert/list-alert-events',
  'POST /api/switch/alert': 'web/switch-alert/create-alert',
  'PUT /api/switch/alert/:id': 'web/switch-alert/update-alert',
  'DELETE /api/switch/alert/:id': 'web/switch-alert/remove-alert',
  'POST /api/switch/schedule': 'web/switch/create-schedule',
  'PUT /api/switch/equipment/update-schedule' : 'web/switch/update-schedule',
  'PUT /api/switch/delete-schedule': 'web/switch/delete-switch-schedule',
  'GET /api/switch/equipment/get-schedule' : 'web/switch/get-schedule',
  'GET /api/switch/equipment/get-usage' : 'web/project/get-equipment-usage',
  'GET /api/switch/equipment/get-detail' : 'web/project/get-equipment-detail',
  'GET /api/switch/list-schedules' : 'web/switch/list-schedules',
  'PUT /api/project/calculate-savings' : 'web/project/calculate-savings',
  'PUT /api/project/calculate-project-savings' : 'web/project/calculate-project-savings',
  'PUT /api/rollup/run-15min-rollup' : 'rollup/perform-rollup',
  'PUT /api/rollup/run-daily-script' : 'rollup/daily-calculations',
  'PUT /api/rollup/generate-automatic-monthly-reports' : 'rollup/generate-automatic-monthly-reports',
  'PUT /api/project/calculate-week-savings' : 'web/project/calculate-week-savings',


  //  ┌─┐┌─┐┬ ┬┌─┐┬─┐  ╔╦╗╔═╗╔═╗╔╦╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ├─┘│ ││││├┤ ├┬┘   ║ ║╣ ╚═╗ ║   ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ┴  └─┘└┴┘└─┘┴└─   ╩ ╚═╝╚═╝ ╩   └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* TEST API */
  'GET /api/test': 'web/test/list-tests',
  'POST /api/test': 'web/test/create-test',
  'DELETE /api/test/:id': 'web/test/remove-test',

  /* TEST REPORTING API */
  'GET /api/test/:id/report': 'web/test/get-test-report',
  'GET /api/test/:id/selected-report': 'web/test/get-selected-meter-test-report',
  'PUT /api/test/:project/reporting-meters': 'web/test/update-reporting-meters',
  'GET /api/test/:id/data': 'web/test/get-raw-test-data',
  'PUT /api/test/:id/data': 'web/test/unhide-data-rows',
  'DELETE /api/test/:id/data': 'web/test/hide-data-rows',


  //  ╦ ╦╔═╗╔═╗╦═╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ║ ║╚═╗║╣ ╠╦╝  ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╚═╝╚═╝╚═╝╩╚═  └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* USER API (for admins) */
  'GET /api/user': 'web/user/list',
  'GET /api/user/:id': 'web/user/find-one',
  'POST /api/user': 'web/user/create',

  /* WHITELABEL API */
  'GET /api/whitelabel/brand-name': 'web/whitelabel/get-brand-name',
  'PUT /api/user/:id': 'web/user/update',
  'DELETE /api/user/:id': 'web/user/destroy',

  /* USER API (for everyone) */
  'POST /api/account': 'web/user/accept-invite',
  'GET /api/account': 'web/user/get-logged-in-user-details',
  'PUT /api/account': 'web/user/update-logged-in-user-details',
  'POST /api/account/:user/upload-logo': 'web/user/upload-user-logo',


  //  ╔═╗╦═╗╔═╗ ╦╔═╗╔═╗╔╦╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ╠═╝╠╦╝║ ║ ║║╣ ║   ║   ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╩  ╩╚═╚═╝╚╝╚═╝╚═╝ ╩   └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* PROJECT API (for admins) */
  'GET /api/project': 'web/project/list',
  'GET /api/project/:id': 'web/project/find-one',
  'POST /api/project': 'web/project/create',
  'PUT /api/project/:id': 'web/project/update',
  'DELETE /api/project/:id': 'web/project/destroy',

  /* PROJECT (SAVINGS REPORT) API */
  'GET /api/project/list-files': 'web/project/list-files',
  'DELETE /api/project/delete-file/:fileName/:fileId': 'web/project/destroy-file-uploaded',
  'POST /api/project/:project/upload-file/:name/:description': 'web/project/upload-file',
  'POST /api/project/upload-file/:name/:description': 'web/project/upload-file',
  'GET /api/project/:project/savings-report': 'web/project/list-savings-reports',
  'GET /api/project/:project/savings-report/:month': 'web/project/get-savings-report-details',
  'POST /api/project/:project/savings-report': 'web/project/create-savings-report',
  'PUT /api/project/:project/savings-report/:month': 'web/project/update-savings-report-details',
  'DELETE /api/project/:project/savings-report/:month': 'web/project/destroy-savings-report',
  'POST /api/project/:project/savings-report/:month/bill': 'web/project/upload-savings-report-bill',
  'DELETE /api/project/:project/savings-report/:month/bill': 'web/project/remove-savings-report-bill',
  'GET /api/project/:project/current-savings': 'web/project/get-current-savings',
  'GET /api/project/:project/carbon-savings': 'web/project/get-carbon-savings',
  'GET /api/project/:project/carbon-chart': 'web/project/get-carbon-chart',
  'GET /api/project/:project/line-chart-data': 'web/project/get-line-chart-data',
  'GET /api/project/:project/meterdata-detail': 'web/project/get-meterdata-detail',
  'GET /api/project/all-equipment-savings': 'web/project/get-all-equipment-savings',
  /* PROJECT (ELECTRIC BILL ANALYSIS) API */
  'PUT /api/project/:project/electric-bill-analysis': 'web/project/set-electric-bill-analysis',

  /* PROJECT (EQUIPMENT INFO) API */
  'PUT /api/project/:project/equipment-info': 'web/project/set-equipment-info',
  'GET /api/project/:project/budget': 'web/project/get-budget',
  'PUT /api/project/:project/update-budget': 'web/project/update-budget',


  //  ╔═╗╦  ╦╔═╗╔╗╔╔╦╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ║  ║  ║║╣ ║║║ ║   ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╚═╝╩═╝╩╚═╝╝╚╝ ╩   └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘
  /* CLIENT API (for admins) */
  'GET /api/client': 'web/client/list',
  'GET /api/client/:id': 'web/client/find-one',
  'POST /api/client': 'web/client/create',
  'PUT /api/client/:id': 'web/client/update',
  'DELETE /api/client/:id': 'web/client/destroy',
  'POST /api/client/:client/upload-logo': 'web/client/upload-company-logo',


  //  ╔╦╗╦╔═╗╔═╗╔═╗╦  ╦  ╔═╗╔╗╔╔═╗╔═╗╦ ╦╔═╗  ┌─┐┌┐┌┌┬┐┌─┐┌─┐┬┌┐┌┌┬┐┌─┐
  //  ║║║║╚═╗║  ║╣ ║  ║  ╠═╣║║║║╣ ║ ║║ ║╚═╗  ├┤ │││ ││├─┘│ │││││ │ └─┐
  //  ╩ ╩╩╚═╝╚═╝╚═╝╩═╝╩═╝╩ ╩╝╚╝╚═╝╚═╝╚═╝╚═╝  └─┘┘└┘─┴┘┴  └─┘┴┘└┘ ┴ └─┘

  /* ADVANCED OPTIONS (XECO) API */
  'PUT /api/xeco': 'web/xeco/update',

  /* REMOTE SERVER MAINTENANCE API */

  'POST /api/maintenance/status': 'web/xeco/maintenance/status',
  'POST /api/maintenance/files': 'web/xeco/maintenance/files',
  'POST /api/maintenance/update': 'web/xeco/maintenance/update',
  'POST /api/maintenance/rollback': 'web/xeco/maintenance/rollback',
  'POST /api/maintenance/remote-status': 'web/xeco/maintenance/remote-status',
  'POST /api/maintenance/remote-update': 'web/xeco/maintenance/remote-update',
  'POST /api/maintenance/remote-rollback': 'web/xeco/maintenance/remote-rollback',

  /* PAYMENT API */

  '/api/payment/:action': 'web/payment',


  /* REMOTE DATA SYNCHRONIZATION */

  '/api/datasync/:table/:since?/:limit?/:refId?': 'web/datasync',

  /* DEVELOPMENT API */

  'GET /api/dev/:command': 'web/xeco/dev',


  //  ╔═╗╔╦╗╦ ╦╔═╗╦═╗  ╦═╗╔═╗╦ ╦╔╦╗╔═╗╔═╗
  //  ║ ║ ║ ╠═╣║╣ ╠╦╝  ╠╦╝║ ║║ ║ ║ ║╣ ╚═╗
  //  ╚═╝ ╩ ╩ ╩╚═╝╩╚═  ╩╚═╚═╝╚═╝ ╩ ╚═╝╚═╝

  /* CATCHALL FOR API ROUTES */
  '/api/*': { response: 'notFound' },

  /* New user invite flow - MUST be before catch-all route */
  'GET /invite/accept': 'web/user/view-invite',

  /* Download invoice/proposal PDF */
  'GET /secure/view': 'web/project/download-pdf',

  /* FAQ */
  'GET /faq': { view: 'faq' },

  /* Terms of Use */
  'GET /terms': { view: 'terms' },
  'GET /agreement': { view: 'agreement' },

  /* Disable CSRF for auth-related endpoints */
  /* (See `api/hooks/auth/` for the related routes) */
  'POST /login': { csrf: false },
  'POST /reset-password-email': { csrf: false },
  'POST /reset-password': { csrf: false },
  'POST /api/auth/verify-jwt': { action: 'auth/verify-jwt', csrf: false },
  'GET /sso': { action: 'auth/sso-login', csrf: false },

  /* Direct all other non-asset requests to the endpoint that serves the SPA */
  '/*': {action: 'web/index', skipAssets: true},

  'GET /css/font-awesome.css': function(req, res) {
    return serveFonts(req, res, res.notFound);
  },

  'GET /fonts/*': function(req, res) {
    return serveFonts(req, res, res.notFound);
  },

  'GET r|^/(js|css|images|scripts)/.*$|': function (req, res) {
    if (process.env.NODE_ENV === 'production' && req._sails.config.environment !== 'test_prod') {
      return res.redirect('https://s3' + (process.env.S3_REGION ? ('.' + process.env.S3_REGION) : '') + '.amazonaws.com/' + process.env.S3_BUCKET_NAME + '/' + appVersion + '/static' + req.url);
    }
    
    // For images, check whitelabel directory first
    if (req.url.match(/^\/images\//)) {
      var whitelabelConfig = sails.config.whitelabel;
      if (!whitelabelConfig) {
        // Whitelabel config not loaded, fall through to default
        return serveStatic(req, res, res.notFound);
      }
      
      var hostname = req.hostname || req.get('host') || '';
      var branding = whitelabelConfig.getBrandingFromHostname(hostname);
      
      // Check custom domain mappings
      if (whitelabelConfig.domainMappings[hostname]) {
        branding = whitelabelConfig.domainMappings[hostname];
      }
      
      // If branding exists (not portal), check whitelabel directory
      if (branding !== null) {
        var fs = require('fs');
        var path = require('path');
        var assetName = req.url.replace('/images/', '');
        var whitelabelPath = path.join(whitelabelConfig.basePath, branding, 'images', assetName);
        
        if (fs.existsSync(whitelabelPath)) {
          return res.sendFile(path.resolve(whitelabelPath));
        }
      }
    }
    
    return serveStatic(req, res, res.notFound);
  },

  'GET /files/*': {
		cors: true,
		fn: function(req, res) {
			if(!serveStorageInitiated) {
				serveStorageInitiated = true

				try {
					serveStorage = require('serve-static')(path.resolve(sails.config.storage.localPath));
				} catch(e) {
					console.log('Could not initiate serving static resources from local storage. See config/storage.js', e)
				}
			}

			var storageRoot = path.resolve(sails.config.storage.localPath);
			var relativePath = req.url.replace(/^\/files\/+/, '');
			var filePath = path.resolve(storageRoot, relativePath);

			if (fs.existsSync(filePath)) {
				return res.sendFile(filePath);
			}

			if(serveStorage) {
				return serveStorage(req, res, res.notFound)
			} else {
				return res.notFound
			}
		}
}

};
