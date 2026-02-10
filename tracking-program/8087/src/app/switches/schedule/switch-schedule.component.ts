import {Component} from '@angular/core';
import {SwitchEventService} from "./switch-event.service";

@Component({
  template: `
    <div class="content-box">
    
      <router-outlet></router-outlet>
    </div>
  `
})
export class SwitchScheduleComponent {

  constructor(switchScheduleService: SwitchEventService) {}

}
