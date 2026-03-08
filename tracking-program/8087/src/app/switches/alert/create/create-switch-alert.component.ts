import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {AdditionalValidators} from "../../../shared/validation/additional.validator";

import * as moment from 'moment';
import {CustomValidators} from "ng2-validation";
import {SwitchesService} from "../../switches.service";
import {SwitchAlertService} from "../switch-alert.service";

@Component({
  selector: 'create-switch-alert',
  templateUrl: './create-switch-alert.component.html'
})
export class CreateSwitchAlertComponent implements OnInit {
  @Input() public currentType;
  @Input() public currentAlert = null;

  @Output() cancelEvent = new EventEmitter<any>();
  @Output() createEvent = new EventEmitter<any>();
  @Output() editEvent = new EventEmitter<any>();

  @ViewChild('switchSelect', {static: false}) switchSelect;

  public switches = [];
  public selectedCount = 0;
  public alertForm: FormGroup;

  public switchesObservable;

  constructor(private formBuilder: FormBuilder, private alertService: SwitchAlertService, private switchService: SwitchesService) {
    this.switchesObservable = switchService.getAll();
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
      switches: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
    });
  }

  initializeFormToEditAlert() {
    let users = this.currentAlert.users.map(user => {
      return this.formBuilder.group({'id': new FormControl(user.id, [Validators.required])});
    });

    this.alertForm = this.formBuilder.group({
      userArray: this.formBuilder.array(users),
      switches: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
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
      switches: []
    };

    for (let i in alert.value.userArray) {
      postData.users.push(parseInt(alert.value.userArray[i].id));
    }

    for (let i in alert.value.switches) {
      if (alert.value.switches[i].value) {
        postData.switches.push(alert.value.switches[i].id);
      }
    }

    if (this.currentAlert) {
      postData.id = this.currentAlert.id;
      this.alertService.update(this.currentAlert.id, postData).subscribe(data => {
        this.editEvent.emit(data);
      });
    } else {
      this.alertService.create(postData).subscribe(data => {
        this.createEvent.emit(data);
        this.alertForm.controls.userArray.reset();
        this.alertForm.controls.threshold.reset();

        this.switchSelect.reset();
      });
    }
  }
}
