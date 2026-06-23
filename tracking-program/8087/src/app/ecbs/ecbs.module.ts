import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EcbsRoutingModule } from './ecbs-routing.module';

import { DashboardComponent }        from './dashboard/dashboard.component';
import { CapacityComponent }          from './capacity/capacity.component';
import { DigitalTwinComponent }       from './digital-twin/digital-twin.component';
import { SitesComponent }             from './sites/sites.component';
import { TransformersComponent }      from './transformers/transformers.component';
import { ElectricalNetworkComponent } from './electrical-network/electrical-network.component';
import { CurrentAnalysisComponent }   from './current-analysis/current-analysis.component';
import { SavingsComponent }           from './savings/savings.component';
import { AlarmsComponent }            from './alarms/alarms.component';
import { AlarmConfigComponent }      from './alarm-config/alarm-config.component';
import { AlertRulesComponent }       from './alert-rules/alert-rules.component';
import { ReportsComponent }           from './reports/reports.component';
import { DevicesComponent }           from './devices/devices.component';
import { SettingsComponent }          from './settings/settings.component';
import { UtilityComponent }             from './utility/utility.component';
import { FinancialDashboardComponent }  from './financial-dashboard/financial-dashboard.component';
import { JobCostingComponent }          from './job-costing/job-costing.component';
import { InvoicingComponent }           from './invoicing/invoicing.component';
import { PaymentsComponent }            from './payments/payments.component';
import { RatesTariffsComponent }        from './rates-tariffs/rates-tariffs.component';
import { UBillTrackerComponent }  from './ubill-tracker/ubill-tracker.component';
import { UBillForecastComponent } from './ubill-forecast/ubill-forecast.component';
import { ProfitabilityComponent }       from './profitability/profitability.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EcbsRoutingModule,
  ],
  declarations: [
    DashboardComponent,
    CapacityComponent,
    DigitalTwinComponent,
    SitesComponent,
    TransformersComponent,
    ElectricalNetworkComponent,
    CurrentAnalysisComponent,
    SavingsComponent,
    AlarmsComponent,
    AlarmConfigComponent,
    AlertRulesComponent,
    ReportsComponent,
    DevicesComponent,
    SettingsComponent,
    UtilityComponent,
    FinancialDashboardComponent,
    JobCostingComponent,
    InvoicingComponent,
    PaymentsComponent,
    RatesTariffsComponent,
    ProfitabilityComponent,
    UBillTrackerComponent,
    UBillForecastComponent,
  ],
})
export class EcbsModule {}
