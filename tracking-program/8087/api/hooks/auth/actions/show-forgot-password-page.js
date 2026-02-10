/**
 * show-forgot-password-page.js
 *
 * Show forgot password page.
 */
module.exports = function showForgotPasswordPage(req, res) {

  return req._sails.hooks.auth._showPage(res, 'forgot-password-page');

};
