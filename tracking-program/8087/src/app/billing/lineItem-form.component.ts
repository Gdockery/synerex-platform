import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from "@angular/forms";
import { CustomValidators } from "ng2-validation";
import { CurrentUserService } from "../shared/user/currentUser.service";
import { AdditionalValidators } from "../shared/validation/additional.validator";

@Component({
  selector: 'line-item-form',
  styles: [`
    table {
      width: 100%;
    }
    td {
      padding: 0 10px 0 10px;
    }
  `],
  template: `
    <table style="width:100%">
      <tr *ngFor="let lineItem of itemArray.controls; let i=index" [formGroup]="lineItem">
        <td>
          <div class="form-group">
            <label for="name">Line item #{{i + 1}} label</label>
            <input type="text" class="form-control" id="name" name="name" formControlName="name"  placeholder="Charge">
          </div>
        </td>
        <td>
          <div class="form-group">
            <div class="form-group">
              <label for="cost">Cost</label><br/>
              <input type="text" class="form-control" id="cost" name="cost" formControlName="cost"  placeholder="Enter Cost">
            </div>
          </div>
        </td>
        <td>
          <div class="form-group">
            <label for="type">KW KWH or M</label>
            <select formControlName="type" class="form-control">
              <option *ngFor="let type of keys(ELECTRICITY_CHARGE_TYPES)" value="{{type}}">{{type}}</option>
            </select>
          </div>
        </td>
        <td>
          <div class="form-group">
            <label for="tierHours">Tier Hours</label>
            <select formControlName="tierHours" class="form-control"> 
              <option *ngFor="let tierHours of keys(TIER_HOURS)" value="{{tierHours}}">{{tierHours}}</option>
            </select>
          </div>
        </td>
        <td>
          <div class="form-group">
            <label for="meterReading">Meter reading from bill</label>
            <input type="text" class="form-control" id="meterReading" name="meterReading" formControlName="meterReading"  placeholder="Enter Meter Reading">
          </div> 
        </td>
        <td>
          <div class="form-group">
            <label for="billingRate">Billing rate/unit</label>
            <input type="text" class="form-control" id="billingRate" name="billingRate" formControlName="billingRate"  placeholder="{{getBillingRate(lineItem) | round:2}}">
        
          </div>
        </td>
        
        <td>
          <div class="form-group">
            <label style="top:0;">Estimated Xeco savings</label><br />
            {{getSavingsAmount(lineItem) | projectCurrency:"symbol":'1.2-2'}}
          </div>
        </td>
        
        <td>
          <div class="form-group">
            <label for="">&nbsp;</label><br />
            <button type="button" class="red-button round-button" style="width:40px;height:40px;" (click)="removeLineItem(i)">
              <span class="ss-hyphen" style="vertical-align:middle;"></span>
            </button>
          </div>
        </td>
      </tr>      
    </table>
    <div class="text-center">
      <button type="button" class="green-button round-button" style="width:40px;height:40px;" (click)="addLineItem()">
        <span class="ss-plus" style="vertical-align:middle;"></span>
      </button>
    </div>
  `
})
export class LineItemFormComponent implements OnInit {

  @Input() displayAggregates = true;
  @Input() itemArray: FormArray;
  @Input() items;

  //Whether savings amounts should be pulled from the active project.
  @Input() projectSavings;

  private keys = Object.keys;
  public savingsRates;
  public loadfactor;
  public peak;
  public avg;

  constructor(private formBuilder: FormBuilder, @Inject('ELECTRICITY_CHARGE_TYPES') private ELECTRICITY_CHARGE_TYPES, @Inject('TIER_HOURS') private TIER_HOURS, private currentUserService: CurrentUserService) {
    this.savingsRates = currentUserService.user.selectedProject.savings;
	console.log("this.savingsRates: " , this.savingsRates);
    if (currentUserService.user.selectedProject.electricBillAnalysis == null || currentUserService.user.selectedProject.electricBillAnalysis.kwPeak == null) {
	this.peak = 295;
	this.avg = 230;
	this.loadfactor = (230/295);
    } else {
    	this.peak = currentUserService.user.selectedProject.electricBillAnalysis.kwPeak;
        this.avg = (currentUserService.user.selectedProject.electricBillAnalysis.totalKwh/(24*currentUserService.user.selectedProject.electricBillAnalysis.daysBilled));
        this.loadfactor = ((currentUserService.user.selectedProject.electricBillAnalysis.totalKwh/(24*currentUserService.user.selectedProject.electricBillAnalysis.daysBilled)) / currentUserService.user.selectedProject.electricBillAnalysis.kwPeak);
    }
	console.log("this.peak: " , this.peak);
	console.log("this.avg: " , this.avg);

  }

  ngOnInit() {
    if (this.items) {
      this.items.forEach(item => {
        this.itemArray.push(this.getLineItem(item));
      });
    } else {
      this.addLineItem();
    }
  }

  getTierHours(lineItem) {
    if (lineItem.value.cost && lineItem.value.meterReading) {
      return lineItem.value.tierHours;
    } else {
      return 0;
    }

  }

  getBillingRate (lineItem) {
    if (!isNaN(lineItem.value.cost) && !isNaN(lineItem.value.meterReading)) {
      lineItem.controls.billingRate.setValue(Math.round(lineItem.value.cost / lineItem.value.meterReading * 100000) / 100000);
    }
  }

  getSavingsAmount(lineItem) {
    let savingsAmount;
    let savCalc;

    let type = (lineItem.value.type || '').toLowerCase()

    if (this.ELECTRICITY_CHARGE_TYPES[type]) {
      
   console.log("avg: " , this.avg);
    console.log("peak: " , this.peak);
    console.log("loadfactor: " , this.loadfactor);
      //if (this.loadfactor >= .7)
	savCalc = .3225 - (((.9-this.loadfactor)*100)*.0031011);
      //else
	//savCalc = .32 - (20*.0008) - (((.7-this.loadfactor)*100)*.004);
    console.log("savCalc: " , savCalc);
    savingsAmount = this.projectSavings ? type != "m" ? lineItem.value.cost * this.projectSavings : 0 : lineItem.value.cost * (1000-(this.loadfactor*1000))*(savCalc)/1000;

    console.log("savingsAmount: " , savingsAmount);
      if (isNaN(savingsAmount)) { savingsAmount = 0; }
      lineItem.controls.savings.setValue(Math.round(savingsAmount*100)/100);
      return lineItem.value.savings;
    } else {
      return 0;
    }
  }

  addLineItem() {
    this.itemArray.push(this.getLineItem({
      type: Object.keys(this.ELECTRICITY_CHARGE_TYPES)[0]
    }));
  }

  removeLineItem(index) {
    this.itemArray.removeAt(index);
  }

  getLineItem(item: any = {}) {
    return this.formBuilder.group({
      name: new FormControl(item.name),
      tierHours: new FormControl(item.tierHours),
      type: new FormControl(item.type),
      cost: new FormControl(item.cost, [CustomValidators.number]),
      billingRate: new FormControl(item.billingRate, [CustomValidators.number]),
      meterReading: new FormControl(item.meterReading, [CustomValidators.number]),
      savings: new FormControl(0, [CustomValidators.number]),
    });
  }
}
