import { NgModule } from '@angular/core';
import {SharedModule} from "../shared/shared.module";
import {MomentModule} from "ngx-moment";
import {ReactiveFormsModule} from "@angular/forms";
import {MyDatePickerModule} from "mydatepicker";
import {EquipmentsRoutingModule} from "./equipments-routing.module";
import {EquipmentsComponent} from "./equipments.component";
import {EquipmentSavingsComponent} from "./equipment-savings.component";
import {ListEquipmentsComponent} from "./devices/list-equipments.component";
import {CreateEquipmentComponent} from "./devices/create-equipment.component";
import {EditEquipmentComponent} from "./devices/edit-equipment.component";
import {CreateEquipmentEventComponent} from "./schedule/create-equipment-event.component";
import {EditEquipmentEventComponent} from "./schedule/edit-equipment-event.component";
import {EquipmentsService} from "./equipments.service";
import {EquipmentScheduleService} from "./equipment-schedule.service";
import { ModalModule } from "ngx-bootstrap/modal";
import {ChartingModule} from "../charting/charting.module";
import { TimepickerModule } from "ngx-bootstrap/timepicker";
import {NgPipesModule} from "angular-pipes";
import {DeviceTypeService} from "./deviceType.service";
import {DataTableModule, DropdownModule, SharedModule as SharedPrimeNg} from 'primeng/primeng';
import {ListEquipmentEventComponent} from "./schedule/list-equipment-event.component";
import {EquipmentEventService} from "./schedule/equipment-event.service";
import {PipesModule} from "../pipes/pipes.module";
import {DirectivesModule} from "../shared/directives/directives.module";
import {ListEquipmentScheduleComponent} from "./schedule/list-equipment-schedule.component";
import {EnergySavingsService} from "../savings/energySavings.service";
import {DeviceService} from "../electricityMeters/devices/device.service";


@NgModule({
  imports: [
    NgPipesModule,
    EquipmentsRoutingModule,
    SharedModule,
    MomentModule,
    ModalModule.forRoot(),
    TimepickerModule.forRoot(),
    ReactiveFormsModule,
    MyDatePickerModule,
    DataTableModule,
    PipesModule,
    DropdownModule,
    DirectivesModule,
    ChartingModule
  ],
  declarations: [
    EquipmentsComponent,
    ListEquipmentsComponent,
    CreateEquipmentComponent,
    EditEquipmentComponent,
    CreateEquipmentEventComponent,
    EditEquipmentEventComponent,
    ListEquipmentEventComponent,
    ListEquipmentScheduleComponent,
    EquipmentSavingsComponent,
  
  ],
  exports: [EquipmentsComponent],
  providers: [
    EquipmentsService,
    DeviceTypeService,
    EquipmentEventService,
    EquipmentScheduleService,
    EnergySavingsService,
    DeviceService,
  ]
})
export class EquipmentsModule { }
