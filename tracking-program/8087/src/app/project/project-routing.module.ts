import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {ProjectSelectComponent} from './select/project-select.component';
import {ProjectCreateComponent} from './select/create-project.component';
import {ProjectEditComponent} from './select/edit-project.component';
import {ClientListComponent} from './client/list-client.component';
import {ClientEditComponent} from './client/edit-client.component';
import {ClientCreateComponent} from './client/create-client.component';
import {ProjectSelectedGuard} from "../shared/guards/projectSelected.guard";
import {ProjectComponent} from './project.component';
import {ProjectOverviewComponent} from "./overview/project-overview.component";
import {PowerQualityComponent} from "./powerQuality/power-quality.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: ProjectComponent, data: {title: 'Project'}, children: [
        { path: 'client', data: {title: 'Admin - Clients'}, children: [
          { path: 'list', component: ClientListComponent, data: {title: 'Admin - Clients'}},
          { path: 'create', component: ClientCreateComponent, data: {title: 'Admin - Create Client'}},
          { path: 'edit/:id', component: ClientEditComponent, data: {title: 'Admin - Edit Client'}},
        ]},
        { path: '', redirectTo:'select', pathMatch: 'full'},
        { path: 'select', component: ProjectSelectComponent, data: {title: 'Select Project'}},
        { path: 'create', component: ProjectCreateComponent, data: {title: 'Create New Project'}},
        { path: 'edit/:id', component: ProjectEditComponent, data: {title: 'Edit Project'}},
        { path: 'client', component: ProjectCreateComponent, data: {title: 'Create New Project'}},
        { path: 'overview', component: ProjectOverviewComponent, data: {title: 'Project Overview'}},
        { path: 'power-quality', component: PowerQualityComponent, data: {title: 'Power Quality'}},
        { path: 'edit/:id', component: ProjectEditComponent, data: {title: 'Edit Project'}},
      ]}
    ])
  ],
  exports: [RouterModule]
})
export class ProjectRoutingModule { }
