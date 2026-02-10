import { NgModule } from '@angular/core';
import {MyDatePickerModule} from "mydatepicker";
import {ReactiveFormsModule} from "@angular/forms";
import {SharedModule} from "../shared/shared.module";
import {SavingsRoutingModule} from "./savings-routing.module";
import {EnergySavingsComponent} from "./energySavings.component";

import {BudgetSavingsComponent} from "./budget-savings.component";
import {BudgetService} from "./budget.service";
import {DataTableModule} from "primeng/primeng";
import {DropdownModule} from 'primeng/primeng';
import {EnergySavingsService} from "./energySavings.service";
import {ChartingModule} from "../charting/charting.module";
import {EnergySavingsFormComponent} from "./energySavings-form.component";
import {SnapshotGaugeComponent} from "./snapshot-gauge.component";
import {Co2SavingsComponent} from "./co2Savings.component";
import {SocketModule} from "../socket/socket.module";
import {Co2SavingsFormComponent} from "./co2Savings-form.component";
import {Co2SavingsService} from "./co2Savings.service";
import {DeviceService} from "../electricityMeters/devices/device.service";
import {CommonModule} from "@angular/common";
import {NgPipesModule} from "angular-pipes";
import {SavingsReportService} from "../billing/savingsReport/savingsReport.service";
import {PipesModule} from "../pipes/pipes.module";
import {PdfLinkService} from "../shared/pdfLink.service";
import {BillAnalyticService} from "../billing/billAnalytic/billAnalytic.service";
import {ModalModule} from "ngx-bootstrap/modal";
import {TimepickerModule} from "ngx-bootstrap/timepicker";


@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    SavingsRoutingModule,
    ChartingModule,
    SocketModule,
    MyDatePickerModule,
    ReactiveFormsModule,
    NgPipesModule,
    PipesModule,
    DataTableModule,
    DropdownModule,
    ModalModule
  ],
  declarations: [
    EnergySavingsComponent,
    EnergySavingsFormComponent,
    Co2SavingsComponent,
    Co2SavingsFormComponent,
    SnapshotGaugeComponent,
    BudgetSavingsComponent,
  ],
  exports: [],
  providers: [
    EnergySavingsComponent,
    BudgetSavingsComponent,
    Co2SavingsComponent,
    EnergySavingsService,
    Co2SavingsService,
    DeviceService,
    SavingsReportService,
    PdfLinkService,
    BillAnalyticService,
    BudgetService,
  ]
})
export class SavingsModule { }
