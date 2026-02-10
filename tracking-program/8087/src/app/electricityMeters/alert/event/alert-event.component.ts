import {Component, Inject, OnInit} from '@angular/core';
import {AlertEventService} from "./alertEvent.service";
import {MeterAlertTypesService} from "../meterAlertType.service";

@Component({
  selector: 'alert-events',
  template: `
    <div class="content-box">
      <h3>History</h3>
      <ul class="list-group">
        <li *ngFor="let event of events" class="list-group-item">
          {{(event.createdAt | projectTzMoment) | amDateFormat:'MM/DD/YYYY hh:mm:ss A'}}
           - {{event.device.name}}
           - {{meterAlertTypeService.getType(event.alert.alertType).name}}
        </li>
      </ul>
    </div>
  `
})
export class AlertEventComponent  implements OnInit {

  public events = [];

  constructor(private alertEventService: AlertEventService, private meterAlertTypeService: MeterAlertTypesService) {}

  ngOnInit() {
    this.alertEventService.getAll().subscribe(events => {
      this.events = events.response;
    });
  }
}
