import {Component, Input, OnInit} from '@angular/core';
import {SubNavService} from "./subNav.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";

let _ = require('lodash');

@Component({
  selector: 'sd-subnav',
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-6">
          <h4>{{subnavService.title}}</h4>
        </div>
        <div class="col-md-6">
          <ul>
            <li *ngFor="let link of links;">
              <a [routerLink]="[link.url]" [routerLinkActive]="['router-link-active']">{{link.title}}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

  `,
  styleUrls: ['./subNav.component.scss'],
})
export class SubNavComponent implements OnInit{

  @Input()
  links: Array<any> [];

  public subnavService: SubNavService;
  private userService: CurrentUserService;

  constructor(subnavService: SubNavService, userService: CurrentUserService) {
    this.subnavService = subnavService;
    this.userService = userService;
  }

  ngOnInit() {
    let userRole = this.userService.user.role;

    this.links = _.filter(this.links, function(link) {
      if (!link.hasOwnProperty('roles') ||
        (link.hasOwnProperty('roles') && link.roles.includes(userRole))) {
        return link;
      }
    });
  }

}


