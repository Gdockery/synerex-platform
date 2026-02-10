import {Component, OnInit, ViewChild} from '@angular/core';
import {SubNavService} from "../../shared/subNav/subNav.service";
import {ModalDirective} from "ngx-bootstrap/modal";
import {SwitchAlertService} from "./switch-alert.service";
import {SwitchAlertTypesService} from "./switch-alert-type.service";

@Component({
  templateUrl: 'switch-alert.component.html',
  styleUrls: ['switch-alert.component.scss'],
})
export class SwitchAlertComponent implements OnInit {

  protected type = 0;
  protected modelObserver;
  protected alerts;
  protected currentAlert;

  @ViewChild('editAlertModal', {static: false}) public editAlertModal:ModalDirective;

  constructor(protected subnavService: SubNavService, private typeService: SwitchAlertTypesService, private switchAlertService: SwitchAlertService) {}

  ngOnInit() {
    this.subnavService.title = 'Switch Alerts';
    this.switchAlertService.loadModels();
    this.modelObserver = this.switchAlertService.getModelObserver().subscribe(models => {
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
