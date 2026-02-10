import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {TestsComponent} from './tests.component';
import {ListTestsComponent} from './list/list-tests.component';
import {CreateTestComponent} from './create/create-test.component';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import {ViewTestComponent} from './view/view-test.component';
import {ViewTestDataComponent} from './view/view-test-data.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: TestsComponent, canActivate:[ProjectSelectedGuard], children: [
        { path: '', redirectTo:'list', pathMatch: 'full'},
        { path: 'list', component: ListTestsComponent, data: {title: 'Tests'}},
        { path: 'create', component: CreateTestComponent, data: {title: 'Tests - Create'}},
        { path: 'view/:id', component: ViewTestComponent, pathMatch: 'full', data: {title: 'Tests - View'}},
        { path: 'view/:id/data', component: ViewTestDataComponent, data: {title: 'Tests - View Data'}},
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class TestsRoutingModule { }
