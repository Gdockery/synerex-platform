/**
 * Whitelabel Configuration
 * (sails.config.whitelabel)
 *
 * Configuration for URL-based whitelabel branding system.
 * Extracts branding identifier from hostname and resolves asset paths accordingly.
 */

module.exports.whitelabel = {
  /**
   * Default branding identifier
   * Used when hostname is missing or for local hostnames
   */
  defaultBranding: 'tracking',

  /**
   * Base path for whitelabel directories
   * Each domain will have its own subdirectory: {basePath}/{branding}/images/
   */
  basePath: process.env.WHITELABEL_BASE_PATH || require('path').resolve(__dirname, '..', 'whitelabel'),

  /**
   * Extract branding identifier from hostname
   * @param {string} hostname - The hostname from the request (e.g., 'harmoniq.synerexlabs.com')
   * @returns {string|null} - The branding identifier or null for defaults
   */
  getBrandingFromHostname: function(hostname) {
    if (!hostname) {
      return this.defaultBranding;
    }

    // Special case: portal always uses defaults
    if (hostname.startsWith('portal.')) {
      return null;
    }

    // Use default branding for local development
    const localHostnames = (process.env.LOCAL_HOSTNAMES || '').split(',').map((entry) => entry.trim()).filter(Boolean);
    if (localHostnames.includes(hostname)) {
      return this.defaultBranding;
    }

    // Extract subdomain (first part before first dot)
    const parts = hostname.split('.');
    if (parts.length > 0) {
      const subdomain = parts[0].toLowerCase();
      // Return null for empty or invalid subdomains
      if (subdomain && subdomain !== 'www' && subdomain !== '') {
        return subdomain;
      }
    }

    return this.defaultBranding;
  },

  /**
   * Custom domain-to-branding mappings
   * Override the default subdomain extraction for specific domains
   */
  domainMappings: {
    // Example: 'portal.xecoenergy.com': 'xeco',
    // Add custom mappings here if needed
  },

  /**
   * Default asset paths (used when branding is null or file not found in whitelabel)
   */
  defaultPaths: {
    images: require('path').resolve(__dirname, '..', 'assets', 'images'),
    pdfResources: require('path').resolve(__dirname, '..', 'api', 'services', 'pdf', 'resources')
  },

  /**
   * Brand name cache (hostname -> brand name)
   */
  _brandNameCache: {},

  /**
   * Get brand name from hostname
   * Reads from whitelabel/{branding}/brandname.txt if exists, otherwise defaults to "Synerex"
   * @param {string} hostname - The hostname from the request
   * @returns {string} - The brand name (defaults to "Synerex")
   */
  getBrandName: function(hostname) {
    if (!hostname) {
      return 'Synerex';
    }

    // Check cache first
    if (this._brandNameCache[hostname]) {
      return this._brandNameCache[hostname];
    }

    // Get branding identifier
    var branding = this.getBrandingFromHostname(hostname);
    
    // Check custom domain mappings
    if (this.domainMappings[hostname]) {
      branding = this.domainMappings[hostname];
    }

    var brandName = 'Synerex'; // Default

    // If branding exists, try to read brandname.txt
    if (branding !== null) {
      var fs = require('fs');
      var path = require('path');
      var brandnamePath = path.join(this.basePath, branding, 'brandname.txt');
      
      try {
        if (fs.existsSync(brandnamePath)) {
          var brandnameContent = fs.readFileSync(brandnamePath, 'utf8').trim();
          if (brandnameContent) {
            brandName = brandnameContent;
          }
        }
      } catch (err) {
        // If file read fails, use default
        console.warn('Warning: Could not read brandname.txt for', branding, ':', err.message);
      }
    }

    // Cache the result
    this._brandNameCache[hostname] = brandName;

    return brandName;
  }

};
