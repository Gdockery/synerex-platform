import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  project: any = null;
  role: number = 0;

  constructor(private userService: CurrentUserService) {}

  ngOnInit() {
    this.project = this.userService.user?.selectedProject;
    this.role = Number(this.userService.user?.role ?? 0);
  }

  get isAdmin(): boolean { return this.role >= 8; }
}
