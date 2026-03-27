import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Redirects all users to the Welcome page when they land on the app root.
 * Used as the default route when user lands on the app root.
 */
@Component({
  template: '',
  selector: 'app-home-redirect'
})
export class HomeRedirectComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    this.router.navigate(['/welcome']);
  }
}
