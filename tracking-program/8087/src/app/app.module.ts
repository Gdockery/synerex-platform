import {NgModule} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { AppComponent } from './app.component';
import {ApiHelpers} from './shared/helpers/apiHelpers.service';
import {TimeHelpers} from './shared/helpers/timeHelpers.service';
import { AppRoutingModule } from './app-routing.module';
import {CommonModule} from "@angular/common";
import { SharedModule } from './shared/shared.module';
import { SidebarModule } from 'ng-sidebar';
import { NotFoundComponent } from './notFound/notFound.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import {AppConfig, APP_CONFIG} from "./config/app.config";
import {CurrentUserService} from "./shared/user/currentUser.service";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ModalModule} from "ngx-bootstrap/modal";
import {ReactiveFormsModule} from "@angular/forms";
import {RouterTitleService} from "./shared/routerTitle.service";
import {ApiModule} from "./api/api.module";
import {TIMEZONES} from "./config/timezones";
import {COUNTRIES} from "./config/countries";
import {USER_ROLES} from "./config/userRoles";
import {ELECTRICITY_CHARGE_TYPES} from "./config/electricityChargeTypes";
import {TIER_HOURS} from "./config/tierHours";
import { FileUploadModule } from 'primeng/components/fileupload/fileupload';
import { MyAccountComponent } from './my-account/my-account.component';
import { HomeRedirectComponent } from './home-redirect/home-redirect.component';
import {SubNavService} from "./shared/subNav/subNav.service";
import {ConfirmationService, ConfirmDialogModule} from "primeng/primeng";
import {NgProgressModule} from "ngx-progressbar";
import {PipesModule} from "./pipes/pipes.module";
import {AccountService} from "./my-account/account.service";
import {ProjectCurrencyPipe} from "./pipes/projectCurrencyPipe.pipe";
import {CURRENCIES} from "./config/currencies";
import {GlobalNotificationService} from "./shared/globalNotification.service";
import {SocketService} from "./socket/socket.service";
import { PaymentModule } from './payment/payment.module';
import { PaymentService } from './payment/payment.service';
import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ApiBaseInterceptor } from './api/api-base.interceptor';
import {NgPipesModule} from "angular-pipes";
//import { HighchartsChartModule } from 'highcharts-angular';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SidebarModule.forRoot(),
    SharedModule.forRoot(),
    ModalModule.forRoot(),
    ReactiveFormsModule,
    AppRoutingModule,
    ApiModule,
    ConfirmDialogModule,
    NgProgressModule,
    PipesModule,
    PaymentModule,
    //HighchartsChartModule,
    HttpClientModule,
    HttpClientXsrfModule.withOptions({
			//config.locals._csrf
			//document.cookie = '_xsrf=' + AppConfig.locals._csrf
			cookieName: "_xsrf",
			headerName: "x-csrf-token"
		}),
    FileUploadModule ,
    CommonModule,
    NgPipesModule,
  ],
  declarations: [
    AppComponent,
    MyAccountComponent,
    WelcomeComponent,
    MaintenanceComponent,
    NotFoundComponent,
    HomeRedirectComponent
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: ''},
    {provide: APP_CONFIG, useValue: AppConfig},
    {provide: 'TIMEZONES', useValue: TIMEZONES},
    {provide: 'COUNTRIES', useValue: COUNTRIES},
    {provide: 'USER_ROLES', useValue: USER_ROLES},
    {provide: 'ELECTRICITY_CHARGE_TYPES', useValue: ELECTRICITY_CHARGE_TYPES},
    {provide: 'TIER_HOURS', useValue: TIER_HOURS},
    {provide: 'CURRENCIES', useValue: CURRENCIES},
    CurrentUserService,
    RouterTitleService,
    SubNavService,
    ConfirmationService,
    AccountService,
    GlobalNotificationService,
    SocketService,
    PaymentService,
    { provide: HTTP_INTERCEPTORS, useClass: ApiBaseInterceptor, multi: true },
    ApiHelpers,
    TimeHelpers,

  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
