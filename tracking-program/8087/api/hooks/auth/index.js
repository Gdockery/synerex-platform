/**
 * auth hook
 *
 * @description :: A hook definition.  Extends Sails by adding shadow routes, implicit actions, and/or initialization logic.
 * @docs        :: http://sailsjs.com/docs/concepts/extending-sails/hooks
 */

var path = require('path');

module.exports = function defineAuthHook(sails) {

  var pathToLayout = '';

  return {

    /**
     * Runs when a Sails app loads/lifts.
     *
     * @param {Function} done
     */
    initialize: function (done) {

      _.each([
        'show-login-page',
        'login-user',
        'logout-user',
        'show-forgot-password-page',
        'send-password-reset-email',
        'show-reset-password-page',
        'reset-password'
      ], function (action) {
        sails.registerAction(require('./actions/' + action), '_auth/' + action);
      });

      // Cache the absolute path to the layout file, if any.
      pathToLayout = (function() {
        if (!sails.config.views || !sails.config.views.layout) { return false; }
        if (typeof sails.config.views.layout === 'string') {
          return path.resolve(sails.config.paths.views, sails.config.views.layout);
        }
        if (sails.config.views.layout === true) {
          return path.resolve(sails.config.paths.views, 'layout');
        }
        return false;
      })();

      return done();

    },

    routes: {

      before: {

        /* Login page */
        'GET /login': '_auth/show-login-page',

        /* Login action */
        'POST /login': '_auth/login-user',

        /* Logout action */
        '/logout': '_auth/logout-user',

        /* Forgot password page */
        'GET /forgot-password': '_auth/show-forgot-password-page',

        /* Get reset password token action */
        'POST /reset-password-email': '_auth/send-password-reset-email',

        /* Reset password page */
        'GET /reset-password': '_auth/show-reset-password-page',

        /* Reset password action */
        'POST /reset-password': '_auth/reset-password',

        /* New user invite page - must be before catch-all routes */
        'GET /invite/accept': function(req, res) {
          sails.log.info('Auth hook: /invite/accept route matched, URL:', req.url, 'query:', req.query, 'path:', req.path);
          
          // Get token from query string
          var token = req.query && req.query.token;
          
          if (!token) {
            sails.log.warn('Auth hook: No token provided in /invite/accept');
            return res.badRequest('Token parameter is required');
          }

          // Look up user by token
          User.findOne({ resetPasswordToken: token }).exec(function(err, user) {
            if (err) {
              sails.log.error('Auth hook: Error finding user:', err);
              return res.serverError(err);
            }
            if (!user) {
              sails.log.warn('Auth hook: No user found for token:', token);
              return res.notFound();
            }
            
            sails.log.info('Auth hook: Found user:', user.email, 'for token');
            
            // Render the accept-invite view
            return res.view('accept-invite', {
              token: user.resetPasswordToken,
              email: user.email,
              fullName: user.firstName + ' ' + user.lastName
            });
          });
        }

      }

    },

    _showPage: function(res, page, locals) {
      var viewLocals = locals || {};
      return res.view(page, viewLocals, function(err, html) {
        if (err) {
          if (!viewLocals.layout) {
            viewLocals.layout = pathToLayout;
          }
          return res.view(path.resolve(__dirname, 'views', page), viewLocals);
        }
        return res.send(html);
      });
    }

  };

};
