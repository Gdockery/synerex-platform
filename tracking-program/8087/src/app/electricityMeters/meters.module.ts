import { NgModule } from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {MetersComponent} from "./meters.component";
import {ChartingComponent} from "./charting/charting.component";
import {MyDatePickerModule} from "mydatepicker";
import {DevicesComponent} from "./devices/devices.component";
import {CreateDeviceComponent} from "./devices/create-device.component";
import {EditDeviceComponent} from "./devices/edit-device.component";
import {DeviceService} from "./devices/device.service";
import {ModalModule} from "ngx-bootstrap/modal";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AlertService} from "./alert/alert.service";
import {AlertComponent} from "./alert/alert.component";
import {CreateAlertComponent} from "./alert/create/create-alert.component";
import {ListAlertComponent} from "./alert/list/list-alert.component";
import {NgPipesModule} from "angular-pipes";
import {UserSelectComponent} from "../shared/forms/user-select.component";
import {ProjectOverviewService} from "../project/overview/project-overview.service";
import {CsvDataComponent} from "./csvData/csvData.component";
import {CsvDataTypesService} from "./csvData/csvDataType.service";
import {AlertEventComponent} from "./alert/event/alert-event.component";
import {AlertEventService} from "./alert/event/alertEvent.service";
import {CsvDataService} from "./csvData/csvData.service";
import {ListCsvComponent} from "./csvData/list/list-csv.component";
import {CreateCsvComponent} from "./csvData/create/create-csv.component";
import {MomentModule} from "ngx-moment";
import {WindowRef} from "../shared/windowRef.component";
import {MeterAlertTypesService} from "./alert/meterAlertType.service";
import {CsvExportService} from "../shared/csvExport.service";
import {MeterChartService} from "./charting/meter-chart.service";
import {MeterChartComponent} from "./charting/meter-chart.component";
import {DataTableModule} from "primeng/primeng";
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import {RouterModule} from "@angular/router";
import {PipesModule} from "../pipes/pipes.module";
import {ChartingModule} from "../charting/charting.module";
import {DirectivesModule} from "../shared/directives/directives.module";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: MetersComponent, canActivate:[ProjectSelectedGuard], data: {title: 'Electricity Meters'}, children: [
        { path: '', redirectTo:'devices', pathMatch: 'full'},
        { path: 'devices', component: DevicesComponent, data: {title: 'Electricity Meters - Devices'}},
        { path: 'alerts', component: AlertComponent, data: {title: 'Electricity Meters - Alerts'}},
        { path: 'csv-data', component: CsvDataComponent, data: {title: 'Electricity Meters - CSV Data'}},
        { path: 'charting', component: ChartingComponent, data: {title: 'Electricity Meters - Charting'}},
        { path: 'new', component: CreateDeviceComponent, data: {title: 'Electricity Meters - New Device'}},
        { path: 'detail/:id', component: EditDeviceComponent, data: {title: 'Electricity Meters - Device Detail'}}
      ]},
    ]),
    SharedModule,
    MyDatePickerModule,
    ChartingModule,
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
    MetersComponent,
    DevicesComponent,
    CreateDeviceComponent,
    EditDeviceComponent,
    AlertComponent,
    CreateAlertComponent,
    ListAlertComponent,
    ChartingComponent,
    CsvDataComponent,
    AlertEventComponent,
    ListCsvComponent,
    CreateCsvComponent,
    MeterChartComponent
  ],
  exports: [MetersComponent],
  providers: [
    DeviceService,
    AlertService,
    UserSelectComponent,
    AlertEventService,
    AlertEventComponent,
    CsvDataTypesService,
    CsvDataService,
    CsvExportService,
    WindowRef,
    MeterAlertTypesService,
    ProjectOverviewService,
    MeterChartService
  ]
})
export class MetersModule { }
