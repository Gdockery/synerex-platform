/**
 * show-login-page.js
 *
 * Show login page.
 */
module.exports = function showLoginPage(req, res) {
  var role = (req.query && req.query.role) ? req.query.role.toLowerCase() : '';
  var isAdmin = role === 'admin';
  var loginLabel = isAdmin ? 'Tracking Admin Sign In' : (role === 'user' ? 'Tracking User Sign In' : 'Tracking Sign In');

  return req._sails.hooks.auth._showPage(res, 'login-page', {
    loginRole: role,
    loginLabel: loginLabel
  });
};
