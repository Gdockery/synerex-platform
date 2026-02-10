import {Component, EventEmitter, Output} from '@angular/core';

import * as moment from 'moment';

@Component({
  selector: 'control-switch',
  template: `
    <div class="container-fluid">
      <div class="col-md-6" style="border-right: 1px solid #e0e0e0;">
        <manual-control-switch (submitEvent)="submitControl($event)"></manual-control-switch>
      </div>
      <div class="col-md-6" style="border-left: 1px solid #e0e0e0;height:100%;">
        <cycle-control-switch (submitEvent)="submitControl($event)"></cycle-control-switch>
      </div>
    </div>
  `,
  styles: [ `
    .radio {
      display:inline-block;
      margin:0 5px;
    }
  `]
})
export class ControlSwitchComponent {

  @Output() submitEvent = new EventEmitter<any>();

  submitControl(data) {
    this.submitEvent.emit(data);
  }
}
