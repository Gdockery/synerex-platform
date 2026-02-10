import {Component, OnInit, ViewChild} from '@angular/core';
import {TestService} from "../tests.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";

import * as moment from 'moment';
import {IMyOptions} from "mydatepicker";
import {Router} from "@angular/router";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {AdditionalValidators} from "../../shared/validation/additional.validator";
import {GatewayService} from "../../gateway/devices/gateway-device.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";

let _ = require('lodash');

@Component({
  selector: 'create-test',
  templateUrl: 'create-test.component.html'
})
export class CreateTestComponent implements OnInit {

  @ViewChild('timePicker', {static: false}) timePicker;

  public testForm: FormGroup;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  private availableGateways = [];
  private selectedGateways = [];
  public gwControl = false;

  constructor(private testService: TestService,
              private router: Router,
              private formBuilder: FormBuilder,
                        private timeHelpers: TimeHelpers,
              private gatewayService: GatewayService,
              private userService: CurrentUserService) {
  }

  ngOnInit() {
    this.gatewayService.getAll({pageSize:500}).subscribe((gateways => {
       this.availableGateways = gateways.response;
       this.selectedGateways = [];
    }));

    this.initializeForm();
  }

  initializeForm() {
    let date = this.timeHelpers.momentForUserTzUnadjusted();
    //Round time up to nearest quarter hour
    date.minutes(15 * Math.ceil( date.minute() / 15 ));

    let time = new Date()
    time.setHours(date.hours())
    time.setMinutes(date.minutes())

    this.gwControl = this.userService.user.selectedProject.gwControl;

    this.testForm = this.formBuilder.group({
      time: [time, [Validators.required]],
      duration: ['', [Validators.required, CustomValidators.number]],
      interval: ['', [Validators.required, CustomValidators.number]],
      startAt: [
        this.timeHelpers.getDatepickerDictionary(date),
        [Validators.required]
      ]
    });
  }

  addOrRemoveGateway(gatewayId) {
    if(_.contains(this.selectedGateways, gatewayId)) {
      this.selectedGateways = _.without(this.selectedGateways, gatewayId);
    }
    else {
      this.selectedGateways.push(gatewayId);
    }
  }

  validateAndGetSubmitData(form) {
    let date = this.timeHelpers.momentForUserTzUnadjusted({
      year: form.value.startAt.date.year,
      month: form.value.startAt.date.month - 1,
      date: form.value.startAt.date.day,
      minute: form.value.time.getMinutes(),
      hour: form.value.time.getHours()
    });

    let submitData = {
      startAt: date.valueOf(),
      interval: form.value.interval,
      duration: form.value.duration,
      gateways: this.selectedGateways
    };

    if(date.minutes() % 15 != 0) {
      alert('Minutes must be in increments of 15.');
      return false;
    }

    if(date.diff(moment(), 'minutes') < 5 ) {
      alert('Scheduled time must be at least 5 minutes in the future.');
      return false;
    }

    if(form.value.duration % form.value.interval != 0) {
      alert('Duration must be in divisible interval');
      return false;
    }

    if(!this.timePicker.invalidHours && !this.timePicker.invalidMinutes && this.testForm.valid) {
      return submitData;
    }
  }

  submit() {
    let submitData = this.validateAndGetSubmitData(this.testForm);
    if(submitData) {
      this.testService.create(submitData).subscribe(data => {
        this.router.navigate(['/tests/list']);
      });
    } else {
      for (let i in this.testForm.controls) {
        this.testForm.controls[i].markAsDirty();
      }
    }
  }
}
