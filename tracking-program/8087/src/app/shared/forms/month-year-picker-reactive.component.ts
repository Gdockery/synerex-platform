import {Component, Input, OnInit} from '@angular/core';
import * as moment from 'moment';
import {FormGroup} from "@angular/forms";

@Component({
  selector: 'month-year-picker-reactive',
  template: `
    <div [formGroup]="formGroup">
      <div class="form-group col-md-6">
        <label for="month">Month</label>
        <select class="form-control" name="month" formControlName="month">
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
      <div class="form-group col-md-6">
        <label for="month">Year</label>
        <select  class="form-control" name="year" formControlName="year">
          <option *ngFor="let value of years" value="{{value}}">{{value}}</option>
        </select>
      </div>
    </div>
  `
})
export class MonthYearPickerReactiveComponent implements OnInit {

  @Input() formGroup:FormGroup;

  /**
   * How many years to display.
   * @type {number}
   */
  @Input() yearCount: number = 5;

  public years;

  private currentDate: Date = new Date();

  ngOnInit() {
    this.populateYears();
    if(!this.formGroup.value.year) {
      this.formGroup.patchValue({
        month: this.currentDate.getMonth(),
        year: this.currentDate.getFullYear()
      });
    }
  }

  populateYears() {
    let yearArray = [];
    let year = this.currentDate.getFullYear();
    for(let i = year; i >  year - this.yearCount; i--) {
      yearArray.push(i);
    }
    this.years = yearArray;
  }

}
