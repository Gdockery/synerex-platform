import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {AlertService} from "../alert.service";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {AdditionalValidators} from "../../../shared/validation/additional.validator";
import {CustomValidators} from "ng2-validation";
import {DeviceService} from "../../devices/device.service";

@Component({
  selector: 'sd-create-alert',
  templateUrl: 'create-alert.component.html'
})
export class CreateAlertComponent implements OnInit {
  @Input() public currentAlertType;
  @Input() public currentAlert = null;

  @Output() cancel = new EventEmitter<any>();
  @Output() createEvent = new EventEmitter<any>();
  @Output() editEvent = new EventEmitter<any>();

  @ViewChild('meterSelect', {static: false}) meterSelect;

  public alerts;
  public selectedCount = 0;
  public alertForm: FormGroup;

  public metersObservable;

  constructor(private alertService: AlertService, private formBuilder: FormBuilder, private metersService: DeviceService) {
    this.metersObservable = metersService.getAll({pageSize: 500});
  }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    if(this.currentAlert == null) {
      this.initializeNewForm();
    } else {
      this.initializeFormToEditAlert();
    }
  }

  initializeNewForm() {
    this.alertForm = this.formBuilder.group({
      note: [''],
      time: ['', [CustomValidators.number, Validators.required]],
      userArray: this.formBuilder.array([
        this.formBuilder.group({'id': new FormControl('', [Validators.required])})
      ]),
      meters: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
    });

    if(this.currentAlertType.id == 1) {
      this.alertForm.addControl('threshold',  new FormControl('', [CustomValidators.number, Validators.required]))
    }
  }

  initializeFormToEditAlert() {
    let users = this.currentAlert.users.map(user => {
      return this.formBuilder.group({'id': new FormControl(user.id, [Validators.required])});
    });
    this.alertForm = this.formBuilder.group({
      note: [this.currentAlert.note],
      time: [this.currentAlert.threshold, [CustomValidators.number, Validators.required]],
      userArray: this.formBuilder.array(users),
      meters: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
    });

    if(this.currentAlertType.id == 1) {
      this.alertForm.addControl('threshold',  new FormControl('', [CustomValidators.number, Validators.required]))
    }
  }

  resetForm() {
    this.alertForm.controls.time.reset();
    this.alertForm.controls.userArray.reset();
    if(this.alertForm.controls.threshold) {
      this.alertForm.controls.threshold.reset();
    }
    this.meterSelect.reset();
  }

  selected(count) {
    this.selectedCount = count;
  }

  cancelCreate() {
    this.cancel.emit();
  }

  create(alert) {
    let alertData: any = {
      note: alert.value.note,
      alertType: this.currentAlertType.id,
      users: [],
      meters: []
    };

    alertData.threshold = this.currentAlertType.id == 1 ? parseInt(alert.value.threshold) : parseInt(alert.value.time);

    if (this.currentAlertType.id == 1) {
      alertData.delay = parseInt(alert.value.time);
    }

    for (let i in alert.value.meters) {
      if (alert.value.meters[i].value) {
        alertData.meters.push(alert.value.meters[i].id);
      }
    }
    for (let i in alert.value.userArray) {
      alertData.users.push(parseInt(alert.value.userArray[i].id));
    }


    if (this.currentAlert) {
      alertData.id = this.currentAlert.id;
      this.alertService.update(this.currentAlert.id, alertData).subscribe(data => {
        this.editEvent.emit(data);
      });
    } else {
      this.alertService.create(alertData).subscribe(data => {
        this.createEvent.emit(data);
        this.resetForm();
      });
    }
  }
}
