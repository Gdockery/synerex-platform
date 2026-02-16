import {Component, OnInit} from '@angular/core';
import {CurrentUserService} from "../shared/user/currentUser.service";

@Component({
  template: `
    <sd-subnav *ngIf= "userService.user.selectedProject"
      [links]="[
        {title:'Overview',url:'/project/overview'},
        {title:'Power Quality',url:'/project/power-quality'},
        {title:'EM&V Report',url:'/project/emv-baseline'}
      ]"></sd-subnav>
    <router-outlet></router-outlet>
  `
})
export class ProjectComponent implements OnInit {

  constructor(private userService: CurrentUserService) {

  }

  ngOnInit() {
  }
}