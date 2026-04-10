import { NgModule } from '@angular/core';
import {DropdownModule} from 'primeng/primeng';
import {SharedModule} from "../shared/shared.module";
import {MyDatePickerModule} from "mydatepicker";
import {ReactiveFormsModule, FormsModule} from "@angular/forms";
import {AdminRoutingModule} from "./admin-routing.module";
import {AdminComponent} from "./admin.component";
import {ClientListComponent} from "./client/list-client.component";
import {DataTableModule} from "primeng/primeng";
import {ClientEditComponent} from "./client/edit-client.component";
import {TextMaskModule} from "angular2-text-mask";
import {AdvancedOptionsComponent} from "./advanced-options.component";
import {ClientCreateComponent} from "./client/create-client.component";
import {ProjectCreateComponent} from "./project/create-project.component";
import {ProjectEditComponent} from "./project/edit-project.component";
import {ProjectListComponent} from "./project/list-project.component";
import {UserListComponent} from "./user/list-user.component";
import {CreateUserComponent} from "./user/create-user.component";
import {EditUserComponent} from "./user/edit-user.component";
import {MomentModule} from "ngx-moment";
import {ClientService} from "./client/client.service";
import {AdminProjectService} from "./project/admin-project.service";
import {UserService} from "../shared/user/user.service";
import {DeviceService} from "../electricityMeters/devices/device.service";
import { FileUploadModule } from 'primeng/components/fileupload/fileupload';
import {EnergySavingsService} from "../savings/energySavings.service";
import {OemBrandingComponent} from "./branding/oem-branding.component";
import {ManageSubscriptionComponent} from "./subscription/manage-subscription.component";
import {CompanySettingsComponent} from "./company/company-settings.component";
import {OemListComponent} from "./oem/list-oem.component";
import {ApiHelpers} from "../shared/helpers/apiHelpers.service";
import {TimeHelpers} from "../shared/helpers/timeHelpers.service";

@NgModule({
  imports: [
    SharedModule,
    AdminRoutingModule,
    MyDatePickerModule,
    MomentModule,
    ReactiveFormsModule,
    FormsModule,
    DataTableModule,
    TextMaskModule,
    DropdownModule,
    FileUploadModule,
  ],
  declarations: [
    AdminComponent,
    ClientListComponent,
    ClientEditComponent,
    ClientCreateComponent,
    AdvancedOptionsComponent,
    ProjectListComponent,
    ProjectCreateComponent,
    ProjectEditComponent,
    UserListComponent,
    CreateUserComponent,
    EditUserComponent,
    OemBrandingComponent,
    ManageSubscriptionComponent,
    CompanySettingsComponent,
    OemListComponent,
  ],
  exports: [AdminComponent],
  providers: [
    ClientService,
    AdminProjectService,
    EnergySavingsService,
    UserService,
    DeviceService,
    ApiHelpers,
    TimeHelpers,
  ]
})
export class AdminModule { }
