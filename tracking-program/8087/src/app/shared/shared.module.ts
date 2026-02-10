import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarModule } from 'ng-sidebar';
import {SubNavComponent} from "./subNav/subNav.component";
import {SubNavService} from "./subNav/subNav.service";
import {CurrentUserService} from "./user/currentUser.service";
import {UserSelectComponent} from "./forms/user-select.component";
import {MultiSelectComponent} from "./forms/multi-select.component";
import {ProjectSelectedGuard} from "./guards/projectSelected.guard";
import {AuthService} from "./user/auth.service";
import {CsvExportService} from "./csvExport.service";
import {PdfLinkService} from "./pdfLink.service";
import {UserService} from "./user/user.service";
import {MonthYearPickerComponent} from "./forms/month-year-picker.component";
import {TimeHelpers} from "./helpers/timeHelpers.service";
import {ApiHelpers} from "./helpers/apiHelpers.service";
import {NgPipesModule} from "angular-pipes";
import {PipesModule} from "../pipes/pipes.module";
import {DirectivesModule} from "./directives/directives.module";
import {WindowRef} from "./windowRef.component";
import { SessionStorage } from './helpers/sessionStorage.service';

@NgModule({
  imports: [CommonModule, RouterModule, SidebarModule.forRoot(), ReactiveFormsModule, FormsModule, NgPipesModule, PipesModule, DirectivesModule],
  declarations: [
    ToolbarComponent,
    NavbarComponent,
    SubNavComponent,
    UserSelectComponent,
    MultiSelectComponent,
    MonthYearPickerComponent
  ],
  providers: [
    SubNavService,
    //CurrentUserService,// << Removed to allow subnav topbar and side navbar to change properly (navbar still doesn't change, but that's probably due to another duplication somewhere.  See http://stackoverflow.com/a/34718054/486547 and then my message in commit 1924aca5bc8a03abc26117adba5448ad73d26289 for more background)
    ProjectSelectedGuard,
    AuthService,
    // RouterTitleService,
    CsvExportService,
    PdfLinkService,
    UserService,
    TimeHelpers,
    ApiHelpers,
		WindowRef,
		SessionStorage
  ],
  exports: [
    ToolbarComponent,
    NavbarComponent,
    SubNavComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    UserSelectComponent,
    MultiSelectComponent,
    MonthYearPickerComponent,
  ]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: []
    };
  }
}
