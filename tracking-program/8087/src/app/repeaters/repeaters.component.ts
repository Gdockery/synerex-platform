import {Component} from '@angular/core';

@Component({
  template: `
    <!--<sd-subnav
      [links]="[
        {title:'Devices',url:'/repeaters/devices'},
        {title:'Alerts',url:'/repeaters/alerts', roles: [2, 8]}
      ]"></sd-subnav>
    <router-outlet></router-outlet>-->
    <sd-subnav
      [links]="[
        {title:'Devices',url:'/repeaters/devices'},
        {title:'Alerts',url:'/repeaters/alerts', roles: [2, 8]}
      ]"></sd-subnav>
    <router-outlet></router-outlet>
  `,
})
export class RepeatersComponent {
}
