import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { DeploymentService } from './deployment.service';
import { ListDeploymentComponent } from './list/list-deployment.component';
import { DeploymentDetailComponent } from './detail/deployment-detail.component';

/**
 * Phase 4 — Deployment Management Angular module.
 * Routes:
 *   /deployment           → list deployments
 *   /deployment/:id       → deployment detail with photo upload
 */
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forChild([
      {
        path: '',
        component: ListDeploymentComponent,
        data: { title: 'Deployments' }
      },
      {
        path: ':id',
        component: DeploymentDetailComponent,
        data: { title: 'Deployment Detail' }
      },
    ]),
  ],
  declarations: [
    ListDeploymentComponent,
    DeploymentDetailComponent,
  ],
  providers: [
    DeploymentService,
  ],
})
export class DeploymentModule {}
