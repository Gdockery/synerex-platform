import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {SavingsReportService} from "./savingsReport.service";
import {BillAnalyticService} from "../billAnalytic/billAnalytic.service";

@Component({
  template: `
    <div class="content-box-white">
      <button class="default-button green-button" [routerLink]="['/billing']">Back to savings report list</button>
      <savings-report-form *ngIf="items" [report]="savingsReport" [items]="items" (submitEvent)="submit($event)"></savings-report-form>
    </div>
  `
})
export class CreateSavingsReportComponent implements OnInit {

  public reportId;

  public items;

  public savingsReport;

  constructor(private savingsReportService: SavingsReportService,
              private route: ActivatedRoute,
              private router: Router,
              private billAnalyticService: BillAnalyticService) {
    //this.reportId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.billAnalyticService.getAnalytic().subscribe((analytic:any) => {
      this.items = analytic.lineItems;
    });

    /*if(!this.reportId) {
      this.billAnalyticService.getAnalytic().subscribe((analytic:any) => {
        this.items = analytic.lineItems;
      });
    } else {
      this.savingsReportService.get(this.reportId).subscribe((report:any) => {
        this.savingsReport = report.response;
        this.items = report.response.lineItems;
      });
    } */
  }

  submit(formData) {
    this.savingsReportService.create(formData).subscribe(response => {
      this.router.navigate(['billing/savings-report/list']);
    }, error => {
      if(error.code == 409) {
        alert('A savings report for this time period already exists, please delete existing savings report before creating another.');
      }
    });

    /*if(this.savingsReport) {
      this.savingsReportService.update(this.savingsReport.id, formData);
    } else {
      this.savingsReportService.create(formData).subscribe(response => {
        this.router.navigate(['billing/savings-report/list']);
      }, error => {
        if(error.code == 409) {
          alert('A savings report for this time period already exists, please delete existing savings report before creating another.');
        }
      });
    } */
  }

}
