import {Component, Input} from '@angular/core';

@Component({
  template: `
    <!--<sd-subnav 
      [links]="[
        {title:'Savings',url:'/equipments/savings'},
        {title:'Switches',url:'/equipments/devices/list'},
        {title:'Alerts',url:'/switches/alerts', roles: [2, 8]},
        {title:'Commands',url:'/equipments/command/list', roles: [2, 8]},
        {title:'Schedule',url:'/equipments/schedule/list', roles: [2, 8]},


      ]"></sd-subnav>
    <router-outlet></router-outlet>-->
    <sd-subnav 
      [links]="[
        {title:'Devices',url:'/equipments/devices/list'},
        {title:'Schedule',url:'/equipments/schedule/list', roles: [2, 8]}
      ]"></sd-subnav>
    <router-outlet></router-outlet>
  `,
})
export class EquipmentsComponent {

	public switchType;

	constructor() {}

	 ngOnInit() {
	 }
}
