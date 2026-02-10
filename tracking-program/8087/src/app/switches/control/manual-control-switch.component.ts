import {Component, EventEmitter, Inject, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

import * as moment from 'moment';
import {IMyOptions} from "mydatepicker";
import {APP_CONFIG, IAppConfig} from "../../config/app.config";

@Component({
  selector: 'manual-control-switch',
  template: `
    <form [formGroup]="manualControlForm" (ngSubmit)="submit(manualControlForm)">
      <div class="container-fluid">
        <div class="col-md-12">
          <div class="row">
            <div class="col-md-6">
              <strong>Manual</strong>
            </div>
            <div class="col-md-4">
              <div>
                Power
                <div class="radio" style="display:inline-block;">
                  <label><input type="radio" formControlName="status" name="status" value="1">On</label>
                </div>
                <div class="radio">
                  <label><input type="radio" formControlName="status" name="status" value="0">Off</label>
                </div>
              </div>
              <div *ngIf="manualControlForm.controls.status.errors && (manualControlForm.controls.status.dirty || manualControlForm.controls.status.touched)" class="alert alert-danger">
                A date must be provided.
              </div>
            </div>
            <div class="col-md-2">
              <div class="pull-right">
                <button class="default-button green-button" [disabled]="!manualControlForm.valid || timePicker.invalidHours || timePicker.invalidMinutes">Submit</button>
              </div>
            </div>
          </div>
          <div class="row" style="margin-top:20px;">
            <div class="col-md-6" style="padding-top:10px;">
              <div class="form-group">
                <label for="date">Date</label>
                <my-date-picker
                  name="date"
                  id="date"
                  [options]="datePickerOptions"
                  formControlName="date">
                </my-date-picker>
                <div *ngIf="manualControlForm.controls.date.errors && (manualControlForm.controls.date.dirty || manualControlForm.controls.date.touched)" class="alert alert-danger">
                  A date must be provided.
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <timepicker #timePicker formControlName="time"></timepicker>
              <div *ngIf="this.timePicker.invalidHours || this.timePicker.invalidMinutes" class="alert alert-danger">
                A void time must be provided.
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  `,
  styles: [ `
    .radio {
      display:inline-block;
      margin:0 5px;
    }
  `]
})
export class ManualControlSwitchComponent implements OnInit {
  @Output() submitEvent = new EventEmitter<any>();

  @ViewChild('timePicker', {static: false}) timePicker;

  public manualControlForm: FormGroup;
  public time: Date = new Date();
  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  constructor(private formBuilder: FormBuilder, @Inject(APP_CONFIG) private config: IAppConfig) {}

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    let date = new Date();
    this.manualControlForm = this.formBuilder.group({
      status: ['', [Validators.required]],
      time: [this.time, [Validators.required]],
      date: [{
        date: {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()}},
        [Validators.required]
      ]
    });
  }

  submit(control) {
    let date = moment(control.value.time);
    date.set({
      year: control.value.date.date.year,
      month: control.value.date.date.month - 1,
      date: control.value.date.date.day
    });

    let submitData = {
      commandType: control.value.status ? this.config.constants.SWITCH_COMMAND_TYPES.POWER_ON : this.config.constants.SWITCH_COMMAND_TYPES.POWER_OFF,
      startAt: date.valueOf(),
    };

    if(!this.timePicker.invalidHours && !this.timePicker.invalidMinutes) {
      this.submitEvent.emit(submitData);
    }
  }
}
