import {timer as observableTimer, Observable} from 'rxjs';
import { ConfirmationService } from "primeng/primeng";
import {Component, EventEmitter, Inject, OnInit, Output, ViewChild, AfterViewInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import * as moment from 'moment';
import {IMyOptions} from "mydatepicker";
import {APP_CONFIG, IAppConfig} from "../../config/app.config";
import {ActivatedRoute} from "@angular/router";
import {SwitchScheduleService} from "../switch-schedule.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {SwitchesService} from "../switches.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {Router} from "@angular/router";
import { SessionStorage } from '../../shared/helpers/sessionStorage.service';

@Component({
  selector: 'list-switches',
  templateUrl: 'list-switches.component.html'
})
export class ListSwitchesComponent {

  @ViewChild('table', {static: false}) table;
  @Output() submitEvent = new EventEmitter<any>();
  @ViewChild('timePicker', {static: false}) timePicker;

  protected switches: Array<any>;
  public recordCount = 0;
  public perPage = 10;
  public manualControlForm;
  public time: Date = new Date();
  public datePickerOptions: IMyOptions = {
    dateFormat: 'mm/dd/yyyy',
    showClearDateBtn: false
  };
  private schedule;
  private schDetail = [{}];
  private days = [];
  private selectDaysError = false;
	private allSelected = false;
	private tableFirst;
  private timer;
  private subscription;

  constructor(storage: SessionStorage, private formBuilder: FormBuilder, @Inject(APP_CONFIG) private config: IAppConfig, private route: ActivatedRoute, private switchScheduleService: SwitchScheduleService, private timeHelpers: TimeHelpers, private userService: CurrentUserService,  private router: Router, private confirmationService: ConfirmationService, private switchService: SwitchesService) { 
		this.tableFirst = storage.tableFirstHandler()
  }

  ngOnInit() {

    this.days = [
      {'name': 'Monday', 'number': 1},
      {'name': 'Tuesday', 'number': 2},
      {'name': 'Wednesday', 'number': 3},
      {'name': 'Thursday', 'number': 4},
      {'name': 'Friday', 'number': 5},
      {'name': 'Saturday', 'number': 6},
      {'name': 'Sunday', 'number': 0},
    ];

    this.timer = observableTimer(5,60000);
    this.subscription = this.timer.subscribe(energySavingsData => {
      this.refreshTable();
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
    this.checkSession();
  }

  checkSession() {
    if (moment().valueOf() - Number(this.userService.user.lastActiveAt) >= 3600000) {
      this.userService.logout();
    }
  }

  refresh(params) {
    const safeParams = (params && params.rows != null && params.first != null)
      ? params : { first: 0, rows: this.perPage, sortField: null, sortOrder: null };
    safeParams.project = this.userService.user.selectedProject.id;
    this.switchService.getPaginated(safeParams).subscribe(
      responseData => {
        this.recordCount = (responseData && responseData.meta && responseData.meta.total != null)
          ? responseData.meta.total : 0;
        this.switches = (responseData && responseData.response) ? responseData.response : [];
      },
      () => {
        this.recordCount = 0;
        this.switches = [];
      }
    );
  }

 selectAllDays() {
   this.days.forEach(function(day) {
     day.checked = true;
   });
   this.allSelected = true;
  }  
   
 select() {
   if (this.getDaysSelected().length < this.days.length) {
     this.days.forEach(function(day) {
       day.checked = true;
     });
     this.allSelected = true;
   } else {
     this.days.forEach(function(day) {
       day.checked = false;
     });
     this.allSelected = false;
   }  
 }

 changeCheckbox(i) {
   this.days[i].checked = !this.days[i].checked;
   if (this.getDaysSelected().length != this.days.length) {
    this.allSelected = false;
   } else {
    this.allSelected = true;
   }
  }

 getDaysSelected() {
   let result = this.days.filter((day) => { return day.checked == true})
                    .map((day) => { return day.number});
   return result; 
 }

  confirmDelete(switchId) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete the schedule for this switch?',
      accept: () => {
        this.switchScheduleService.deleteSchedule(switchId).subscribe(result => {
          this.refreshTable();
        });
      }
    });

  }

  colorFromComStatus(item) {
    let now = (new Date).getTime(),
      recentGateway = (now - item.meshLastCommunicatedAt) < 2 * 60000,
      recentStatus = (now - item.lastCommunicatedAt) < 3 * 60000

    if (recentStatus) {
      return 'green'
    }
    if (recentGateway) {
      return 'yellow'
    }
    return 'red'
  }

  getSchedule(switchId) {
    this.switchScheduleService.getSchedule({project: this.userService.user.selectedProject.id, switch: switchId}).subscribe(data => {
      this.schedule = data.response;
      this.initializeForm(switchId, data.response);
      this.selectAllDays();
    });
  }

  initializeForm(switchId, schedule){
    let date = new Date();
    if (schedule.hasSchedule) {
      this.manualControlForm = this.formBuilder.group({
        scheduleDetail: this.formBuilder.array(schedule.details.scheduleDetail.map(timeSet => this.getTimeSet(timeSet, false))),
        startDate: [this.timeHelpers.getDatepickerDictionaryFromString(schedule.details.startDate, 'YYYY-MM-DD'), [Validators.required]],
        endDate: [this.timeHelpers.getDatepickerDictionaryFromString(schedule.details.endDate, 'YYYY-MM-DD'), [Validators.required]],
        switch: [switchId, [Validators.required]],
      });      
    } else {
      this.manualControlForm = this.formBuilder.group({
        scheduleDetail: this.formBuilder.array(this.schDetail.map(timeSet => this.getTimeSet(timeSet, false))),
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
        switch: [switchId, [Validators.required]],
      });
    }
  }

  getTimeSet(timeSet:any = {}, addedTimeSet) {

    let onTime: Date;
    let offTime: Date;

    if (timeSet.offTime && timeSet.onTime) {
      onTime = new Date(timeSet.onTime);
      offTime = new Date(timeSet.offTime);
    } else {
      onTime = this.time;
      offTime = this.time;
    }
    return this.formBuilder.group({
      offTime: new FormControl(offTime, [Validators.required]),
      onTime: new FormControl(onTime, [Validators.required]),
      addedTimeSet: new FormControl(addedTimeSet, [Validators.required]),
    });
  }

  removeTimeSet(index) {
    this.manualControlForm.get('scheduleDetail').removeAt(index);
  }

  addTimeSet() {
    this.manualControlForm.get('scheduleDetail').push(this.getTimeSet({}, true));
  }

  testSchedules() {
    this.switchScheduleService.testSchedules().subscribe(data => {
        //route to list equipment switches
    });

  } 

  transformTimeSet(timeSet:any={}) {
    return {offTime: '' + timeSet.offTime.getHours() + ':' + timeSet.offTime.getMinutes(), onTime: '' + timeSet.onTime.getHours() + ':' + timeSet.onTime.getMinutes()};
  }

  getHoursOff() {
    let hoursOff = this.manualControlForm.value.scheduleDetail.map(timeSet => {
      let hours = Math.abs(timeSet.onTime.getTime() - timeSet.offTime.getTime()) / 36e5;
      return hours;
    }).reduce((a, b) => a + b, 0);
    return hoursOff
  }


  submit() {

    let submitData:any = {
      startDate: this.timeHelpers.formatDatepickerDictionary(this.manualControlForm.value.startDate.date,'YYYY-MM-DD', false),
      endDate: this.timeHelpers.formatDatepickerDictionary(this.manualControlForm.value.endDate.date,'YYYY-MM-DD', false),
      scheduleDetail: this.manualControlForm.value.scheduleDetail.map(timeSet => this.transformTimeSet(timeSet)),
      switch: this.manualControlForm.value.switch,
      daysOfWeek: this.getDaysSelected(),
      totalHoursOff: this.getHoursOff(),
    };

    let startDate = this.timeHelpers.momentForUserTzUnadjusted({
      year: this.manualControlForm.value.startDate.date.year,
      month: this.manualControlForm.value.startDate.date.month,
      date: this.manualControlForm.value.startDate.date.day,
    });

    let endDate = this.timeHelpers.momentForUserTzUnadjusted({
      year: this.manualControlForm.value.endDate.date.year,
      month: this.manualControlForm.value.endDate.date.month,
      date: this.manualControlForm.value.endDate.date.day,
    });

    if(!this.timePicker.invalidHours && !this.timePicker.invalidMinutes) {
      this.submitEvent.emit(submitData);
    }
    

    if (!this.schedule.hasSchedule) {
      submitData.project = this.userService.user.selectedProject.id;
      this.switchScheduleService.create(submitData).subscribe(data => {
        this.refreshTable();
      });
    } else {
      submitData.schedule = this.schedule.details.scheduleId;
      submitData.project = this.userService.user.selectedProject.id;
      this.switchScheduleService.updateSchedule(submitData).subscribe(data => {
        this.refreshTable();
      });
    } 
  }
}
