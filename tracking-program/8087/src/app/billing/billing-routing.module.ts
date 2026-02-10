import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {CreateBillAnalyticComponent} from "./billAnalytic/create-billAnalytic.component";
import {ViewEditEquipmentsComponent} from "./billAnalytic/view-edit-equipments.component";
import {ListBillAnalyticComponent} from "./billAnalytic/list-billAnalytic.component";
import {ListSavingsReportComponent} from "./savingsReport/list-savingsReport.component";
import {CreateSavingsReportComponent} from "./savingsReport/create-savingsReport.component";
import {InvoiceComponent} from "./invoice/invoice.component";
import {BillingComponent} from "./billing.component";
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import { FileUploadModule } from 'primeng/components/fileupload/fileupload';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: BillingComponent, canActivate:[ProjectSelectedGuard], children: [
        { path: 'bill-analytic', children: [
          { path: 'create', component: CreateBillAnalyticComponent, data: {title: 'Create Bill Analytic'}, },
          { path: 'equipments/:meterNumber', component: ViewEditEquipmentsComponent, data: {title: 'Create/Edit Equipments'}, },
          { path: 'equipments', component: ViewEditEquipmentsComponent, data: {title: 'Create/Edit Equipments'}, },
          { path: 'edit/:index', component: CreateBillAnalyticComponent, data: {title: 'Edit Bill Analytic'}},
          { path: 'list', component: ListBillAnalyticComponent, data: {title: 'List Bill Analytics'}},
          
        ]},
        { path: 'project-documents', component: InvoiceComponent , data: {title: 'Project Documents'}},
        { path: 'savings-report', data: {title: 'Savings Report'}, children: [
          { path: 'list', component: ListSavingsReportComponent, data: {title: 'Savings Reports'}}, 
          { path: 'create', component: CreateSavingsReportComponent, data: {title: 'Savings Report - Create'}},
          { path: 'edit/:id', component: CreateSavingsReportComponent, data: {title: 'Savings Report - Edit'}}
        ]}, 
        { path: '**', redirectTo:'savings-report/list' }
      ]},
    ]), 
    FileUploadModule
  ],
  exports: [RouterModule, FileUploadModule]
})
export class AnalyticRoutingModule { }
