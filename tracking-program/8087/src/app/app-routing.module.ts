import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NotFoundComponent } from './notFound/notFound.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { MyAccountComponent } from './my-account/my-account.component';
import { HomeRedirectComponent } from './home-redirect/home-redirect.component';


// Client-side routing for XECO Web Portal single page app.
@NgModule({
  imports: [
    RouterModule.forRoot([

      // Hack to force-display the 404 screen
      { path: '404', component: NotFoundComponent},

      // Home (redirect: OEM 9/10 → clients list, others → welcome)
      { path: '', component: HomeRedirectComponent, pathMatch: 'full'},

      // Account settings
      // ====================================================================================
      { path: 'account', component: MyAccountComponent, data: {title: 'My Account'} },
        // { path: 'account/email', loadChildren: './admin/admin.module#AdminModule' },//todo
        // { path: 'account/password', loadChildren: './admin/admin.module#AdminModule' },//todo
      

      // Outer screens
      // ====================================================================================
      { path: 'xeco-administrator', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)},
      { path: 'welcome', component: WelcomeComponent, data: {title: 'Welcome'}},
      { path: 'maintenance', component: MaintenanceComponent, data: {title: 'Welcome'}},

      // Project-specific screens
      // ====================================================================================
      { path: 'project', loadChildren: () => import('./project/project.module').then(m => m.ProjectModule) },
      { path: 'electricity-meters', loadChildren: () => import('./electricityMeters/meters.module').then(m => m.MetersModule) },
      { path: 'repeaters', loadChildren: () => import('./repeaters/repeaters.module').then(m => m.RepeatersModule) },
      { path: 'gateways', loadChildren: () => import('./gateway/gateway.module').then(m => m.GatewayModule) },
      { path: 'switches', loadChildren: () => import('./switches/switches.module').then(m => m.SwitchesModule) },
      { path: 'equipments', loadChildren: () => import('./equipments/equipments.module').then(m => m.EquipmentsModule) },
      { path: 'savings', loadChildren: () => import('./savings/savings.module').then(m => m.SavingsModule) },
      { path: 'billing', loadChildren: () => import('./billing/billing.module').then(m => m.BillingModule)},
      { path: 'admin-files', loadChildren: () => import('./files/files.module').then(m => m.FilesModule)},
			{ path: 'tests', loadChildren: () => import('./tests/tests.module').then(m => m.TestsModule) },
			{ path: 'map', loadChildren: () => import('./map/map.module').then(m => m.MapModule) },

      // Catch-all (404 behavior)
      { path: '**', component: NotFoundComponent, data: {title: 'Not Found'} }

    ], { useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
