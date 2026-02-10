import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {MyDatePickerModule} from "mydatepicker";
import {ChartsModule} from "ng2-charts";
import {ModalModule} from "ngx-bootstrap/modal";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgPipesModule} from "angular-pipes";
import {MomentModule} from "ngx-moment";
import {DataTableModule} from 'primeng/primeng';
import {PipesModule} from "../pipes/pipes.module";
import {DirectivesModule} from "../shared/directives/directives.module";
import {GatewayRoutingModule} from "./gateway-routing.module";
import {GatewayComponent} from "./gateway.component";
import {GatewayDevicesComponent} from "./devices/gateway-devices.component";
import {CreateGatewayComponent} from "./devices/create-gateway-device.component";
import {EditGatewayComponent} from "./devices/edit-gateway-device.component";
import {GatewayService} from "./devices/gateway-device.service";

@NgModule({
  imports: [
    GatewayRoutingModule,
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
    GatewayComponent,
    GatewayDevicesComponent,
    CreateGatewayComponent,
    EditGatewayComponent
  ],
  exports: [GatewayComponent],
  providers: [
    GatewayService
  ]
})
export class GatewayModule { }
