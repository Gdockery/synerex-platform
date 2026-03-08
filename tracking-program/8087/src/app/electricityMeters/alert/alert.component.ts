import {Component, OnInit, ViewChild} from '@angular/core';
import {AlertService} from "./alert.service";
import {ModalDirective} from "ngx-bootstrap/modal";
import {MeterAlertTypesService} from "./meterAlertType.service";

@Component({
  templateUrl: './alert.component.html',
})
export class AlertComponent implements OnInit {

  protected alertType = 0;
  protected currentAlert = null;
  @ViewChild('editAlertModal', {static: false}) public editAlertModal:ModalDirective;

  constructor(protected alertTypeService: MeterAlertTypesService, protected alertService: AlertService) {}

  ngOnInit() {
    this.alertService.getModelObserver().subscribe(data => {
      this.alertTypeService.updateCounts(data);
    });
    this.alertService.loadModels();
  }

  selectAlertType(alertType) {
    this.alertType = alertType;
  }

  cancelCreate() {
    this.alertType = 0;
  }

  cancelEdit() {
    this.currentAlert = null;
    this.editAlertModal.hide();
  }

  editAlert(alert) {
    this.currentAlert = alert;
    this.editAlertModal.show();
  }
}
