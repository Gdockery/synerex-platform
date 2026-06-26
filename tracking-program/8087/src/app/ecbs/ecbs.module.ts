import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EcbsRoutingModule } from './ecbs-routing.module';

import { DashboardComponent }        from './dashboard/dashboard.component';
import { EnergyDashboardComponent }      from './energy-dashboard/energy-dashboard.component';
import { EnterpriseDashboardComponent }  from './enterprise-dashboard/enterprise-dashboard.component';
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
import { DeploymentListComponent }          from './deployment/deployment-list.component';
import { DeploymentActiveComponent }        from './deployment/deployment-active.component';
import { DeploymentDevicesComponent }       from './deployment/deployment-devices.component';
import { DeploymentIssuesComponent }        from './deployment/deployment-issues.component';
import { DeploymentCommissioningComponent } from './deployment/deployment-commissioning.component';
import { DeploymentCloseoutComponent }      from './deployment/deployment-closeout.component';
import { DeploymentPhotosComponent }        from './deployment/deployment-photos.component';
import { DeploymentMaterialsComponent }     from './deployment/deployment-materials.component';
import { DeploymentLayoutComponent }        from './deployment/deployment-layout.component';
import { DeploymentPreComponent }           from './deployment/deployment-pre.component';
import { DeploymentElectricalComponent }    from './deployment/deployment-electrical.component';
import { DeploymentOneLineComponent }       from './deployment/deployment-oneline.component';
import { DeploymentEngSupportComponent }    from './deployment/deployment-eng-support.component';
import { DeploymentDocumentsComponent }     from './deployment/deployment-documents.component';
import { BarcodeScannerComponent }          from '../shared/barcode-scanner/barcode-scanner.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EcbsRoutingModule,
  ],
  declarations: [
    DashboardComponent,
    EnergyDashboardComponent,
    EnterpriseDashboardComponent,
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
    DeploymentListComponent,
    DeploymentActiveComponent,
    DeploymentDevicesComponent,
    DeploymentIssuesComponent,
    DeploymentCommissioningComponent,
    DeploymentCloseoutComponent,
    DeploymentPhotosComponent,
    DeploymentMaterialsComponent,
    DeploymentLayoutComponent,
    DeploymentPreComponent,
    DeploymentElectricalComponent,
    DeploymentOneLineComponent,
    DeploymentEngSupportComponent,
    DeploymentDocumentsComponent,
    BarcodeScannerComponent,
  ],
})
export class EcbsModule {}
