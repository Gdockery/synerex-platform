import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MetersComponent } from './meters.component';
import {ChartingComponent} from "./charting/charting.component";
import {CsvDataComponent} from "./csvData/csvData.component";
import {DevicesComponent} from "./devices/devices.component";
import {AlertComponent} from './alert/alert.component'
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: MetersComponent, canActivate:[ProjectSelectedGuard], data: {title: 'Electricity Meters'}, children: [
        { path: '', redirectTo:'devices', pathMatch: 'full'},
        { path: 'devices', component: DevicesComponent, data: {title: 'Electricity Meters - Devices'}},
        { path: 'alerts', component: AlertComponent, data: {title: 'Electricity Meters - Alerts'}},
        { path: 'csv-data', component: CsvDataComponent, data: {title: 'Electricity Meters - CSV Data'}},
        { path: 'charting', component: ChartingComponent, data: {title: 'Electricity Meters - Charting'}},
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class MetersRoutingModule { }
