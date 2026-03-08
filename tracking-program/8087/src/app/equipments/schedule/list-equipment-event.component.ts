import { Component, ViewChild } from '@angular/core';
import { EquipmentEventService } from "./equipment-event.service";
import { ConfirmationService } from 'primeng/primeng';
import { ActivatedRoute } from "@angular/router";

@Component({
  templateUrl: './list-equipment-event.component.html'
})
export class ListEquipmentEventComponent {

  @ViewChild('table', {static: false}) table;

  public switches;
  public recordCount = 0;
  public perPage = 10;

  constructor(
    private equipmentEventService: EquipmentEventService, private route: ActivatedRoute,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
  }

  refreshTable() {
    this.table.onLazyLoad.emit(this.table.createLazyLoadMetadata());
  }

  refresh(params) {
    params.deviceType = 2;
    this.equipmentEventService.getPaginated(params).subscribe(responseData => {
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
    this.equipmentEventService.clearSchedule().subscribe(() => this.refreshTable())
  }

}
