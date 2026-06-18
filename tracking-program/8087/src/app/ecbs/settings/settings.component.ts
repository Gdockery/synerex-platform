import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  project: any = null;
  role: number = 0;
  activeSection: 'account' | 'project' | 'analytics' | 'admin' | 'commercial' = 'account';

  utilityRate: number = 0.12;
  demandRate: number = 15;
  projectCost: number = 0;
  saved = false;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    this.project = this.userService.user?.selectedProject;
    this.role = Number(this.userService.user?.role ?? 0);
  }

  get isAdmin(): boolean { return this.role >= 8; }
  get isSuperAdmin(): boolean { return this.role >= 9; }
  get userName(): string { return (this.userService.user?.firstName || this.userService.user?.email || '—').toString(); }
  get lastLogin(): string { return 'This session'; }

  get roleName(): string {
    switch (this.role) {
      case 10: return 'Synerex Super Admin';
      case 9:  return 'Synerex Admin';
      case 8:  return 'OEM Administrator';
      case 7:  return 'Enterprise Administrator';
      case 6:  return 'Engineering';
      case 5:  return 'Operations';
      case 4:  return 'Installer';
      default: return 'Read Only';
    }
  }

  saveAnalyticsSettings() {
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 3000);
  }
}
