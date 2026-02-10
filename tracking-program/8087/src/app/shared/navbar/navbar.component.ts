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

  constructor(private userService: CurrentUserService, private whitelabelService: WhitelabelService) {
    this.logoUrl = this.whitelabelService.getLogoUrl('small');
  }

  _toggleSidebar() {
    this.notify.emit(true);
  }

  logout() {
    this.userService.logout();
  }

}


