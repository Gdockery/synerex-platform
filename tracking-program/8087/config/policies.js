/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/isLoggedIn.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "isLoggedIn")
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.com/docs/concepts/policies
 */
module.exports.policies = {
  // =========================================================================
  // SYNEREX LICENSE INTEGRATION
  // Protected routes require both login AND valid tracking license
  // License checks are performed against License Service (port 8000)
  // =========================================================================

  // Protect everything for the web API by default (login + license)
  'web/*': ['isLoggedIn', 'hasValidLicense'],

  // Expose login-related endpoints (no license needed to login)
  '_auth/*': true,

  // Expose the root action (homepage) - license checked after login
  'web/index': true,

  // Allow public access to the user invitation page
  'web/user/view-invite': true,

  // Allow public access to accept invite (POST /api/account)
  'web/user/accept-invite': true,

  // Allow public access to /api/account (needed for login flow)
  'web/user/get-logged-in-user-details': 'isLoggedIn', // Only login required, not license
  'web/account': true,

  // Allow public access to whitelabel brand name endpoint
  'web/whitelabel/get-brand-name': true,

  // =========================================================================
  // LICENSE-PROTECTED ROUTES
  // These require both authentication AND a valid tracking license
  // =========================================================================

  // Project management - requires license
  'web/project/*': ['isLoggedIn', 'hasValidLicense'],

  // User management - only requires login (admins need to manage users)
  'web/user/*': 'isLoggedIn',

  // Core tracking features - require license
  'web/client/*': ['isLoggedIn', 'hasValidLicense'],
  'web/repeater/*': ['isLoggedIn', 'hasValidLicense'],
  'web/meter/*': ['isLoggedIn', 'hasValidLicense'],
  'web/switch/*': ['isLoggedIn', 'hasValidLicense'],

  // Maintenance endpoints - special access
  'web/xeco/maintenance/status': 'isRemoteMaintainer',
  'web/xeco/maintenance/files': 'isRemoteMaintainer',
  'web/xeco/maintenance/update': 'isRemoteMaintainer',
  'web/xeco/maintenance/rollback': 'isRemoteMaintainer',

  // Data sync - public for now
  'web/datasync': true,

  // Dev endpoint
  'web/xeco/dev': true,
};
/*
module.exports.policies = {
  // Protect everything for the web API by default
  'web/*': 'isLoggedIn',

  // Expose login-related endpoints
  '_auth/*': true,

  // Expose the root action (homepage)
  'web/index': true,
  'web/index': true,

  // TODO: implement isXecoAdmin and isXecoUser protections
  // (temporarily, we allow all requests for development)
  'web/project/*': 'isLoggedIn',

  // TODO: same thing here
  'web/user/*': 'isLoggedIn',
  'web/user/view-invite': true,

  'web/client/*': 'isLoggedIn',
  'web/repeater/*': 'isLoggedIn',
  'web/meter/*': 'isLoggedIn',
  'web/switch/*': 'isLoggedIn',

  'web/xeco/maintenance/status': 'isRemoteMaintainer',
  'web/xeco/maintenance/files': 'isRemoteMaintainer',
  'web/xeco/maintenance/update': 'isRemoteMaintainer',
  'web/xeco/maintenance/rollback': 'isRemoteMaintainer',

  
   // TODO: implement proper policy; could reuse isRemoteMaintainer implementation
   
  'web/datasync': true,

  'web/xeco/dev': true,
};*/

