import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent }          from './dashboard/dashboard.component';
import { EnterpriseDashboardComponent }  from './enterprise-dashboard/enterprise-dashboard.component';
import { CapacityComponent }            from './capacity/capacity.component';
import { DigitalTwinComponent }         from './digital-twin/digital-twin.component';
import { SitesComponent }               from './sites/sites.component';
import { TransformersComponent }        from './transformers/transformers.component';
import { ElectricalNetworkComponent }   from './electrical-network/electrical-network.component';
import { CurrentAnalysisComponent }     from './current-analysis/current-analysis.component';
import { SavingsComponent }             from './savings/savings.component';
import { AlarmsComponent }              from './alarms/alarms.component';
import { AlarmConfigComponent }         from './alarm-config/alarm-config.component';
import { AlertRulesComponent }          from './alert-rules/alert-rules.component';
import { ReportsComponent }             from './reports/reports.component';
import { DevicesComponent }             from './devices/devices.component';
import { SettingsComponent }            from './settings/settings.component';
import { UtilityComponent }             from './utility/utility.component';
import { FinancialDashboardComponent }  from './financial-dashboard/financial-dashboard.component';
import { JobCostingComponent }          from './job-costing/job-costing.component';
import { InvoicingComponent }           from './invoicing/invoicing.component';
import { PaymentsComponent }            from './payments/payments.component';
import { RatesTariffsComponent }        from './rates-tariffs/rates-tariffs.component';
import { ProfitabilityComponent }       from './profitability/profitability.component';
import { UBillTrackerComponent }        from './ubill-tracker/ubill-tracker.component';
import { UBillForecastComponent }       from './ubill-forecast/ubill-forecast.component';
import { DeploymentListComponent }          from './deployment/deployment-list.component';
import { DeploymentLayoutComponent }        from './deployment/deployment-layout.component';
import { DeploymentActiveComponent }        from './deployment/deployment-active.component';
import { DeploymentPreComponent }           from './deployment/deployment-pre.component';
import { DeploymentElectricalComponent }    from './deployment/deployment-electrical.component';
import { DeploymentOneLineComponent }       from './deployment/deployment-oneline.component';
import { DeploymentDevicesComponent }       from './deployment/deployment-devices.component';
import { DeploymentIssuesComponent }        from './deployment/deployment-issues.component';
import { DeploymentCommissioningComponent } from './deployment/deployment-commissioning.component';
import { DeploymentCloseoutComponent }      from './deployment/deployment-closeout.component';
import { DeploymentPhotosComponent }        from './deployment/deployment-photos.component';
import { DeploymentMaterialsComponent }     from './deployment/deployment-materials.component';
import { DeploymentEngSupportComponent }    from './deployment/deployment-eng-support.component';
import { DeploymentDocumentsComponent }     from './deployment/deployment-documents.component';

const routes: Routes = [
  { path: 'energy-dashboard',      component: EnterpriseDashboardComponent, data: { title: 'Energy Dashboard' } },
  { path: 'dashboard',            component: DashboardComponent,          data: { title: 'Dashboard' } },
  { path: 'capacity',             component: CapacityComponent,           data: { title: 'Capacity Intelligence' } },
  { path: 'digital-twin',         component: DigitalTwinComponent,        data: { title: 'Digital Twin' } },
  { path: 'sites',                component: SitesComponent,              data: { title: 'Sites' } },
  { path: 'transformers',         component: TransformersComponent,       data: { title: 'Transformers' } },
  { path: 'electrical-network',   component: ElectricalNetworkComponent,  data: { title: 'Electrical Network' } },
  { path: 'current-analysis',     component: CurrentAnalysisComponent,    data: { title: 'Current Analysis' } },
  { path: 'savings',              component: SavingsComponent,            data: { title: 'Savings & Financials' } },
  { path: 'alarms',               component: AlarmsComponent,             data: { title: 'Alarms & Events' } },
  { path: 'alarm-config',         component: AlarmConfigComponent,        data: { title: 'Alarm Configuration' } },
  { path: 'alert-rules',          component: AlertRulesComponent,         data: { title: 'Alert Rule Monitor' } },
  { path: 'reports',              component: ReportsComponent,            data: { title: 'Reports' } },
  { path: 'devices',              component: DevicesComponent,            data: { title: 'Devices' } },
  { path: 'settings',             component: SettingsComponent,           data: { title: 'Settings' } },
  { path: 'utility',              component: UtilityComponent,            data: { title: 'Utility Intelligence' } },
  { path: 'financial-dashboard',  component: FinancialDashboardComponent, data: { title: 'Financial Dashboard' } },
  { path: 'job-costing',          component: JobCostingComponent,         data: { title: 'Job Costing' } },
  { path: 'invoicing',            component: InvoicingComponent,          data: { title: 'Invoicing' } },
  { path: 'payments',             component: PaymentsComponent,           data: { title: 'Payments' } },
  { path: 'rates-tariffs',        component: RatesTariffsComponent,       data: { title: 'Rates & Tariffs' } },
  { path: 'profitability',        component: ProfitabilityComponent,      data: { title: 'Profitability' } },
  { path: 'ubill-tracker',        component: UBillTrackerComponent,       data: { title: 'uBillTracker' } },
  { path: 'ubill-forecast',       component: UBillForecastComponent,      data: { title: 'uBillForecast' } },
  { path: 'deployment',           component: DeploymentListComponent,     data: { title: 'Deployment App' } },
  {
    path: 'deployment/:id',
    component: DeploymentLayoutComponent,
    children: [
      { path: '',                   component: DeploymentActiveComponent,        data: { title: 'Active Deployment' } },
      { path: 'pre-deployment',     component: DeploymentPreComponent,           data: { title: 'Pre-Deployment' } },
      { path: 'electrical-network', component: DeploymentElectricalComponent,    data: { title: 'Electrical Network' } },
      { path: 'one-line',           component: DeploymentOneLineComponent,       data: { title: 'One-Line Drawing' } },
      { path: 'devices',            component: DeploymentDevicesComponent,       data: { title: 'Devices' } },
      { path: 'photos',             component: DeploymentPhotosComponent,        data: { title: 'Photos' } },
      { path: 'issues',             component: DeploymentIssuesComponent,        data: { title: 'Issues' } },
      { path: 'engineering-support',component: DeploymentEngSupportComponent,   data: { title: 'Engineering Support' } },
      { path: 'documents',          component: DeploymentDocumentsComponent,     data: { title: 'Documents' } },
      { path: 'commissioning',      component: DeploymentCommissioningComponent, data: { title: 'Commissioning' } },
      { path: 'closeout',           component: DeploymentCloseoutComponent,      data: { title: 'Closeout Package' } },
      { path: 'materials',          component: DeploymentMaterialsComponent,     data: { title: 'Materials' } },
    ]
  },
  { path: '', redirectTo: 'energy-dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EcbsRoutingModule {}
