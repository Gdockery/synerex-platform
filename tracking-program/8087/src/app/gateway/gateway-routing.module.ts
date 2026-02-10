import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {GatewayDevicesComponent} from './devices/gateway-devices.component';
import {CreateGatewayComponent} from './devices/create-gateway-device.component';
import {EditGatewayComponent} from './devices/edit-gateway-device.component';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import {GatewayComponent} from "./gateway.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: GatewayComponent, canActivate:[ProjectSelectedGuard], children: [
        { path: '', redirectTo:'devices', pathMatch: 'full'},
        { path: 'devices', component: GatewayDevicesComponent, data: {title: 'Gateway - Devices'}},
        { path: 'new', component: CreateGatewayComponent, data: {title: 'Gateway - New Device'}},
        { path: 'detail/:id', component: EditGatewayComponent, data: {title: 'Gateway - Device Detail'}}
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class GatewayRoutingModule { }
