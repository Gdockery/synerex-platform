import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

import {TestSavingsService} from "../test-savings.service";

@Component({
  selector: 'view-test-savings',
  template: `
    
  `
})
export class ViewTestSavingsComponent implements OnInit {

  protected savingsData;

  constructor(private testSavingsService: TestSavingsService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.testSavingsService.getSavings(+params['id']).subscribe(data => {
        this.savingsData = data;
      });
    });
  }

}
