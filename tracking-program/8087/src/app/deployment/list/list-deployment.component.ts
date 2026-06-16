import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeploymentService } from '../deployment.service';

/**
 * Phase 4 — Deployment list.
 */
@Component({
  selector: 'app-list-deployment',
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-8"><h3><span class="fa fa-truck"></span> Deployments</h3></div>
        <div class="col-md-4 text-right" style="padding-top:12px;">
          <a [routerLink]="['/deployment/new']" class="btn btn-primary">
            <span class="fa fa-plus"></span> New Deployment
          </a>
        </div>
      </div>
      <hr/>

      <div *ngIf="loading" class="text-center">
        <span class="fa fa-spinner fa-spin fa-2x text-primary"></span>
      </div>

      <div *ngIf="!loading && deployments.length === 0" class="alert alert-info">
        No deployments yet. Click <strong>New Deployment</strong> to start one.
      </div>

      <table *ngIf="!loading && deployments.length > 0" class="table table-striped table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Project</th>
            <th>Site</th>
            <th>Status</th>
            <th>Scheduled</th>
            <th>Photos</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of deployments">
            <td>#{{ d.id }}</td>
            <td>{{ d.project_id }}</td>
            <td>{{ d.site_id || '—' }}</td>
            <td>
              <span class="label" [ngClass]="{
                'label-default': d.status === 'draft',
                'label-info':    d.status === 'scheduled',
                'label-primary': d.status === 'in_progress',
                'label-success': d.status === 'activated',
                'label-warning': d.status === 'on_hold'
              }">{{ d.status }}</span>
            </td>
            <td>{{ d.scheduled_date || '—' }}</td>
            <td>{{ (d.field_entry_data?.photos?.length || 0) }} photos</td>
            <td>
              <a [routerLink]="['/deployment', d.id]" class="btn btn-xs btn-info">
                Open
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
    </div>
  `
})
export class ListDeploymentComponent implements OnInit {

  deployments: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private svc: DeploymentService) {}

  ngOnInit() {
    this.loading = true;
    const projectId = (window as any)['BOOTSTRAP_DATA']?.user?.selectedProject?.id;
    this.svc.list(projectId).subscribe(
      (res: any) => { this.loading = false; this.deployments = res.data || []; },
      () => { this.loading = false; this.error = 'Failed to load deployments.'; }
    );
  }
}
