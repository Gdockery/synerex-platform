import {Component, EventEmitter, OnInit, OnDestroy, Output} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {CurrentUserService} from "../user/currentUser.service";
import {WhitelabelService} from "../services/whitelabel.service";
import {ApiRequestService} from "../../api/api-request.service";

@Component({
  selector: 'sd-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {

  // An event that this component emits when `_toggleSidebar()` is called.
  // (Basically a way of informing parent components that the navbar expanded/collapsed.)
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();

  public logoUrl: string;
  /** Color logo URL used as fallback when white logo is missing (OEM only). */
  public logoColorFallbackUrl: string = '';
  /** True when white logo failed but color logo is being tried. */
  public logoTryingColorFallback: boolean = false;
  /** When true, apply invert filter to make logo white on dark sidebar (Synerex and OEM users). */
  public logoUseInvert: boolean;
  public myAccountUrl: string;
  /** Synerex website home URL - for "Back to" link. */
  public websiteHomeUrl: string;
  /** Fallback text shown when OEM logo image fails to load. */
  public logoFallbackText: string = '';
  /** True after the logo image fires an error event. */
  public logoFailed: boolean = false;

  cbiScore: number = 0;
  private _routerSub: Subscription;

  constructor(private userService: CurrentUserService, private whitelabelService: WhitelabelService, private api: ApiRequestService, private router: Router) {
    const user = this.userService.user;
    this.logoUrl = this.whitelabelService.getNavbarLogoUrl(user);
    this.logoColorFallbackUrl = this.whitelabelService.getNavbarColorLogoUrl(user);
    const role = Number(user?.role);
    const clientId = user?.client && (typeof user.client === 'object' ? user.client.id : user.client);
    // Invert filter for Synerex logo and OEM logos (dark sidebar → white appearance).
    // Client's own uploaded logos use original colors; the OEM fallback logo is inverted
    // (handled dynamically in onLogoError via logoUseInvert reset).
    this.logoUseInvert = !((role >= 2 && role <= 7 && clientId));
    const bootstrap = (typeof window !== 'undefined' && window['BOOTSTRAP_DATA']) || {};
    this.myAccountUrl = (bootstrap['myAccountUrl'] || '').replace(/\/$/, '');
    this.websiteHomeUrl = (bootstrap['websiteHomeUrl'] || '').replace(/\/$/, '');
    // Prepare fallback text from bootstrap OEM display name or brand name
    const oemName = bootstrap['oemDisplayName'] || '';
    if (oemName) {
      this.logoFallbackText = oemName;
    }
  }

  onLogoError() {
    if (!this.logoTryingColorFallback && this.logoColorFallbackUrl) {
      // Client logo failed — try OEM fallback logo; apply invert so it appears white
      this.logoTryingColorFallback = true;
      this.logoUrl = this.logoColorFallbackUrl;
      this.logoUseInvert = true;
    } else {
      // Fallback also failed (or no fallback) — show text/Synerex logo
      this.logoFailed = true;
    }
  }

  /** Website My Account page URL (when in platform flow). Avoids double /my-account. */
  get myAccountPageUrl(): string {
    if (!this.myAccountUrl) return '';
    // Use the browser's current origin so the link works from any IP/port
    // (avoids server-side localhost URLs breaking remote users).
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin
      : this.myAccountUrl;
    return origin + '/my-account';
  }

  ngOnInit() {
    this.refreshCbi();
    // Re-fetch CBI whenever the route changes so project switches are reflected
    this._routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.refreshCbi());
  }

  ngOnDestroy() {
    if (this._routerSub) { this._routerSub.unsubscribe(); }
  }

  refreshCbi() {
    const pid = this.userService.user?.selectedProject?.id;
    if (!pid) return;
    this.api.get(`/api/current-balance/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.cbiScore = Math.round(r?.score || r?.cbi_score || 0); },
      error: () => {}
    });
  }

  _toggleSidebar() {
    this.notify.emit(true);
  }

  logout() {
    this.userService.logout();
  }

}


