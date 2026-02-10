import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {RepeaterAlertComponent} from './alert/repeater-alert.component';
import {RepeaterDevicesComponent} from './devices/repeater-devices.component';
import {CreateRepeaterComponent} from './devices/create-repeater-device.component';
import {EditRepeaterComponent} from './devices/edit-repeater-device.component';
import {RepeatersComponent} from './repeaters.component';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: RepeatersComponent, canActivate:[ProjectSelectedGuard], children: [
        { path: '', redirectTo:'devices', pathMatch: 'full'},
        { path: 'devices', component: RepeaterDevicesComponent, data: {title: 'Repeaters - Devices'}},
        { path: 'alerts', component: RepeaterAlertComponent, data: {title: 'Repeaters - Alerts'}},
        { path: 'new', component: CreateRepeaterComponent, data: {title: 'Repeaters - New Device'}},
        { path: 'detail/:id', component: EditRepeaterComponent, data: {title: 'Repeaters - Device Detail'}}
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class RepeatersRoutingModule { }
