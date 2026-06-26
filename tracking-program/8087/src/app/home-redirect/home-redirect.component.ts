import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG, IAppConfig } from '../config/app.config';

/**
 * Redirects users to their home based on role.
 * Role 14 (Project Manager) goes directly to the deployment app.
 * All other roles go to the Welcome page.
 */
@Component({
  template: '',
  selector: 'app-home-redirect'
})
export class HomeRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    @Inject(APP_CONFIG) private config: IAppConfig
  ) {}

  ngOnInit() {
    const role = Number((this.config.locals && this.config.locals.user && this.config.locals.user.role) || 0);
    if (role === 14) {
      this.router.navigate(['/ecbs/deployment']);
    } else {
      this.router.navigate(['/ecbs/energy-dashboard']);
    }
  }
}
