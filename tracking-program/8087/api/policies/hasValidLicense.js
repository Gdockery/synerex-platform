/**
 * hasValidLicense
 *
 * A policy that checks if the user's organization has a valid license
 * for the Tracking Program. Calls the Synerex License Service to validate.
 *
 * This policy should be applied to all protected routes that require
 * a valid tracking license.
 *
 * License checks are performed against the central License Service (port 8000).
 * The same service is used by the My Account page to display license status.
 */

const http = require('http');

// Get license service URL from config or environment
const getLicenseServiceUrl = () => {
  if (typeof sails !== 'undefined' && sails.config && sails.config.licenseService) {
    return sails.config.licenseService.url;
  }
  return process.env.LICENSE_SERVICE_URL;
};

const PROGRAM_ID = 'tracking';

module.exports = function hasValidLicense(req, res, next) {

  // Get org_id from session - try multiple locations
  const orgId = req.session.orgId || 
                (req.session.user && req.session.user.orgId) ||
                (req.session.user && req.session.user.clientId) ||
                req.headers['x-org-id'];

  if (!orgId) {
    // JWT fallback: verify via License Service to get org_id
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const licenseServiceUrl = getLicenseServiceUrl();
      if (licenseServiceUrl) {
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
        const jwtReq = client.request(options, (jwtRes) => {
          let data = '';
          jwtRes.on('data', (chunk) => { data += chunk; });
          jwtRes.on('end', () => {
            try {
              const body = JSON.parse(data || '{}');
              const claims = body && body.claims;
              if (jwtRes.statusCode === 200 && claims && claims.sub) {
                req.session.orgId = claims.sub;
                const roles = claims.roles || [];
                if (roles.includes('administrator') || roles.includes('admin')) {
                  req.session.userRole = 'admin';
                }
              }
            } catch (e) {
              sails.log.warn('hasValidLicense: JWT parse error:', e);
            }
            return next();
          });
        });
        jwtReq.on('timeout', () => {
          sails.log.warn('hasValidLicense: JWT verify timeout');
          jwtReq.destroy();
          return next();
        });
        jwtReq.on('error', (err) => {
          sails.log.warn('hasValidLicense: JWT verify error:', err.message);
          return next();
        });
        jwtReq.write(payload);
        jwtReq.end();
        return;
      }
    }
    sails.log.warn('hasValidLicense: No org_id found in session');
    // If no org_id, let the request through (will be handled by isLoggedIn)
    // This allows the login flow to work
    return next();
  }

  // Check if user is an admin (admins bypass license check)
  const userRole = req.session.userRole || 
                   (req.session.user && req.session.user.role) ||
                   (req.session.user && req.session.user.userType);
  
  if (userRole === 'admin' || userRole === 'administrator' || userRole === 'superadmin') {
    sails.log.debug('hasValidLicense: Admin user bypassing license check');
    return next();
  }

  // Build the license check URL
  const LICENSE_SERVICE_URL = getLicenseServiceUrl();
  const checkUrl = new URL('/api/licenses/check', LICENSE_SERVICE_URL);
  checkUrl.searchParams.set('org_id', orgId);
  checkUrl.searchParams.set('program_id', PROGRAM_ID);

  // Make HTTP request to License Service
  const requestOptions = {
    hostname: checkUrl.hostname,
    port: checkUrl.port || 8000,
    path: checkUrl.pathname + checkUrl.search,
    method: 'GET',
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const licenseReq = http.request(requestOptions, (licenseRes) => {
    let data = '';

    licenseRes.on('data', (chunk) => {
      data += chunk;
    });

    licenseRes.on('end', () => {
      try {
        const body = JSON.parse(data);

        if (licenseRes.statusCode === 200 && body.valid === true) {
          // Valid license - proceed
          sails.log.debug(`hasValidLicense: Valid license for org ${orgId}`);
          return next();
        }

        // License invalid or not found
        const reason = body.reason || 'No valid license found';
        sails.log.warn(`hasValidLicense: License check failed for org ${orgId}: ${reason}`);

        if (req.wantsJSON) {
          return res.status(403).json({
            error: reason,
            code: 'LICENSE_REQUIRED',
            program_id: PROGRAM_ID,
            purchase_url: `${LICENSE_SERVICE_URL}/register/?program=${PROGRAM_ID}`,
            message: 'A valid Tracking Program license is required to access this feature.'
          });
        }

        // For non-JSON requests, redirect to purchase page
        return res.redirect(`${LICENSE_SERVICE_URL}/register/?program=${PROGRAM_ID}`);

      } catch (parseErr) {
        sails.log.error('hasValidLicense: Failed to parse license response:', parseErr);
        // On parse error, allow access (fail open for availability)
        return next();
      }
    });
  });

  licenseReq.on('error', (err) => {
    // License service unavailable - allow access (offline mode)
    sails.log.warn('hasValidLicense: License service unavailable:', err.message);
    sails.log.warn('hasValidLicense: Allowing access in offline mode');
    return next();
  });

  licenseReq.on('timeout', () => {
    sails.log.warn('hasValidLicense: License service timeout - allowing access');
    licenseReq.destroy();
    return next();
  });

  licenseReq.end();
};
