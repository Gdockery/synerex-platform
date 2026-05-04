import { NgModule } from '@angular/core';
import {DropdownModule} from 'primeng/primeng';
import {SharedModule} from "../shared/shared.module";
import {MyDatePickerModule} from "mydatepicker";
import {ReactiveFormsModule} from "@angular/forms";
import {DataTableModule} from "primeng/primeng";
import {TextMaskModule} from "angular2-text-mask";
import {CreateBillAnalyticComponent} from "./billAnalytic/create-billAnalytic.component";
import {ViewEditEquipmentsComponent} from "./billAnalytic/view-edit-equipments.component";
import {ListBillAnalyticComponent} from "./billAnalytic/list-billAnalytic.component";
import {BillAnalyticFormComponent} from "./billAnalytic/billAnalytic-form.component";
import {BillAnalyticService} from "./billAnalytic/billAnalytic.service";
import {MomentModule} from "ngx-moment";
import {EquipmentFormComponent} from "./billAnalytic/equipment-form.component";
import {ItemService} from "./equipment/items.service";
import {PartService} from "./equipment/parts.service";
import {BillAnalyticCalculationsService} from "./billAnalytic/billAnalytic-calculation.service";
import {AnalyticRoutingModule} from "./billing-routing.module";
import {ListSavingsReportComponent} from "./savingsReport/list-savingsReport.component";
import {CreateSavingsReportComponent} from "./savingsReport/create-savingsReport.component";
import {SavingsReportService} from "./savingsReport/savingsReport.service";
import {AdminProjectService} from "../admin/project/admin-project.service";
import {SavingsReportFormComponent} from "./savingsReport/savingsReport-form.component";
import {LineItemFormComponent} from "./lineItem-form.component";
import {RouterTitleService} from "../shared/routerTitle.service";
import {PipesModule} from "../pipes/pipes.module";
import {InvoiceComponent} from "./invoice/invoice.component";
import {BillingComponent} from "./billing.component";
import {DeviceService} from "../electricityMeters/devices/device.service";
import {CreateFromBillService} from "../project/create-from-bill/create-from-bill.service";
import {ClientService} from "../admin/client/client.service";
import {SldService} from "./savingsReport/sld.service";
import {MyJobsService} from "./savingsReport/my-jobs.service";
import {GpuQueueComponent} from "./savingsReport/gpu-queue.component";
import {NgPipesModule} from "angular-pipes";
import {EnergySavingsService} from "../savings/energySavings.service";
import {CommonModule} from "@angular/common";
import { ModalModule } from "ngx-bootstrap/modal";
import { TimepickerModule } from "ngx-bootstrap/timepicker";

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    AnalyticRoutingModule,
    MyDatePickerModule,
    MomentModule,
    ReactiveFormsModule,
    DataTableModule,
    TextMaskModule,
    DropdownModule,
    PipesModule,
    NgPipesModule,
    ModalModule,
    TimepickerModule,
  ],
  declarations: [
    BillingComponent, 
    CreateBillAnalyticComponent,
    ViewEditEquipmentsComponent,
    ListBillAnalyticComponent,
    BillAnalyticFormComponent,
    EquipmentFormComponent,
    ListSavingsReportComponent,
    CreateSavingsReportComponent,
    SavingsReportFormComponent,
    LineItemFormComponent,
    InvoiceComponent,
    GpuQueueComponent,
  ],
  exports: [],
  providers: [
    AdminProjectService,
    BillAnalyticService,
    CreateFromBillService,
    ItemService,
    PartService,
    BillAnalyticCalculationsService,
    SavingsReportService,
    RouterTitleService,
    DeviceService,
    EnergySavingsService,
    ClientService,
    SldService,
    MyJobsService,
  ]
})
export class BillingModule { }
