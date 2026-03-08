import {Component, OnInit, ViewChild} from '@angular/core';
import {RepeaterAlertTypesService} from "./repeater-alert-type.service";
import {RepeaterAlertService} from "./repeater-alert.service";
import {ModalDirective} from "ngx-bootstrap/modal";

@Component({
  templateUrl: './repeater-alert.component.html',
  styleUrls: ['./repeater-alert.component.scss'],
})
export class RepeaterAlertComponent implements OnInit {

  protected type = 0;
  protected modelObserver;
  protected alerts;
  protected currentAlert;

  @ViewChild('editAlertModal', {static: false}) public editAlertModal:ModalDirective;

  constructor(private typeService: RepeaterAlertTypesService, private repeaterAlertService: RepeaterAlertService) {}

  ngOnInit() {
    this.repeaterAlertService.loadModels();
    this.modelObserver = this.repeaterAlertService.getModelObserver().subscribe(models => {
      this.typeService.updateCounts(models);
      this.alerts = models;
    });
  }

  selectType(type) {
    this.type = type;
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
