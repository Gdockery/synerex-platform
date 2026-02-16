import {Component, EventEmitter, Output} from '@angular/core';
import {CurrentUserService} from "../user/currentUser.service";
import {WhitelabelService} from "../services/whitelabel.service";

@Component({
  selector: 'sd-navbar',
  templateUrl: 'navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {

  // An event that this component emits when `_toggleSidebar()` is called.
  // (Basically a way of informing parent components that the navbar expanded/collapsed.)
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();

  public logoUrl: string;
  public myAccountUrl: string;
  /** Synerex website home URL - for "Back to" link. */
  public websiteHomeUrl: string;

  constructor(private userService: CurrentUserService, private whitelabelService: WhitelabelService) {
    this.logoUrl = this.whitelabelService.getLogoUrl('small');
    const bootstrap = (typeof window !== 'undefined' && window['BOOTSTRAP_DATA']) || {};
    this.myAccountUrl = (bootstrap['myAccountUrl'] || '').replace(/\/$/, '');
    this.websiteHomeUrl = (bootstrap['websiteHomeUrl'] || '').replace(/\/$/, '');
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


