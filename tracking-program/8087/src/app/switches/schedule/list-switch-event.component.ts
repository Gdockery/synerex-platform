import { Component, ViewChild } from '@angular/core';
import {timer as observableTimer, Observable} from 'rxjs';
import { SwitchEventService } from "./switch-event.service";
import { ConfirmationService } from 'primeng/primeng';
import { ActivatedRoute } from "@angular/router";

@Component({
  templateUrl: 'list-switch-event.component.html'
})
export class ListSwitchEventComponent {

  @ViewChild('table', {static: false}) table;

  public switches;
  public recordCount = 0;
  public perPage = 20;
  public scheduled;
  private timer;
  private subscription;
  public recentSchedule = false;


  constructor(
    private switchEventService: SwitchEventService, private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) { this.scheduled = route.snapshot.params['schedule'];}

  ngOnInit() {

    if (this.scheduled) {
      this.recentSchedule = false; 
      this.timer = observableTimer(300000);
      this.subscription = this.timer.subscribe(data => {
        this.recentSchedule = true; 
      });
    }
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    params.deviceType = 1;
    this.switchEventService.getPaginated(params).subscribe(responseData => {
      this.recordCount = responseData.meta.total;
      this.switches = responseData.response;
    }); 
  }

  confirmClear() {
    this.confirmationService.confirm({
      header: 'Confirm deleting ALL scheduled events',
      message: 'Are you sure that you want to delete all scheduled events? This operation can not be undone.',
      accept: () => {
        this.clearSchedule()
      }
    });
  }

  clearSchedule() {
    this.switchEventService.clearSchedule().subscribe(() => this.refreshTable())
  }

}
