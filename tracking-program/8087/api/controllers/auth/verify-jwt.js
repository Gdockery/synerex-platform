/**
 * auth/verify-jwt
 *
 * Read-only JWT validation via License Service.
 */
module.exports = async function verifyJwt(req, res) {
  try {
    const token = req.body && req.body.token;
    if (!token) {
      return res.status(400).json({ status: 'error', error: 'Missing token' });
    }

    const licenseServiceUrl = process.env.LICENSE_SERVICE_URL;
    if (!licenseServiceUrl) {
      return res.status(500).json({ status: 'error', error: 'License Service URL not configured' });
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
          if (jwtRes.statusCode !== 200 || !body.claims) {
            return res.status(401).json({ status: 'error', error: 'Invalid or expired token' });
          }
          return res.json({ status: 'success', claims: body.claims });
        } catch (e) {
          return res.status(500).json({ status: 'error', error: 'Invalid response from auth service' });
        }
      });
    });

    jwtReq.on('timeout', function() {
      jwtReq.destroy();
      return res.status(504).json({ status: 'error', error: 'Auth service timeout' });
    });
    jwtReq.on('error', function(err) {
      sails.log.error('auth/verify-jwt request error:', err);
      return res.status(502).json({ status: 'error', error: 'Auth service error' });
    });
    jwtReq.write(payload);
    jwtReq.end();
    return;
  } catch (err) {
    sails.log.error('auth/verify-jwt error:', err);
    return res.status(500).json({ status: 'error', error: err.message || 'Unexpected error' });
  }
};
