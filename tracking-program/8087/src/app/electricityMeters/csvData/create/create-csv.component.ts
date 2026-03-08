import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Observable} from "rxjs";
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {AdditionalValidators} from "../../../shared/validation/additional.validator";
import {CustomValidators} from "ng2-validation";
import {CsvDataService} from "../csvData.service";
import {IMyOptions} from "mydatepicker";

import * as moment from 'moment-timezone';

import {DeviceService} from "../../devices/device.service";
import {DateTimeValidators} from "../../../shared/validation/dateTime.validators";
import {CurrentUserService} from "../../../shared/user/currentUser.service";

@Component({
  selector: 'sd-create-csv',
  templateUrl: './create-csv.component.html'
})
export class CreateCsvComponent implements OnInit {
  @Input() public currentType;
  @Input() public csvData;
  @Output() cancelEvent = new EventEmitter<any>();
  @Output() createEvent = new EventEmitter<any>();
  @Output() editEvent = new EventEmitter<any>();

  @ViewChild('meterSelect', {static: false}) meterSelect;

  public selectedCount = 0;
  public csvForm: FormGroup;


  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  public metersObservable;

  constructor(private formBuilder: FormBuilder, private csvDataService: CsvDataService, private meterService: DeviceService,
              private userService: CurrentUserService) {
    this.metersObservable = meterService.getAll({pageSize: 100});
  }

  ngOnInit() {
    this.initializeForm();
    this.refresh();
  }

  refresh() {
    this.csvDataService.listReports(this.userService.user.selectedProject.id).subscribe(data => {
      this.csvData = data.response;
    });
  }

  initializeForm() {
    let date = new Date();
    this.csvForm = this.formBuilder.group({
      frequency: ['', [Validators.required, CustomValidators.number]],
      fromDate: [{
        date: {year: date.getFullYear(), month: date.getMonth(), day: date.getDate()}},
        [Validators.required, DateTimeValidators.beforeDateField('toDate')]
      ],
      toDate: [{
        date: {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()}},
        [Validators.required, DateTimeValidators.afterDateField('fromDate')]
      ],
      userArray: this.formBuilder.array([
        this.formBuilder.group({'id': new FormControl('', [Validators.required])})
      ]),
      meters: this.formBuilder.array([], AdditionalValidators.multipleCheckboxRequireOne),
    });
  }

  resetForm() {
    let date = new Date();
    this.csvForm.controls.fromDate.setValue({date: {year: date.getFullYear(), month: date.getMonth(), day: date.getDate()}});
    this.csvForm.controls.toDate.setValue({date: {year: date.getFullYear(), month: date.getMonth()+1, day: date.getDate()}});
    this.csvForm.controls.userArray.reset();
  }

  meterSelected(count) {
    this.selectedCount = count;
  }

  cancelCreate() {
    this.cancelEvent.emit();
  }

  delete(id) {
    this.csvDataService.remove(id);
    this.refresh();
  }

  create(csv) {
    csv.value.fromDate.date.month--;
    csv.value.toDate.date.month--;
	// userService.user.selectedProject?.timeZoneId
    let fromDateTZ = moment.tz(csv.value.fromDate.date, this.userService.user.selectedProject.timeZoneId);
    let toDateTZ = moment.tz(csv.value.toDate.date, this.userService.user.selectedProject.timeZoneId);
    let postData = {
      project: this.userService.user.selectedProject.id,
      title: 'test',
      frequency: csv.value.frequency,
      reportType: this.currentType.id,
      fromDate: fromDateTZ.format('x'),
      toDate: toDateTZ.format('x'),
      users: [],
      meters: []
    };

    for(let i in csv.value.userArray) {
      if (csv.value.userArray[i].id) {
        postData.users.push(parseInt(csv.value.userArray[i].id));
      }
    }

    for(let i in csv.value.meters) {
      if(csv.value.meters[i].value) {
        postData.meters.push(csv.value.meters[i].id); 
      }
    }

    this.csvDataService.createReport(this.userService.user.selectedProject.id, postData).subscribe(data => {
      this.resetForm();
      this.meterSelect.reset();
      this.refresh();
    });
  }

}
