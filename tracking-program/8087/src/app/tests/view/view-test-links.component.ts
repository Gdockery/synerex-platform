import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'view-test-links',
  template: `
    <button class="default-button green-button" [routerLink]="['/tests/view/'+id]">View Report</button>
    <button class="default-button green-button" [routerLink]="['/tests/view/'+id+'/data']">View Data</button>
    <button class="default-button green-button" [routerLink]="['/tests/list']">Back to Test List</button>
  `
})
export class ViewTestLinksComponent implements OnInit {

  private id;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.id = + params['id'];
    });
  }

}
