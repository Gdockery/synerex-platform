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
import { ReportsComponent }           from './reports/reports.component';
import { DevicesComponent }           from './devices/devices.component';
import { SettingsComponent }          from './settings/settings.component';

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
    ReportsComponent,
    DevicesComponent,
    SettingsComponent,
  ],
})
export class EcbsModule {}
