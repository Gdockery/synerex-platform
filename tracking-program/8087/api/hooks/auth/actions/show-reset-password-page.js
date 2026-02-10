/**
 * show-reset-password-page.js
 *
 * Show reset password page.
 */
module.exports = function showResetPasswordPage(req, res) {

  // Get the supplied token.
  var token = req.param('t');

  // If none supplied, bail.
  if (!token) { return res.notFound(); }

  // Look up the user with the token.
  User.findOne({resetPasswordToken: token}).exec(function(err, user) {
    if (err) { return res.serverError(err); }
    if (!user) { return res.notFound(); }

    return req._sails.hooks.auth._showPage(res, 'reset-password-page', {token: token});

  });


};
