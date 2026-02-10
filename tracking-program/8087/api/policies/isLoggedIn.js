/**
 * isLoggedIn
 *
 * A simple policy that allows any request from an authenticated user.
 *
 * For more about how this policy works and how to use it, see:
 *   http://sailsjs.com/anatomy/api/policies/isLoggedIn.js
 */
module.exports = function isLoggedIn(req, res, next) {

  // If `req.session.userId` is set, then we know that this request originated
  // from a logged-in user.  So we can safely proceed to the next policy--
  // or, if this is the last policy, the relevant action.
  if (req.session.userId) {
    return next();
  }

  // JWT fallback: verify via License Service
  var authHeader = req.headers && req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    var token = authHeader.slice(7);
    var licenseServiceUrl = process.env.LICENSE_SERVICE_URL;
    if (!licenseServiceUrl) {
      sails.log.warn('isLoggedIn: LICENSE_SERVICE_URL not set; skipping JWT auth');
    } else {
      var http = require('http');
      var https = require('https');
      var url = new URL('/auth/api/verify-jwt', licenseServiceUrl);
      var payload = JSON.stringify({ token: token });
      var options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      var client = url.protocol === 'https:' ? https : http;
      var jwtReq = client.request(options, function(jwtRes) {
        var data = '';
        jwtRes.on('data', function(chunk) { data += chunk; });
        jwtRes.on('end', function() {
          try {
            var body = JSON.parse(data || '{}');
            var claims = body && body.claims;
            var email = claims && claims.email;
            if (jwtRes.statusCode === 200 && email) {
              User.findOne({ email: email, isDeleted: false }).exec(function(err, user) {
                if (err) {
                  sails.log.error('isLoggedIn: User lookup error:', err);
                  return res.forbidden();
                }
                if (!user) {
                  sails.log.warn('isLoggedIn: No user for JWT email:', email);
                  return res.forbidden();
                }
                req.session.userId = user.id;
                req.session.user = user;
                req.session.userRole = user.role;
                req.session.orgId = claims.sub;
                return next();
              });
              return;
            }
          } catch (e) {
            sails.log.warn('isLoggedIn: JWT parse error:', e);
          }
          // Fall through to normal handling
          return res.forbidden();
        });
      });

      jwtReq.on('timeout', function() {
        sails.log.warn('isLoggedIn: JWT verify timeout');
        jwtReq.destroy();
        return res.forbidden();
      });
      jwtReq.on('error', function(err) {
        sails.log.warn('isLoggedIn: JWT verify error:', err.message);
        return res.forbidden();
      });
      jwtReq.write(payload);
      jwtReq.end();
      return;
    }
  }

  // If this was an API request, return a 403.
  if (req.wantsJSON) {
    return res.forbidden();
  }

  // Otherwise, redirect to the login page.
  return res.redirect('/login');

};
