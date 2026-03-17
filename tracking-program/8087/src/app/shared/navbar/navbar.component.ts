import {Component, EventEmitter, Output} from '@angular/core';
import {CurrentUserService} from "../user/currentUser.service";
import {WhitelabelService} from "../services/whitelabel.service";

@Component({
  selector: 'sd-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {

  // An event that this component emits when `_toggleSidebar()` is called.
  // (Basically a way of informing parent components that the navbar expanded/collapsed.)
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();

  public logoUrl: string;
  /** When true, apply invert filter (for Synerex white logo). Client/OEM logos use original colors. */
  public logoUseInvert: boolean;
  public myAccountUrl: string;
  /** Synerex website home URL - for "Back to" link. */
  public websiteHomeUrl: string;
  /** Fallback text shown when OEM logo image fails to load. */
  public logoFallbackText: string = '';
  /** True after the logo image fires an error event. */
  public logoFailed: boolean = false;

  constructor(private userService: CurrentUserService, private whitelabelService: WhitelabelService) {
    const user = this.userService.user;
    this.logoUrl = this.whitelabelService.getNavbarLogoUrl(user);
    const role = Number(user?.role);
    const clientId = user?.client && (typeof user.client === 'object' ? user.client.id : user.client);
    // Invert (white logo) only for Synerex/fallback. Client and OEM logos use original colors.
    this.logoUseInvert = !((role >= 2 && role <= 7 && clientId) || role === 9 || role === 10);
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
    this.logoFailed = true;
  }

  /** Website My Account page URL (when in platform flow). Avoids double /my-account. */
  get myAccountPageUrl(): string {
    if (!this.myAccountUrl) return '';
    return this.myAccountUrl.endsWith('/my-account') ? this.myAccountUrl : this.myAccountUrl + '/my-account';
  }

  _toggleSidebar() {
    this.notify.emit(true);
  }

  logout() {
    this.userService.logout();
  }

}


