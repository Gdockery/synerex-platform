import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TimeHelpers} from "../helpers/timeHelpers.service";

@Component({
  selector: 'month-year-picker',
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="form-group col-md-4">
          <label for="month">Month</label>
          <select class="form-control" name="month" [(ngModel)]="date.month">
            <option value="0">January</option>
            <option value="1">February</option>
            <option value="2">March</option>
            <option value="3">April</option>
            <option value="4">May</option>
            <option value="5">June</option>
            <option value="6">July</option>
            <option value="7">August</option>
            <option value="8">September</option>
            <option value="9">October</option>
            <option value="10">November</option>
            <option value="11">December</option>
          </select>
        </div>
        <div class="form-group col-md-4">
          <label for="month">Year</label>
          <select class="form-control" name="year" [(ngModel)]="date.year">
            <option *ngFor="let value of years" value="{{value}}">{{value}}</option>
          </select>
        </div>
        <div class="form-group col-md-2">
          <label for="month">&nbsp;</label>
          <button class="default-button form-control green-button" (click)="changed()">Go</button>
        </div>
      </div>
    </div>
  `
})
export class MonthYearPickerComponent implements OnInit {

  @Input() yearCount: number = 5;
  @Input() date;
  @Output() dateChanged: EventEmitter<any> = new EventEmitter<any>();

  private years;
  private currentDate;

  constructor(private timeHelpers: TimeHelpers) {}

  ngOnInit() {
    this.currentDate = this.timeHelpers.momentForUserTzUnadjusted();
    this.date = {month:this.currentDate.month(), year:this.currentDate.year()};
    this.populateYears();
    this.changed();
  }

  populateYears() {
    let yearArray = [];
    let year = this.currentDate.year();
    for(let i = year; i >  year - this.yearCount; i--) {
      yearArray.push(i);
    }
    this.years = yearArray;
  }

  changed() {
    this.dateChanged.emit(this.timeHelpers.momentForUserTzUnadjusted(this.date));
  }

}
