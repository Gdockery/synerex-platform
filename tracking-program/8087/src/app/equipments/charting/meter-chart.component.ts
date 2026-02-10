import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { IMyOptions } from 'mydatepicker';
import {MeterChartService} from "./meter-chart.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {FormBuilder} from "@angular/forms";
import {DateTimeValidators} from "../../shared/validation/dateTime.validators";

@Component({
  selector: 'meter-chart',
  template: `
    <div class="container-fluid">
      <div class="col-md-5">
        <h3>{{title}}</h3>
      </div>
      <form [formGroup]="dateForm" novalidate>
        <div class="col-md-2">
          <div class="form-group">
            <label for="dateTo">From</label>
            <my-date-picker 
              name="mydate"
              [options]="datePickerOptions"
              formControlName="dateFrom">
            </my-date-picker>
            <div *ngIf="dateForm.controls.dateFrom.hasError('invalidBeforeDateField') && (dateForm.controls.dateFrom.dirty || dateForm.controls.dateFrom.touched)" class="alert alert-danger">
              From date must be before to date.
            </div>
          </div>
        </div>
        <div class="col-md-2">
          <div class="form-group">
            <label for="dateTo">To</label>
            <my-date-picker 
              name="dateTo"
              [options]="datePickerOptions"
              formControlName="dateTo">
            </my-date-picker>
            <div *ngIf="dateForm.controls.dateTo.hasError('invalidAfterDateField') && (dateForm.controls.dateTo.dirty || dateForm.controls.dateTo.touched)" class="alert alert-danger">
              A date must be provided.
            </div>
          </div>
        </div>
      </form>
      <div class="col-md-2">
        <div class="form-group">
          <label for="period">Period</label>
          <select type="text" class="form-control" id="period" name="period" [(ngModel)]="period">
            <option value="monthly">Month</option>
            <option value="daily">Day</option>
          </select>
        </div>
      </div>
      <div class="col-md-1">
        <label>&nbsp;</label>
        <button type="button" class="default-button green-button" (click)="updateData()">Submit</button>
      </div>
      <div class="col-md-12">
        <bar-chart [beginAtZero]="true" style="height:300px;" #chart [title]="''"></bar-chart>
      </div>
    </div>
    `
})
export class MeterChartComponent implements OnInit {

  @ViewChild('chart', {static: false}) chart;

  @Input() public type;
  @Input() public title;

  private dateForm;

  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  public dateFrom:any;
  public dateTo:any;
  public period = 'daily';

  constructor(private meterChartService: MeterChartService, private timeHelpers: TimeHelpers, private formBuilder: FormBuilder) {}

  ngOnInit() {
    this.dateForm = this.formBuilder.group({
      dateFrom: [this.timeHelpers.getDatepickerDictionary(this.timeHelpers.momentForUserTzUnadjusted().subtract(1, 'month')), [DateTimeValidators.beforeDateField('dateTo')]],
      dateTo: [this.timeHelpers.getDatepickerDictionary(this.timeHelpers.momentForUserTzUnadjusted()), [DateTimeValidators.afterDateField('dateFrom')]]
    });
    this.updateData();
  }

  validateParameter() {
    let dateFrom = this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateFrom').value.date);
    let dateTo = this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date);

    if(this.period == 'Month' && dateTo.diff(dateFrom, 'months') > 12) {
      alert('Date range must be less than 12 months for period of month.');
      return false;
    }
    if(this.period == 'Day' && dateTo.diff(dateFrom, 'months') > 1) {
      alert('Date range must be less than one month for period of day.');
      return false;
    }
    return true;
  }

  public updateData = function() {
    if(this.validateParameter()) {
      let months = [];
      let data = [];
      this.meterChartService.getData({
        type: this.type,
        fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateFrom').value.date).format('x'),
        toDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date).format('x'),
      }, this.period).subscribe(internalUsageReturn => {
   
        internalUsageReturn.forEach(result => {
          months.push(result.date);
          data.push(result[this.type]);
        });
	console.log("data:",data);
        this.chart.setData([
          {data: data, backgroundColor: ['#26c49d']},
        ], months);
      });
    }
  };
}
