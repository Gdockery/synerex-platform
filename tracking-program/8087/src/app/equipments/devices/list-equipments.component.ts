import { ConfirmationService } from "primeng/primeng";
import {timer as observableTimer, Observable} from 'rxjs';
import {Component, EventEmitter, Inject, OnInit, Output, ViewChild, AfterViewInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import * as moment from 'moment';
import {IMyOptions} from "mydatepicker";
import {APP_CONFIG, IAppConfig} from "../../config/app.config";
import {ActivatedRoute} from "@angular/router";
import {EquipmentScheduleService} from "../equipment-schedule.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {EquipmentsService} from "../equipments.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {Router} from "@angular/router";

@Component({
  selector: 'list-equipments',
  templateUrl: './list-equipments.component.html'
})
export class ListEquipmentsComponent {

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
  private timer;
  private subscription;
  private tableFirst;
  private showModal;

  constructor(private formBuilder: FormBuilder, @Inject(APP_CONFIG) private config: IAppConfig, private route: ActivatedRoute, private equipmentScheduleService: EquipmentScheduleService, private timeHelpers: TimeHelpers, private userService: CurrentUserService,  private router: Router, private confirmationService: ConfirmationService, private equipmentsService: EquipmentsService) { 
  
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

  checkSubscription() {
    if (this.showModal) {
      this.subscription.unsubscribe();
    } else {
      this.subscription = this.timer.subscribe(energySavingsData => {
        this.refreshTable();
      });
    }
  }


  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    params.deviceType = 2;
    this.equipmentsService.getPaginated(params).subscribe(responseData => {
      this.recordCount = responseData.meta.total;
      this.switches = responseData.response;
    });
  }



  colorFromComStatus(item) {
    let now = (new Date).getTime(),
      recentGateway = (now - item.meshLastCommunicatedAt) < 3 * 60000,
      recentStatus = (now - item.lastCommunicatedAt) < 3 * 60000

    if (recentStatus) {
      return 'green'
    }
    if (recentGateway) {
      return 'yellow'
    }
    return 'red'
  }

}
