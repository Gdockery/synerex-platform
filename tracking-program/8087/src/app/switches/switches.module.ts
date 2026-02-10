import { NgModule } from '@angular/core';
import {SharedModule} from "../shared/shared.module";
import {MomentModule} from "ngx-moment";
import {ReactiveFormsModule} from "@angular/forms";
import {MyDatePickerModule} from "mydatepicker";
import {SwitchesRoutingModule} from "./switches-routing.module";
import {SwitchesComponent} from "./switches.component";
import {ListSwitchesComponent} from "./devices/list-switches.component";
import {CreateSwitchComponent} from "./devices/create-switch.component";
import {CreatePowerFilterComponent} from "./devices/create-powerFilter.component";
import {EditSwitchComponent} from "./devices/edit-switch.component";
import {SwitchScheduleComponent} from "./schedule/switch-schedule.component";
import {CreateSwitchEventComponent} from "./schedule/create-switch-event.component";
import {EditSwitchEventComponent} from "./schedule/edit-switch-event.component";
import {SwitchesService} from "./switches.service";
import {SwitchScheduleService} from "./switch-schedule.service";
import {SwitchAlertComponent} from "./alert/switch-alert.component";
import {SwitchAlertEventComponent} from "./alert/event/switch-alert-event.component";
import {CreateSwitchAlertComponent} from "./alert/create/create-switch-alert.component";
import {ModalModule} from "ngx-bootstrap/modal";
import {TimepickerModule} from "ngx-bootstrap/timepicker";
import {ListSwitchAlertComponent} from "./alert/list/list-switch-alert.component";
import {NgPipesModule} from "angular-pipes";
import {SwitchAlertTypesService} from "./alert/switch-alert-type.service";
import {SwitchAlertService} from "./alert/switch-alert.service";
import {SwitchAlertEventService} from "./alert/event/switch-alert-event.service";
import {ControlSwitchComponent} from "./control/control-switch.component";
import {ManualControlSwitchComponent} from "./control/manual-control-switch.component";
import {CycleControlSwitchComponent} from "./control/cycle-control-switch.component";
import {DeviceTypeService} from "./deviceType.service";
import {DataTableModule, DropdownModule, SharedModule as SharedPrimeNg} from 'primeng/primeng';
import {ListSwitchEventComponent} from "./schedule/list-switch-event.component";
import {ListSwitchScheduleComponent} from "./schedule/list-switch-schedule.component";
import {SwitchEventService} from "./schedule/switch-event.service";
import {PipesModule} from "../pipes/pipes.module";
import {DirectivesModule} from "../shared/directives/directives.module";
import {DeviceService} from "../electricityMeters/devices/device.service";


@NgModule({
  imports: [
    NgPipesModule,
    SwitchesRoutingModule,
    SharedModule,
    MomentModule,
    ModalModule.forRoot(),
    TimepickerModule.forRoot(),
    ReactiveFormsModule,
    MyDatePickerModule,
    DataTableModule,
    PipesModule,
    DropdownModule,
    DirectivesModule
  ],
  declarations: [
    SwitchesComponent,
    ListSwitchesComponent,
    ListSwitchAlertComponent,
    SwitchAlertEventComponent,
    CreateSwitchAlertComponent,
    ControlSwitchComponent,
    ManualControlSwitchComponent,
    CycleControlSwitchComponent,
    SwitchAlertComponent,
    CreateSwitchComponent,
    CreatePowerFilterComponent,
    EditSwitchComponent,
    SwitchScheduleComponent,
    CreateSwitchEventComponent,
    EditSwitchEventComponent,
    ListSwitchEventComponent,
    ListSwitchScheduleComponent,
  ],
  exports: [SwitchesComponent, CycleControlSwitchComponent, ],
  providers: [
    SwitchesService,
    SwitchAlertService,
    SwitchAlertTypesService,
    SwitchAlertEventService,
    DeviceTypeService,
    SwitchEventService,
    DeviceService,
    SwitchScheduleService,
  ]
})
export class SwitchesModule { }
