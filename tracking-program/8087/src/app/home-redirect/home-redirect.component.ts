import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CurrentUserService } from '../shared/user/currentUser.service';

/**
 * Redirects OEM users (role 9, 10) to clients list; others to welcome.
 * Used as the default route when user lands on the app root.
 */
@Component({
  template: '',
  selector: 'app-home-redirect'
})
export class HomeRedirectComponent implements OnInit {
  constructor(
    private userService: CurrentUserService,
    private router: Router
  ) {}

  ngOnInit() {
    const role = this.userService.user?.role;
    if (role === 9 || role === 10) {
      this.router.navigate(['/xeco-administrator/client']);
    } else {
      this.router.navigate(['/welcome']);
    }
  }
}
