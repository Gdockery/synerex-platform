import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SwitchAlertService} from "../switch-alert.service";
import {ConfirmationService} from "primeng/primeng";

@Component({
  selector: 'list-switch-alert',
  template: `
    <div class="content-box">
      <h3>Set {{currentType.name}} Switch alerts</h3>
      <div class="box" style="display:block;" *ngFor="let alert of alerts | where:['alertType', currentType.id] | orderBy:'-id'">
        <div class="container-fluid">
          <div class="col-md-12">
            <div class="left">
              Lost communication for {{alert.threshold}} minutes
            </div>
            <div class="pull-right">
              <a (click)="editAlert(alert)"><span class="ss-write"></span>Edit</a>
              <a (click)="confirmDelete(alert.id)"><span class="ss-trash"></span>Delete</a>
            </div>
          </div>
          <div class="col-md-6">
            <span>{{alert.deviceCount}} switches selected</span>
          </div>
          <div class="col-md-12">
            {{alert.note}}
          </div>
          <div class="col-md-12" style="margin-top: 20px;">
            <span class="list-comma" *ngFor="let user of alert.users;">{{user.email}}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ListSwitchAlertComponent implements OnInit {
  @Input() public currentType;
  @Output() editAlertEvent = new EventEmitter<any>();

  public alerts;

  constructor(private alertService: SwitchAlertService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.alertService.getModelObserver().subscribe(data => {
      this.alerts = data;
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
