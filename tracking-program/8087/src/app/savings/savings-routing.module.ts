import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {EnergySavingsComponent} from './energySavings.component';
import {BudgetSavingsComponent} from './budget-savings.component';
import {Co2SavingsComponent} from './co2Savings.component';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', canActivate:[ProjectSelectedGuard], children: [
        { path: 'energy-savings', component: EnergySavingsComponent, canActivate:[ProjectSelectedGuard], data: {title: 'Energy Savings'}},
        { path: 'budget-savings', component: BudgetSavingsComponent, canActivate:[ProjectSelectedGuard], data: {title: 'View Budget'}},
        { path: 'carbon-emission-saving', component: Co2SavingsComponent, data: {title: 'Carbon Emission Saving'}}
      ]}
    ])
  ],
  exports: [RouterModule]
})
export class SavingsRoutingModule { }
