/**
 * auth/sso-login
 *
 * Accepts JWT token in query string and establishes session.
 */
module.exports = function ssoLogin(req, res) {
  const token = req.query && req.query.token;
  if (!token) {
    return res.redirect('/login');
  }

  const licenseServiceUrl = process.env.LICENSE_SERVICE_URL;
  if (!licenseServiceUrl) {
    sails.log.warn('sso-login: LICENSE_SERVICE_URL not set');
    return res.redirect('/login');
  }

  const http = require('http');
  const https = require('https');
  const url = new URL('/auth/api/verify-jwt', licenseServiceUrl);
  const payload = JSON.stringify({ token: token });
  const options = {
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

  const client = url.protocol === 'https:' ? https : http;
  const jwtReq = client.request(options, function(jwtRes) {
    let data = '';
    jwtRes.on('data', function(chunk) { data += chunk; });
    jwtRes.on('end', function() {
      try {
        const body = JSON.parse(data || '{}');
        const claims = body && body.claims;
        const email = claims && claims.email;
        if (jwtRes.statusCode !== 200 || !email) {
          return res.redirect('/login');
        }
        User.findOne({ email: email, isDeleted: false }).exec(function(err, user) {
          if (err || !user) {
            return res.redirect('/login');
          }
          req.session.userId = user.id;
          req.session.user = user;
          req.session.userRole = user.role;
          req.session.orgId = claims.sub;
          return res.redirect('/');
        });
      } catch (e) {
        return res.redirect('/login');
      }
    });
  });

  jwtReq.on('timeout', function() {
    jwtReq.destroy();
    return res.redirect('/login');
  });
  jwtReq.on('error', function() {
    return res.redirect('/login');
  });
  jwtReq.write(payload);
  jwtReq.end();
};
