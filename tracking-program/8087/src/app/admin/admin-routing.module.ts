import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import {AdminComponent} from './admin.component';
import {ClientListComponent} from './client/list-client.component';
import {ClientEditComponent} from './client/edit-client.component';
import {ClientCreateComponent} from './client/create-client.component';
import {AdvancedOptionsComponent} from "./advanced-options.component";
import {OemBrandingComponent} from "./branding/oem-branding.component";
import {ManageSubscriptionComponent} from "./subscription/manage-subscription.component";
import {ProjectEditComponent} from "./project/edit-project.component";
import {ProjectCreateComponent} from "./project/create-project.component";
import {ProjectListComponent} from "./project/list-project.component";
import {UserListComponent} from "./user/list-user.component";
import {CreateUserComponent} from "./user/create-user.component";
import {EditUserComponent} from "./user/edit-user.component";
import {CompanySettingsComponent} from "./company/company-settings.component";

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: '', component: AdminComponent, data: {title: 'Admin'}, children: [
        { path: 'client', data: {title: 'Admin - Clients'}, children: [
          { path: 'list', component: ClientListComponent, data: {title: 'Admin - Clients'}},
          { path: 'create', component: ClientCreateComponent, data: {title: 'Admin - Create Client'}},
          { path: 'edit/:id', component: ClientEditComponent, data: {title: 'Admin - Edit Client'}},
          { path: 'projects/:clientId', component: ProjectListComponent, data: {title: 'Client-Projects'}},
          { path: '', redirectTo:'/synerex-administrator/client/list' , pathMatch: 'full'}
        ]},
        { path: 'project', data: {title: 'Admin - Projects'}, children: [
          { path: 'list', component: ProjectListComponent, data: {title: 'Admin - Projects'}},
          { path: 'create', component: ProjectCreateComponent, data: {title: 'Admin - Create Project'}},
          { path: 'edit/:id', component: ProjectEditComponent, data: {title: 'Admin - Edit Project'}},
          { path: '', redirectTo:'/synerex-administrator/project/list' , pathMatch: 'full'}
        ]},
        { path: 'user', data: {title: 'Admin - User'}, children: [
          { path: 'list', component: UserListComponent, data: {title: 'Admin - Users'}},
          { path: 'create', component: CreateUserComponent, data: {title: 'Admin - Create User'}},
          { path: 'edit/:id', component: EditUserComponent, data: {title: 'Admin - Edit User'}},
          { path: '', redirectTo:'/synerex-administrator/user/list' , pathMatch: 'full'}
        ]},
        { path: 'advanced', component: AdvancedOptionsComponent },
        { path: 'branding', component: OemBrandingComponent, data: {title: 'Brand Settings'} },
        { path: 'subscription', component: ManageSubscriptionComponent, data: {title: 'Manage Subscription'} },
        { path: 'company-settings', component: CompanySettingsComponent, data: {title: 'Company Settings'} },
      ]},
    ])
  ],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
