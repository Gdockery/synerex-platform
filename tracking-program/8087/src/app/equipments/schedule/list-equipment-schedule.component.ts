import { Component, ViewChild } from '@angular/core';
import {EquipmentScheduleService} from "../equipment-schedule.service";
import { ConfirmationService } from 'primeng/primeng';
import { ActivatedRoute } from "@angular/router";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";

@Component({
  templateUrl: './list-equipment-schedule.component.html'
})
export class ListEquipmentScheduleComponent {

  @ViewChild('table', {static: false}) table;

  public schedules;
  public recordCount = 0;
  public perPage = 10;
  public scheduled;
  private timer;
  private subscription;
  public recentSchedule = false;


  constructor(
    private equipmentScheduleService: EquipmentScheduleService, private route: ActivatedRoute, private timeHelpers: TimeHelpers, private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {

  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    params.deviceType = 2;
    this.equipmentScheduleService.getPaginated(params).subscribe(responseData => {
      this.recordCount = responseData.meta.total;
      this.schedules = responseData.response;
   
    }); 
  }

  confirmDelete(scheduleId) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this recurring schedule?',
      accept: () => {
        this.equipmentScheduleService.deleteSchedule(scheduleId).subscribe(result => {
          this.refreshTable();
        });
      }
    });

  }

}
