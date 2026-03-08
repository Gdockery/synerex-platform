import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {AdditionalValidators} from "../../../shared/validation/additional.validator";

import * as moment from 'moment';
import {RepeaterAlertService} from "../repeater-alert.service";
import {CustomValidators} from "ng2-validation";
import {RepeaterService} from "../../devices/repeater-device.service";

@Component({
  selector: 'create-repeater-alert',
  templateUrl: './create-repeater-alert.component.html'
})
export class CreateRepeaterAlertComponent implements OnInit {
  @Input() public currentType;
  @Input() public currentAlert = null;

  @Output() cancelEvent = new EventEmitter<any>();
  @Output() createEvent = new EventEmitter<any>();
  @Output() editEvent = new EventEmitter<any>();

  @ViewChild('repeaterSelect', {static: false}) repeaterSelect;

  public repeaters = [];
  public selectedCount = 0;
  public alertForm: FormGroup;

  public repeaterObservable;

  constructor(private formBuilder: FormBuilder, private repeaterAlertService: RepeaterAlertService, private repeaterService: RepeaterService) {
    this.repeaterObservable = repeaterService.getAll();
  }

  ngOnInit() {
    if(!this.currentAlert) {
      this.initializeForm();
    } else {
      this.initializeFormToEditAlert();
    }

  }

  initializeForm() {
    let date = new Date();
    this.alertForm = this.formBuilder.group({
      note: [''],
      threshold: ['', [CustomValidators.number, Validators.required]],
      userArray: this.formBuilder.array([
        this.formBuilder.group({'id': new FormControl('', [Validators.required])})
      ]),
      repeaters: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
    });
  }

  initializeFormToEditAlert() {
    let users = this.currentAlert.users.map(user => {
      return this.formBuilder.group({'id': new FormControl(user.id, [Validators.required])});
    });

    this.alertForm = this.formBuilder.group({
      userArray: this.formBuilder.array(users),
      repeaters: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
    });
  }

  selected(count) {
    this.selectedCount = count;
  }

  cancelCreate() {
    this.cancelEvent.emit();
  }

  create(alert) {
    let postData:any = {
      threshold: alert.value.threshold,
      alertType: this.currentType.id,
      users: [],
      repeaters: []
    };

    for (let i in alert.value.userArray) {
      postData.users.push(parseInt(alert.value.userArray[i].id));
    }

    for (let i in alert.value.repeaters) {
      if (alert.value.repeaters[i].value) {
        postData.repeaters.push(alert.value.repeaters[i].id);
      }
    }

    if (this.currentAlert) {
      postData.id = this.currentAlert.id;
      this.repeaterAlertService.update(this.currentAlert.id, postData).subscribe(data => {
        this.editEvent.emit(data);
      });
    } else {
      this.repeaterAlertService.create(postData).subscribe(data => {
        this.createEvent.emit(data);
        this.alertForm.controls.userArray.reset();
        this.alertForm.controls.threshold.reset();
        this.repeaterSelect.reset();
      });
    }


  }

}
