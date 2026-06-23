import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent }          from './dashboard/dashboard.component';
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

const routes: Routes = [
  { path: 'dashboard',            component: DashboardComponent,          data: { title: 'Enterprise Dashboard' } },
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
  { path: 'ubill-tracker',         component: UBillTrackerComponent,       data: { title: 'uBillTracker' } },
  { path: 'ubill-forecast',        component: UBillForecastComponent,      data: { title: 'uBillForecast' } },
  { path: '',                     redirectTo: 'dashboard', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EcbsRoutingModule {}
