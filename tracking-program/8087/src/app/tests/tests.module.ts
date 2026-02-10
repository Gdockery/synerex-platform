import { NgModule } from '@angular/core';
import {TestsComponent} from "./tests.component";
import {ListTestsComponent} from "./list/list-tests.component";
import {TestsRoutingModule} from "./tests-routing.module";
import {SharedModule} from "../shared/shared.module";
import {TestService} from "./tests.service";
import {MomentModule} from "ngx-moment";
import {CreateTestComponent} from "./create/create-test.component";
import {ReactiveFormsModule} from "@angular/forms";
import {MyDatePickerModule} from "mydatepicker";
import {CycleControlSwitchComponent} from "../switches/control/cycle-control-switch.component";
import {SwitchesModule} from "../switches/switches.module";
import {GatewayModule} from "../gateway/gateway.module";
import {ViewTestComponent} from "./view/view-test.component";
import {TestSavingsService} from "./test-savings.service";
import {TestDataService} from "./test-data.service";
import {ViewTestDataComponent} from "./view/view-test-data.component";
import {ViewTestLinksComponent} from "./view/view-test-links.component";
import {TimepickerModule} from "ngx-bootstrap/timepicker";
import {DataTableModule, DropdownModule} from "primeng/primeng";
import {PipesModule} from "../pipes/pipes.module";
import {NgPipesModule} from "angular-pipes";
import {AdminProjectService} from "../admin/project/admin-project.service";
import {DeviceService} from "../electricityMeters/devices/device.service";

@NgModule({
  imports: [
    TestsRoutingModule,
    SharedModule,
    MomentModule,
    ReactiveFormsModule,
    MyDatePickerModule,
    SwitchesModule,
    GatewayModule,
    TimepickerModule,
    DataTableModule,
    DropdownModule,
    PipesModule,
    NgPipesModule
  ],
  declarations: [
    TestsComponent,
    ListTestsComponent,
    CreateTestComponent,
    ViewTestComponent,
    ViewTestDataComponent,
    ViewTestLinksComponent
  ],
  exports: [TestsComponent],
  providers: [
    TestsComponent,
    ListTestsComponent,
    TestService,
    CycleControlSwitchComponent,
    TestSavingsService,
    TestDataService,
    AdminProjectService,
    DeviceService
  ]
})
export class TestsModule { }
