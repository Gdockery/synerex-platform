import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AlertService} from "../alert.service";
import {MeterAlertTypesService} from "../meterAlertType.service";
import {ConfirmationService} from "primeng/primeng";

@Component({
  selector: 'sd-list-alert',
  templateUrl: './list-alert.component.html'
})
export class ListAlertComponent implements OnInit {
  @Input() public currentAlertType;

  @Output() cancel = new EventEmitter<any>();
  @Output() editAlertEvent = new EventEmitter<any>();

  public alerts;
  public meters;

  constructor(private alertService: AlertService, private alertTypeService: MeterAlertTypesService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.alertService.getModelObserver().subscribe(models => {
      this.alerts = models;
    });
  }

  editAlert(alert) {
    let alertModel = this.alertService.get(alert.id).subscribe(alertResponse => {
      alertResponse.response.id = alert.id;
      this.editAlertEvent.emit(alertResponse.response);
    });
  }

  confirmDelete(id) {
    this.confirmationService.confirm({
      header: 'Confirm Delete',
      message: 'Are you sure that you want to delete this alert?',
      accept: () => {
        this.alertService.remove(id);
      }
    });
  }
}
