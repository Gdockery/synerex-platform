import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from "@angular/router";
import {BillAnalyticService} from "./billAnalytic.service";

@Component({
  template: `
    <div class="content-box-white">
      <button class="default-button green-button" [routerLink]="['/billing/bill-analytic/list']">Back to bill analytic list</button>
    </div>
    
    <equipment-form *ngIf="equipment && analytic"
      [analytic]="analytic" 
      [equipment]="equipment"
      [meterNumber]="meterNumber"
      (backEvent)="back()" 
      (submitEvent)="submitStep2($event)"></equipment-form>
  `
})
export class ViewEditEquipmentsComponent implements OnInit {

  private analytic;
  private equipment;
  private meterNumber;

  constructor(private billAnalyticService: BillAnalyticService, private router: Router, private route: ActivatedRoute) { 
    this.meterNumber = route.snapshot.params['meterNumber'] ;
   }

  ngOnInit() {
    this.billAnalyticService.getAnalytic().subscribe(billAnalytic => {
      this.analytic = billAnalytic;
      /*if (this.meterNumber) {
        this.analytic = billAnalytic.meterBills.filter(bill => { return bill.meterNumber === this.meterNumber});
      } else {
        this.analytic = billAnalytic;
      }*/
    });
    this.billAnalyticService.getEquipment().subscribe(equipment => {
      this.equipment = equipment;
   
      /*if (this.meterNumber) {
        this.equipment = equipment.meterEquipments.filter(meter => { return meter.meterNumber === this.meterNumber});
      } else {
        this.equipment = equipment;
      }*/
    });
  }

  back() {
    this.router.navigate(['/billing/bill-analytic/list']);
  }

  submitStep2(identifiedEquipment) {
    this.billAnalyticService.updateEquipment(identifiedEquipment).subscribe(result => {
      this.equipment = identifiedEquipment;
      this.router.navigate(['/billing/bill-analytic/list']);
    });
  }
}
