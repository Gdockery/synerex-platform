import {Component, ViewChild, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {IMyOptions} from "mydatepicker";
import {CustomValidators} from "ng2-validation";
import {SwitchesService} from "../switches.service";
import {SwitchEventService} from "./switch-event.service";
import {Router} from "@angular/router";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import { ActivatedRoute } from "@angular/router";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {SwitchScheduleService} from "../switch-schedule.service";
import { ConfirmationService } from "primeng/primeng";

@Component({
  templateUrl: 'create-switch-event.component.html',
})
export class CreateSwitchEventComponent {

  @ViewChild('timePicker', {static: false}) timePicker;

  public form: FormGroup;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  @Output() submitEvent = new EventEmitter<any>();

  public switches;
  public massSelectValue;
  public oneTime = true;

  public manualControlForm;
  public time: Date = new Date();
  private schedule;
  private schDetail = [{}];
  private days = [];
  private selectDaysError = false;
  private allSelected = false;
  private tableFirst;

  constructor(
    private formBuilder: FormBuilder,
    private switchService: SwitchesService,
    private switchEventService: SwitchEventService,
    private router: Router,
    private timeHelpers: TimeHelpers,
    private route: ActivatedRoute,
    private userService: CurrentUserService,
    private switchScheduleService: SwitchScheduleService,
    private confirmationService: ConfirmationService,
  ) {}

  


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
    let params = {deviceType: 1, pageSize: 500};
    this.switchService.getAll(params).subscribe(switches => {
      this.switches = switches.response;
      this.initializeForm();
    });
  }

  initializeForm() {
    let m = this.timeHelpers.momentForUserTz();

    let time = new Date()
    time.setHours(m.hours())
    time.setMinutes(m.minutes())

    this.form = this.formBuilder.group({
      massSelect: [true],
      type: ['', [Validators.required]],
      command: ['', [Validators.required]],
      time: [time, [Validators.required]],
      date: [{
        date: {year: m.year(), month: m.month() + 1, day: m.date()}},
        [Validators.required]
      ]
    });

    let date = new Date();

    this.manualControlForm = this.formBuilder.group({
      scheduleDetail: this.formBuilder.array(this.schDetail.map(timeSet => this.getTimeSet(timeSet, false))),
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      switches: ['', [Validators.required]],
    });
  }

  massSelect() {
    this.switches.forEach(switchModel => {
      switchModel.selected = this.massSelectValue;
    });
  }

  getSelectedSwitches(switches) {
    return switches.reduce((acc, switchModel) => {
      if(switchModel.selected) {
        acc.push(switchModel.id);
      }
      return acc;
    }, []);
  }

  submit() {
    console.log("in submit");
    if (this.oneTime) {
      console.log("in oneTime");
      if(!this.timePicker.invalidHours && !this.timePicker.invalidMinutes && this.form.valid) {
        let time = this.timeHelpers.moment(this.form.value.time);
        let dateTime = this.timeHelpers.momentForUserTzUnadjusted({year: this.form.value.date.date.year, month: this.form.value.date.date.month - 1, date: this.form.value.date.date.day, hour: time.hour(), minute: time.minute()});

        let submitData = {
          commandType: this.form.value.command,
          switches: this.getSelectedSwitches(this.switches),
          startAt: dateTime.valueOf(),
          deviceType: 1,
        };

        this.switchEventService.create(submitData).subscribe(event => {
          this.router.navigate(['/switches/command/list', event.response.id]);
        })
      }
    } else {
      console.log("in else");
      let submitData:any = {
        startDate: this.timeHelpers.formatDatepickerDictionary(this.manualControlForm.value.startDate.date,'YYYY-MM-DD', false),
        endDate: this.timeHelpers.formatDatepickerDictionary(this.manualControlForm.value.endDate.date,'YYYY-MM-DD', false),
        scheduleDetail: this.manualControlForm.value.scheduleDetail.map(timeSet => this.transformTimeSet(timeSet)),
        switches: this.getSelectedSwitches(this.switches),
        daysOfWeek: this.getDaysSelected(),
        totalHoursOff: this.getHoursOff(),
        deviceType: 1,
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

      submitData.project = this.userService.user.selectedProject.id;
      console.log("sumbit Data", submitData);
      this.switchScheduleService.create(submitData).subscribe(data => {
        this.router.navigate(['/switches/schedule/list']);
      });
    }
  }

  checkSelectedRecurring() {
    if(this.form.value.type == 'Recurring') {
      this.oneTime = false;
    } else {
      this.oneTime = true;
    }
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
        this.switchScheduleService.deleteSchedule(switchId).subscribe(event => {
          this.router.navigate(['/switches/schedule/list', event.response.id]);
        });
      }
    });

  }

  colorFromComStatus(item) {
    let now = (new Date).getTime(),
      recentGateway = (now - item.meshLastCommunicatedAt) < 2 * 60000,
      recentStatus = (now - item.lastCommunicatedAt) < 2 * 60000

    if (recentStatus) {
      return 'green'
    }
    if (recentGateway) {
      return 'yellow'
    }
    return 'red'
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
}
