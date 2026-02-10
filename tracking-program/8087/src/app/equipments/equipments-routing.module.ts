import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import {EquipmentsComponent} from './equipments.component';
import {EquipmentSavingsComponent} from './equipment-savings.component';
import {CreateEquipmentComponent} from './devices/create-equipment.component';
import {EditEquipmentComponent} from './devices/edit-equipment.component';
import {CreateEquipmentEventComponent} from './schedule/create-equipment-event.component';
import {EditEquipmentEventComponent} from './schedule/edit-equipment-event.component';
import {ListEquipmentsComponent} from './devices/list-equipments.component';
import {ListEquipmentEventComponent} from "./schedule/list-equipment-event.component";
import {ListEquipmentScheduleComponent} from "./schedule/list-equipment-schedule.component";
import {MeterChartComponent} from './charting/meter-chart.component';



@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: EquipmentsComponent, canActivate:[ProjectSelectedGuard], children: [
        { path: 'devices', data: {title: 'Equipment Controls'}, children: [
          { path: 'list', component: ListEquipmentsComponent, data: {title: 'Equipment Controls'}},
          { path: 'new', component: CreateEquipmentComponent, data: {title: 'Equipment Controls - New Equipment Scheduler'}},
          { path: 'savings/:id', component: EquipmentSavingsComponent, data: {title: 'Equipment Savings'}},
          { path: 'detail/:id', component: EditEquipmentComponent, data: {title: 'Equipment Controls - Switch detail'}},
          { path: '', redirectTo:'/equipments/devices/list' , pathMatch: 'full'}
        ]},
        { path: 'command', data: {title: 'Equipment Commands'}, children: [
          { path: 'list', component: ListEquipmentEventComponent, data: {title: 'Equipment Scheduler - commands'}},
          { path: 'new', component: CreateEquipmentEventComponent, data: {title: 'Equipment Controls - Schedule new event'}},
          { path: 'detail/:id', component: EditEquipmentEventComponent, data: {title: 'Equipment Controls - Scheduled event detail'}}
        ]},
        { path: 'schedule', data: {title: 'Equipment Schedules'}, children: [
          { path: 'list', component: ListEquipmentScheduleComponent, data: {title: 'Equipment Controls - Schedule'}},
          { path: 'new', component: CreateEquipmentEventComponent, data: {title: 'Equipment Controls - Schedule new event'}},
        ]},
        { path: 'savings/:id', data: {title: 'Equipment Savings'}, children: [
          { path: '', component: EquipmentSavingsComponent, data: {title: 'Equipment Savings'}},
        ]},
        { path: '', redirectTo:'/equipments/devices/list' , pathMatch: 'full'}
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class EquipmentsRoutingModule { }
