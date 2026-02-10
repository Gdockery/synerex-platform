import {Component} from '@angular/core';

@Component({
  template: `
    <sd-subnav
      [links]="[
      {title:'Devices',url:'/electricity-meters/devices'},
      {title:'Alerts',url:'/electricity-meters/alerts', roles: [2, 8]},
      {title:'CSV Data',url:'/electricity-meters/csv-data'},
      {title:'Charting',url:'/electricity-meters/charting'}
    ]"></sd-subnav>
    <router-outlet></router-outlet>
    <!--<sd-subnav
      [links]="[
      {title:'Devices',url:'/electricity-meters/devices'},
      {title:'CSV Data',url:'/electricity-meters/csv-data'},
      {title:'Charting',url:'/electricity-meters/charting'}
    ]"></sd-subnav>
    <router-outlet></router-outlet>-->
  `,
})
export class MetersComponent {
}
