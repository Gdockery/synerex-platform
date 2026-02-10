import { Component, ViewChild } from '@angular/core';
import {SwitchScheduleService} from "../switch-schedule.service";
import { ConfirmationService } from 'primeng/primeng';
import { ActivatedRoute } from "@angular/router";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";

@Component({
  templateUrl: 'list-switch-schedule.component.html'
})
export class ListSwitchScheduleComponent {

  @ViewChild('table', {static: false}) table;

  public schedules;
  public recordCount = 0;
  public perPage = 10;
  public scheduled;
  private timer;
  private subscription;
  public recentSchedule = false;


  constructor(
    private switchScheduleService: SwitchScheduleService, private userService: CurrentUserService, private route: ActivatedRoute, private timeHelpers: TimeHelpers, private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {

  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    params.deviceType = 1; 
    params.project = this.userService.user.selectedProject.id;
    this.switchScheduleService.listSchedules(params).subscribe(responseData => {
      this.recordCount = responseData.meta.total;
      this.schedules = responseData.response;
      console.log(this.schedules);
    }); 
  }

  confirmDelete(scheduleId) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this recurring schedule?',
      accept: () => {
        this.switchScheduleService.deleteSchedule(scheduleId).subscribe(result => {
          this.refreshTable();
        });
      }
    });

  }

}
