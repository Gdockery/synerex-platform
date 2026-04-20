import {Component, Input} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {SwitchesService} from "./switches.service";

@Component({
  template: `
	<!--<sd-subnav 
      [links]="[
        {title:'Switches',url:'/switches/devices/list'},
        {title:'Alerts',url:'/switches/alerts', roles: [2, 8, 9, 10]},
        {title:'Commands',url:'/switches/command/list', roles: [2, 8, 9, 10]},
        {title:'Schedule',url:'/switches/schedule/list', roles: [2, 8, 9, 10]}
      ]"></sd-subnav>
    <router-outlet></router-outlet>-->
  <sd-subnav 
      [links]="[
        {title:'Switches',url:'/switches/devices/list'},
        {title:'Commands',url:'/switches/command/list', roles: [2, 8, 9, 10]},
        {title:'Schedule',url:'/switches/schedule/list', roles: [2, 8, 9, 10]}
      ]"></sd-subnav>
    <router-outlet></router-outlet>
  `,
})
export class SwitchesComponent {

	public switchType;

	constructor(private route: ActivatedRoute, private switchesService: SwitchesService) {}
}
