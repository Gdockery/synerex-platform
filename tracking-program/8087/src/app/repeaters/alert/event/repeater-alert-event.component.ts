import {Component, Inject, OnInit} from '@angular/core';
import {RepeaterAlertTypesService} from "../repeater-alert-type.service";
import {RepeaterAlertEventService} from "./repeater-alert-event.service";

@Component({
  selector: 'repeater-alert-events',
  template: `
    <h3>History</h3>
    <ul class="list-group">
      <li *ngFor="let event of events" class="list-group-item">
        {{(event.createdAt | projectTzMoment) | amDateFormat:'MM/DD/YYYY hh:mm:ss A'}}
         - {{event.device.name}}
         - {{repeaterAlertTypeService.getType(event.alert.alertType).name}}
      </li>
    </ul>
  `
})
export class RepeaterAlertEventComponent  implements OnInit {

  private events;

  constructor(private repeaterAlertEventService: RepeaterAlertEventService, private repeaterAlertTypeService: RepeaterAlertTypesService) {}

  ngOnInit() {
    this.repeaterAlertEventService.getAll().subscribe(events => {
      this.events = events.response;
    });
  }
}
