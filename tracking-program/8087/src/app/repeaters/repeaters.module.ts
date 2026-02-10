import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {MyDatePickerModule} from "mydatepicker";
import {ChartsModule} from "ng2-charts";
import {ModalModule} from "ngx-bootstrap/modal";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgPipesModule} from "angular-pipes";
import {MomentModule} from "ngx-moment";
import {RepeaterAlertComponent} from "./alert/repeater-alert.component";
import {RepeatersRoutingModule} from "./repeaters-routing.module";
import {RepeatersComponent} from "./repeaters.component";
import {CreateRepeaterComponent} from './devices/create-repeater-device.component';
import {EditRepeaterComponent} from './devices/edit-repeater-device.component';
import {RepeaterDevicesComponent} from "./devices/repeater-devices.component";
import {RepeaterService} from "./devices/repeater-device.service";
import {RepeaterAlertService} from "./alert/repeater-alert.service";
import {ListRepeaterAlertComponent} from "./alert/list/list-repeater-alert.component";
import {CreateRepeaterAlertComponent} from "./alert/create/create-repeater-alert.component";
import {RepeaterAlertTypesService} from "./alert/repeater-alert-type.service";
import {RepeaterAlertEventService} from "./alert/event/repeater-alert-event.service";
import {RepeaterAlertEventComponent} from "./alert/event/repeater-alert-event.component";
import {DataTableModule} from 'primeng/primeng';
import {PipesModule} from "../pipes/pipes.module";
import {DirectivesModule} from "../shared/directives/directives.module";

@NgModule({
  imports: [
    RepeatersRoutingModule,
    SharedModule,
    MyDatePickerModule,
    ChartsModule,
    ModalModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    NgPipesModule,
    MomentModule,
    DataTableModule,
    PipesModule,
    DirectivesModule
  ],
  declarations: [
    RepeatersComponent,
    RepeaterDevicesComponent,
    RepeaterAlertComponent,
    ListRepeaterAlertComponent,
    CreateRepeaterAlertComponent,
    RepeaterAlertEventComponent,
    CreateRepeaterComponent,
    EditRepeaterComponent
  ],
  exports: [RepeatersComponent],
  providers: [
    RepeaterService,
    RepeaterAlertService,
    RepeaterAlertTypesService,
    RepeaterAlertEventService
  ]
})
export class RepeatersModule { }
