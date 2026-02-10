import { NgModule } from '@angular/core';
import {ProjectSelectComponent} from "./select/project-select.component";
import {ProjectCreateComponent} from './select/create-project.component';
import {ProjectEditComponent} from './select/edit-project.component';
import {ClientListComponent} from './client/list-client.component';
import {ClientEditComponent} from './client/edit-client.component';
import {ClientCreateComponent} from './client/create-client.component';
import {ProjectRoutingModule} from "./project-routing.module";
import {DataTableModule} from "primeng/primeng";
import {ProjectOverviewComponent} from "./overview/project-overview.component";
import {SharedModule} from "../shared/shared.module";
import {ProjectComponent} from "./project.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ProjectOverviewService} from "./overview/project-overview.service";
import {MyDatePickerModule} from "mydatepicker";
import {ClientService} from "./client/client.service";
import {ChartingModule} from "../charting/charting.module";
import {PowerQualityComponent} from "./powerQuality/power-quality.component";
import {SnapshotGaugeComponent} from "./powerQuality/snapshot-gauge.component";
import {SocketModule} from "../socket/socket.module";
import {DeviceService} from "../electricityMeters/devices/device.service";
import {CommonModule} from "@angular/common";
import {BillAnalyticCalculationsService} from "../billing/billAnalytic/billAnalytic-calculation.service";
import {PartService} from "../billing/equipment/parts.service";
import {NgPipesModule} from "angular-pipes";
import {ProjectCurrencyPipe} from "../pipes/projectCurrencyPipe.pipe";
import {PipesModule} from "../pipes/pipes.module";
import {EnergySavingsService} from "../savings/energySavings.service";
import {AdminProjectService} from "./select/admin-project.service";
import { FileUploadModule } from 'primeng/components/fileupload/fileupload'; 


@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MyDatePickerModule,
    ProjectRoutingModule,
    ChartingModule,
    FormsModule,
    ReactiveFormsModule,
    SocketModule,
    NgPipesModule,
    PipesModule,
    DataTableModule,
    FileUploadModule
  ],
  declarations: [
    ProjectComponent,
    ProjectSelectComponent,
    ProjectCreateComponent,
    ProjectEditComponent,
    ClientListComponent,
    ClientEditComponent,
    ClientCreateComponent,
    ProjectOverviewComponent,
    PowerQualityComponent,
    SnapshotGaugeComponent,

  ],
  exports: [],
  providers: [
    ProjectOverviewService,
    EnergySavingsService,
    ClientService,
    DeviceService,
    PartService,
    BillAnalyticCalculationsService,
    AdminProjectService,
  ]
})
export class ProjectModule { }
