import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from "@angular/router";
import {BillAnalyticService} from "./billAnalytic.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
@Component({
  template: `
    <div class="content-box-white">
      <button class="default-button green-button" [routerLink]="['/billing/bill-analytic/list']">Back to bill analytic list</button>
    </div>
    <bill-analytic-form *ngIf="step==0" 
                        [billAnalytic]="analytic" 
                        [billIndex]="index"
                        (submitEvent)="submitStep1($event)"></bill-analytic-form>
    

  `
})
export class CreateBillAnalyticComponent implements OnInit {

  /**
   * Which step of bill analytic user is on (bill analytic/identify equipment)
   * @type {number}
   */
  private step = 0;

  private analytic;
  private equipment;
  private index;

  constructor(private billAnalyticService: BillAnalyticService, private router: Router, private route: ActivatedRoute, private userService: CurrentUserService) { 
    this.index = route.snapshot.params['index']; }

  ngOnInit() {
    this.billAnalyticService.getAnalytic().subscribe(billAnalytic => {
      this.analytic = billAnalytic;

    });
    this.billAnalyticService.getEquipment().subscribe(equipmentInfo => {
      this.equipment = equipmentInfo;

    });
  }

  submitStep1(billAnalytic) {
      this.analytic = billAnalytic;
      if (this.index) {
        this.router.navigate(['/billing/bill-analytic/equipments', billAnalytic.meterBills[this.index].meterNumber]);
      } else {
        this.router.navigate(['/billing/bill-analytic/equipments', billAnalytic.meterNumber]);
      }
  }

  submitStep2(billAnalytic) {
    if (this.analytic.meterBills.length() == this.userService.user.selectedProject.reportFields.numberOfMeters) {
      this.router.navigate(['/billing/bill-analytic/equipments']);
    }
  }
}
