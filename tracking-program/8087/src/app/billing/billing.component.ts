import {Component, OnInit} from '@angular/core';

@Component({
  template: `
    <router-outlet></router-outlet>
  `
})
export class BillingComponent implements OnInit {

  constructor() {
   /* route.params.subscribe(val => {
      // put the code from `ngOnInit` here
    });*/
  }

  ngOnInit() {
  }
}
