import {Component, OnInit} from '@angular/core';
import {SwitchAlertTypesService} from "../switch-alert-type.service";
import {SwitchAlertEventService} from "./switch-alert-event.service";

@Component({
  selector: 'switch-alert-events',
  template: `
    <h3>History</h3>
    <ul class="list-group">
      <li *ngFor="let event of events" class="list-group-item">
        {{(event.createdAt | projectTzMoment) | amDateFormat:'MM/DD/YYYY hh:mm:ss MM/DD/YYYY hh:mm:ss A'}}
         - {{event.device.name}}
         - {{alertTypeService.getType(event.alert.alertType).name}}
      </li>
    </ul>
  `
})
export class SwitchAlertEventComponent  implements OnInit {

  private events;

  constructor(private alertEventService: SwitchAlertEventService, private alertTypeService: SwitchAlertTypesService) {}

  ngOnInit() {
    this.alertEventService.getAll().subscribe(events => {
      this.events = events.response;
    });
  }
}
