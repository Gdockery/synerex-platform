import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WhitelabelService {
  private branding: string | null = null;
  private initialized: boolean = false;
  private brandName: string | null = null;
  private brandNameLoading: boolean = false;

  constructor(private http: HttpClient) {
    this.initialize();
  }

  private initialize(): void {
    if (this.initialized) {
      return;
    }
    
    const hostname = window.location.hostname;
    this.branding = this.getBrandingFromHostname(hostname);
    this.initialized = true;
  }

  private getBrandingFromHostname(hostname: string): string | null {
    if (!hostname) {
      return null;
    }

    // Special case: portal always uses defaults
    if (hostname.startsWith('portal.')) {
      return null;
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

    return null;
  }

  /**
   * Get image URL with whitelabel support
   * @param filename - Name of the image file (e.g., 'logo-small.png')
   * @returns URL path to the image (backend will resolve to whitelabel or default)
   */
  getImageUrl(filename: string): string {
    // Prefix with apiBasePath (e.g. /tracking) so image requests route through
    // the correct proxy path when the app is served under a sub-path.
    const base = (typeof window !== 'undefined' &&
                  window['BOOTSTRAP_DATA'] &&
                  window['BOOTSTRAP_DATA'].apiBasePath) || '';
    return `${base}/tracking-images/${filename}`;
  }

  /**
   * Get logo URL by size
   * @param size - Logo size: 'small', 'big', or 'big1'
   * @returns URL path to the logo
   */
  getLogoUrl(size: 'small' | 'big' | 'big1'): string {
    // Navbar uses 'small' - show Synerex white logo; big/big1 for other views
    const filename = size === 'small' ? 'synerex_logo_white.png' :
                     size === 'big' ? 'logo-big.png' :
                     'logo-big1.png';
    return this.getImageUrl(filename);
  }

  /**
   * Get client logo URL
   * @param clientId - Client ID
   * @returns URL path to the client logo
   */
  getClientLogoUrl(clientId: number): string {
    return `/tracking-images/client_company_logo/${clientId}-client-logo`;
  }

  /**
   * Get navbar logo URL based on user role.
   * - Account Manager (7): assigned client's logo
   * - OEM (9, 10): OEM's client logo (from user.client)
   * - Synerex Master (8) or other: Synerex/whitelabel logo
   * @param user - User object with role and optional client (id or {id})
   * @returns URL path to the logo
   */
  getNavbarLogoUrl(user?: any): string {
    if (!user) {
      return this.getLogoUrl('small');
    }
    const role = Number(user.role);
    const clientId = user.client && (typeof user.client === 'object' ? user.client.id : user.client);
    // OEM users (9, 10): show OEM's white logo (dark navbar background)
    if (role === 9 || role === 10) {
      const orgId = (user.orgId || user.org_id || '').replace(/[^a-zA-Z0-9\-_]/g, '_');
      if (orgId) {
        return this.getImageUrl(`oem_logo/${orgId}_white`);
      }
      if (clientId) return this.getClientLogoUrl(clientId);
    }
    // Client roles (2, 3, 4, 5, 6) and Account Manager (7):
    // Show the client's own logo first; fall back to OEM's logo if no client logo is set.
    if (role <= 7 && role >= 2) {
      if (clientId) {
        return this.getClientLogoUrl(clientId);
      }
      const sponsorOrgId = (user.sponsorOrgId || '').replace(/[^a-zA-Z0-9\-_]/g, '_');
      if (sponsorOrgId) {
        return this.getImageUrl(`oem_logo/${sponsorOrgId}`);
      }
    }
    return this.getLogoUrl('small');
  }

  /**
   * Get the color (non-white) OEM navbar logo URL — used as fallback when white logo is missing.
   */
  getNavbarColorLogoUrl(user?: any): string {
    if (!user) return '';
    const role = Number(user.role);
    if (role === 9 || role === 10) {
      const orgId = (user.orgId || user.org_id || '').replace(/[^a-zA-Z0-9\-_]/g, '_');
      if (orgId) return this.getImageUrl(`oem_logo/${orgId}`);
    }
    // Client roles: fall back to the OEM's logo when the client has no logo uploaded
    if (role >= 2 && role <= 7) {
      const sponsorOrgId = ((user as any).sponsorOrgId || '').replace(/[^a-zA-Z0-9\-_]/g, '_');
      if (sponsorOrgId) return this.getImageUrl(`oem_logo/${sponsorOrgId}_white`);
    }
    return '';
  }

  /**
   * Get user logo URL
   * @param userId - User ID
   * @returns URL path to the user logo
   */
  getUserLogoUrl(userId: number): string {
    return `/tracking-images/user_company_logo/${userId}-user-logo`;
  }

  /**
   * Get the current branding identifier (for debugging)
   * @returns Branding identifier or null for defaults
   */
  getBranding(): string | null {
    return this.branding;
  }

  /**
   * Get the brand name (e.g., "Xeco" or "Synerex")
   * Caches the result after first call
   * @returns Observable<string> - The brand name
   */
  getBrandName(): Observable<string> {
    // Return cached value if available
    if (this.brandName !== null) {
      return of(this.brandName);
    }

    // If already loading, return the loading promise
    if (this.brandNameLoading) {
      // Wait a bit and try again
      return new Observable(observer => {
        setTimeout(() => {
          this.getBrandName().subscribe(observer);
        }, 100);
      });
    }

    // Fetch from API
    this.brandNameLoading = true;
    return this.http.get<{brandName: string}>('/api/whitelabel/brand-name')
      .pipe(
        map(response => {
          this.brandName = response.brandName || 'Synerex';
          this.brandNameLoading = false;
          return this.brandName;
        }),
        catchError(error => {
          this.brandNameLoading = false;
          // Default to "Synerex" on error
          this.brandName = 'Synerex';
          return of('Synerex');
        })
      );
  }

  /**
   * Get brand name synchronously (returns cached value or default)
   * Use this when you need the value immediately and can accept "Synerex" as fallback
   * @returns string - The brand name (may be cached value or "Synerex")
   */
  getBrandNameSync(): string {
    return this.brandName || 'Synerex';
  }
}
