import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import {SwitchesComponent} from './switches.component';
import {CreateSwitchComponent} from './devices/create-switch.component';
import {CreatePowerFilterComponent} from './devices/create-powerFilter.component';
import {EditSwitchComponent} from './devices/edit-switch.component';
import {SwitchScheduleComponent} from './schedule/switch-schedule.component';
import {CreateSwitchEventComponent} from './schedule/create-switch-event.component';
import {EditSwitchEventComponent} from './schedule/edit-switch-event.component';
import {ListSwitchesComponent} from './devices/list-switches.component';
import {SwitchAlertComponent} from './alert/switch-alert.component';
import {ListSwitchEventComponent} from "./schedule/list-switch-event.component";
import {ListSwitchScheduleComponent} from "./schedule/list-switch-schedule.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: SwitchesComponent, canActivate:[ProjectSelectedGuard], children: [
        { path: 'devices', data: {title: 'Switch Controls'}, children: [
          { path: 'list', component: ListSwitchesComponent, data: {title: 'Switch Controls'}},
          { path: 'new', component: CreateSwitchComponent, data: {title: 'Switch Controls - New Switch'}},
          { path: 'newFilter', component: CreatePowerFilterComponent, data: {title: 'Switch Controls - New Filter'}},
          { path: 'detail/:id', component: EditSwitchComponent, data: {title: 'Switch Controls - Switch detail'}},
          { path: '', redirectTo:'/switches/devices/list' , pathMatch: 'full'}
        ]},
        { path: 'command', component: SwitchScheduleComponent, children: [
          { path: 'list/:schedule', component: ListSwitchEventComponent, data: {title: 'Switch - Commands'}},
          { path: 'list', component: ListSwitchEventComponent, data: {title: 'Switch - Commands'}},
          { path: 'new', component: CreateSwitchEventComponent, data: {title: 'Switch Controls - new event'}},
          { path: 'detail/:id', component: EditSwitchEventComponent, data: {title: 'Switch Controls - Scheduled event detail'}}
        ]},
        { path: 'schedule', component: SwitchScheduleComponent, children: [
          { path: 'list', component: ListSwitchScheduleComponent, data: {title: 'Switch - Schedule'}},
          { path: 'new', component: CreateSwitchEventComponent, data: {title: 'Switch Controls - new schedule'}},
        ]},
        { path: 'alerts', component: SwitchAlertComponent, data: {title: 'Switch Controls - Alerts'}},
        { path: '', redirectTo:'/switches/devices/list' , pathMatch: 'full'}
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class SwitchesRoutingModule { }
