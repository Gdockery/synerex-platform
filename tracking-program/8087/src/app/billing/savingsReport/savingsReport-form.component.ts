import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IMyOptions} from "mydatepicker";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {BillAnalyticService} from "../billAnalytic/billAnalytic.service";
import {DateTimeValidators} from "../../shared/validation/dateTime.validators";
import {AdditionalValidators} from "../../shared/validation/additional.validator";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";
/*import {DropdownModule} from "primeng/primeng";
import {InputTextModule} from "primeng/primeng";*/

let _ = require('lodash');

@Component({
  selector: 'savings-report-form',
  template: `
    <div *ngIf="!selectedTest" style="font-size: 20px; ">
      Please select a test first to enter bills.
    </div>
    <form [formGroup]="form" [hidden]="!selectedTest" (ngSubmit)="submit(form)">
      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
            <label for="fromDate">First day of billing period</label>
            <my-date-picker
              name="fromDate"
              id="fromDate"
              [options]="datePickerOptions"
              (inputFieldChanged)="updateConsolidatedData()"
              formControlName="fromDate">
            </my-date-picker>
            <div *ngIf="form.controls.fromDate.hasError('invalidBeforeDateField') && (form.controls.fromDate.dirty || form.controls.fromDate.touched)" class="alert alert-danger">
              From date must be before to date.
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label for="toDate">Last day of billing period</label>
            <my-date-picker
              name="toDate"
              id="toDate"
              (inputFieldChanged)="updateConsolidatedData()"
              [options]="datePickerOptions"
              formControlName="toDate">
            </my-date-picker>
            <div *ngIf="form.controls.toDate.hasError('invalidAfterDateField') && (form.controls.toDate.dirty || form.controls.toDate.touched)" class="alert alert-danger">
              To date must be after from date.
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
            <div class="form-group">
              <label for="multiplier">kwh Multiplier</label><br/>
              <p-dropdown id="selectedMultiplier" name="selectedMultiplier" [options]="multiplier"
                          formControlName="selectedMultiplier"
                          (onChange)="updateConsolidatedData()"
                          [(ngModel)]="selectedMultiplier"></p-dropdown>
            </div>
        </div>
        
      </div>

      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
                <label>Total Bill</label><br/>
                <input type="text" (onChange)="updateConsolidatedData()" pInputText id="totalBill" name="totalBill" formControlName="totalBill" [(ngModel)]="totalBill" />
	        </div>

	</div>
        <div class="col-md-3">
          <div class="form-group">

                <label for="pfc">Power Factor Credit </label><br/>
                <input type="number" pInputText id="pfc" name="pfc" formControlName="pfc" max="0" [(ngModel)]="pfc" required (onChange)="validatePfc()" />
		<br /><font *ngIf="!pfcError" size="-1">(Must be 0 or negative)</font>
          <div *ngIf="pfcError"class="alert">
            <strong>Power Factor Credit must be 0 or negative</strong>
          </div>
	  </div>
	</div>

        <div class="col-md-3">
            <div class="form-group">
              <label for="multiplier">kwPeak Multiplier</label><br/>
              <p-dropdown id="selectedMultiplier2" name="selectedMultiplier2" [options]="multiplier"
                          formControlName="selectedMultiplier2"
                          (onChange)="updateConsolidatedData()"
                          [(ngModel)]="selectedMultiplier2"></p-dropdown>
            </div>
	</div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <h3>Xeco Data for this Period <small>(savings % based on most recent test)</small></h3>
        </div>
        <div class="col-md-6">
          <table style="width:100%;">
            <tr>
              <td>
                <label>Usage (KWH)</label><br/>
                {{(aggregateData?.kwh * selectedMultiplier | number : '1.0-0') || '--'}}
              </td>
              <td>
                <label>KW Peak</label><br/>
                {{(aggregateData?.kvaPeak * selectedMultiplier2 | number : '1.0-0') || '--'}}
              </td>
              <td>
                <label>KWH Savings</label><br/>
                {{savings.kwh * 100 | number : '1.2-2'}}%
              </td>
              <td>
                <label>KW Peak Savings</label><br/>
                {{savings.kwp * 100 | number : '1.2-2'}}%
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <h3>Line Items</h3>
          <line-item-form [items]="items" [itemArray]="form.get('lineItems')" [projectSavings]="true"></line-item-form>
        </div>
        <div class="col-md-12 text-right" style="padding-top: 22px">
          <button class="default-button green-button" type="button" [routerLink]="['/billing']">Cancel</button>
          <button class="default-button green-button" type="submit">Submit</button>
        </div>
      </div>
    </form>
    <style>
      .alert {
          padding: 5px;
          background-color: #f44336;
          color: white;
      }

</style>
  `
})
export class SavingsReportFormComponent implements OnInit {

  @Input() public items;
  @Input() public report:any ;

  @Output() submitEvent = new EventEmitter<any>();

  public selectedTest;
  public form;
  public savings;
  public aggregateData;
  public selectedMultiplier = 1.00;
  public selectedMultiplier2 = 1.00;
  public usageKWH;
  public kwPeak;
  public kwhSavings;
  public kwPeakSavings;
  public totalBill;
  public pfc;
  public pfcError = false;
  public pfcErrorMsg;
  public costTotalError = false;

  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  public multiplier = [
                      {label: '0.91', value: 0.91},
                      {label: '0.92', value: 0.92},
                      {label: '0.93', value: 0.93},
                      {label: '0.94', value: 0.94},
                      {label: '0.95', value: 0.95},
                      {label: '0.96', value: 0.96},
                      {label: '0.97', value: 0.97},
                      {label: '0.98', value: 0.98},
                      {label: '0.99', value: 0.99}, 
                      {label: 'None', value: 1.00},
                      {label: '1.01', value: 1.01},
                      {label: '1.02', value: 1.02},
                      {label: '1.03', value: 1.03},
                      {label: '1.04', value: 1.04},
                      {label: '1.05', value: 1.05},
                      {label: '1.06', value: 1.06},
                      {label: '1.07', value: 1.07},
                      {label: '1.08', value: 1.08},
                      {label: '1.09', value: 1.09}];

  constructor(private formBuilder: FormBuilder, private currentUserService: CurrentUserService, private deviceService: DeviceService, private timeHelpers: TimeHelpers) {
    this.savings = currentUserService.user.selectedProject.savings;
  }

  ngOnInit() {
    this.selectedTest = this.currentUserService.user.selectedProject.selectedTest;
    this.initializeForm();
    //this.updateConsolidatedData();
  }

  validatePfc () {
    if (this.form.value.pfc > 0) {
      this.pfcError = true;
    } 
  }
  

  updateConsolidatedData() {
    if(this.form.value.fromDate.date && this.form.value.toDate.date) {
      this.deviceService.getConsolidatedDeviceData(
        this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).format('x'),
        this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.toDate.date).format('x')
      ).subscribe(data => {
        this.selectedMultiplier = parseFloat(this.form.value.selectedMultiplier);
        this.selectedMultiplier2 = parseFloat(this.form.value.selectedMultiplier2);
    		if (isNaN(this.form.value.totalBill)) {this.form.value.totalBill = 0;}
        this.totalBill = parseFloat(this.form.value.totalBill);
    		if (isNaN(this.form.value.pfc)) {this.form.value.pfc = 0;}
        this.pfc = parseFloat(this.form.value.pfc);
        this.aggregateData = data.response;

        this.usageKWH = '--';
        this.kwPeak = '--';

        if(this.aggregateData.hasOwnProperty('kwh') && this.aggregateData.hasOwnProperty('kwPeak')) {
          this.usageKWH = _.round(this.aggregateData.kwh * this.selectedMultiplier);
          this.kwPeak = _.round(this.aggregateData.kvaPeak * this.selectedMultiplier2);

      	  /*this.form.get('lineItems').controls.forEach(lineItem => {
      			lineItem.controls.usageKWH.setValue(this.usageKWH, {onlySelf: true});
      			lineItem.controls.kwPeak.setValue(this.kwPeak, {onlySelf: true});
    		  });*/
        
          this.kwhSavings = _.round(this.savings.kwh * 100, 2);
          this.kwPeakSavings = _.round(this.savings.kwp * 100, 2); 
        }
      });
    }
  }

  initializeForm() {
    this.form = this.formBuilder.group({
      lineItems: this.formBuilder.array([]),
      fromDate: ['', [Validators.required, DateTimeValidators.beforeDateField('toDate')]],
      toDate: ['', [Validators.required, DateTimeValidators.afterDateField('fromDate')]],
      selectedMultiplier: [''],
      selectedMultiplier2: [''],
      totalBill: '',
      pfc: '',
    });
    if(this.report) {
      this.form.patchValue({
        month: this.report.month,
        year: this.report.year
      })
    }
  }

  submit() {
    if(this.form.valid) {
      let formData = {
        reportData: {
          lineItems: this.form.get('lineItems').value,
          total: this.form.get('lineItems').value.reduce((sum, item) => sum+=parseInt(item.cost), 0),
          totalBeforeXeco: this.form.get('lineItems').value.reduce((sum, item) => sum+((+item.cost) + (+item.savings)), 0),
          usageKWH: this.usageKWH,
          kwPeak: this.kwPeak,
          kwhSavings: this.kwhSavings,
          kwPeakSavings: this.kwPeakSavings,
	        totalBill: this.totalBill,
	        pfc: this.pfc,
          kwhMultiplier: this.selectedMultiplier,
          kwMultiplier: this.selectedMultiplier2,
        },
        month: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).format('YYYY-MM-DD'),
        fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).format('x'),
        toDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.toDate.date).format('x'),
      };
      this.submitEvent.emit(formData);
    } else {
        for (let i in this.form.controls) {
          this.form.controls[i].markAsDirty();
        }
        this.form.get('lineItems').controls.forEach(lineItem => {
        for (let i in lineItem.controls) {
          lineItem.controls[i].markAsDirty();
        }
      });
    }
  }
}
