import {Component, ViewChild, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {IMyOptions} from "mydatepicker";
import {CustomValidators} from "ng2-validation";
import {EquipmentEventService} from "./equipment-event.service";
import {Router} from "@angular/router";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import { ActivatedRoute } from "@angular/router";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {EquipmentScheduleService} from "../equipment-schedule.service";
import { ConfirmationService } from "primeng/primeng";
import {EquipmentsService} from "../equipments.service";

@Component({
  templateUrl: 'create-equipment-event.component.html',
})
export class CreateEquipmentEventComponent {

  @ViewChild('timePicker', {static: false}) timePicker;

  public form: FormGroup;
  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  @Output() submitEvent = new EventEmitter<any>();

  public switches;
  public massSelectValue;
  public oneTime = false;

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
    private equipmentsService: EquipmentsService,
    private equipmentEventService: EquipmentEventService,
    private router: Router,
    private timeHelpers: TimeHelpers,
    private route: ActivatedRoute,
    private userService: CurrentUserService,
    private equipmentScheduleService: EquipmentScheduleService,
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
    let params = {deviceType: 2, pageSize: 500};
    this.equipmentsService.getAll(params).subscribe(switches => {
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
    if (this.form.value.type == 'One-time') {
      if(!this.timePicker.invalidHours && !this.timePicker.invalidMinutes && this.form.valid) {
        let time = this.timeHelpers.moment(this.form.value.time);
        let dateTime = this.timeHelpers.momentForUserTzUnadjusted({year: this.form.value.date.date.year, month: this.form.value.date.date.month - 1, date: this.form.value.date.date.day, hour: time.hour(), minute: time.minute()});

        let submitData = {
          commandType: this.form.value.command,
          switches: this.getSelectedSwitches(this.switches),
          startAt: dateTime.valueOf(),
          deviceType: 2,
        };

        this.equipmentEventService.create(submitData).subscribe(event => {
          this.router.navigate(['/equipments/command/list', event.response.id]);
        })
      }
    } else {
      let submitData:any = {
        startDate: this.timeHelpers.formatDatepickerDictionary(this.manualControlForm.value.startDate.date,'YYYY-MM-DD', false),
        endDate: this.timeHelpers.formatDatepickerDictionary(this.manualControlForm.value.endDate.date,'YYYY-MM-DD', false),
        scheduleDetail: this.manualControlForm.value.scheduleDetail.map(timeSet => this.transformTimeSet(timeSet)),
        switches: this.getSelectedSwitches(this.switches),
        daysOfWeek: this.getDaysSelected(),
        totalHoursOff: this.getHoursOff(),
        deviceType: 2,
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
      this.equipmentScheduleService.create(submitData).subscribe(data => {
        this.router.navigate(['/equipments/schedule/list']);
      });
    }
  }

  checkSelectedRecurring() {
   // Always recurring even if 1 day.
   // if(this.form.value.type == 'Recurring') {
      this.oneTime = false;
    /*} else {
      this.oneTime = true;
    }*/
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
