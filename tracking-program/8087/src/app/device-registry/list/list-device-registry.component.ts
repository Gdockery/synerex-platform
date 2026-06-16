import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DeviceRegistryService } from '../device-registry.service';

/**
 * Phase 3 — Device Registry list.
 * Shows all registered devices for the selected project.
 */
@Component({
  selector: 'app-list-device-registry',
  template: `
    <div class="container-fluid">
      <div class="row">
        <div class="col-md-8"><h3><span class="fa fa-database"></span> Device Registry</h3></div>
        <div class="col-md-4 text-right" style="padding-top:12px;">
          <a [routerLink]="['/device-registry/scan']" class="btn btn-success">
            <span class="fa fa-qrcode"></span> Scan Barcode
          </a>
          &nbsp;
          <a [routerLink]="['/device-registry/new']" class="btn btn-primary">
            <span class="fa fa-plus"></span> Add Device
          </a>
        </div>
      </div>
      <hr/>

      <div *ngIf="loading" class="text-center">
        <span class="fa fa-spinner fa-spin fa-2x text-primary"></span>
        <p class="text-muted">Loading devices…</p>
      </div>

      <div *ngIf="!loading && devices.length === 0" class="alert alert-info">
        No devices registered yet. Click <strong>Add Device</strong> to register one.
      </div>

      <div *ngIf="!loading && devices.length > 0">
        <div class="row" style="margin-bottom:10px;">
          <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Filter by serial, type, or status…"
                   [(ngModel)]="filterText">
          </div>
        </div>

        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Serial / Barcode</th>
              <th>Type</th>
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Status</th>
              <th>Registered</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of filtered">
              <td><code>{{ d.serial_number }}</code></td>
              <td><span class="label label-default">{{ d.device_type }}</span></td>
              <td>{{ d.manufacturer || '—' }}</td>
              <td>{{ d.model || '—' }}</td>
              <td>
                <span class="label" [ngClass]="{
                  'label-success': d.status === 'active',
                  'label-warning': d.status === 'staged' || d.status === 'shipped',
                  'label-default': d.status === 'decommissioned'
                }">{{ d.status }}</span>
              </td>
              <td>{{ d.created_at | date:'mediumDate' }}</td>
              <td>
                <a [routerLink]="['/device-registry', d.id]" class="btn btn-xs btn-info">
                  View
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        <span class="fa fa-exclamation-triangle"></span> {{ error }}
      </div>
    </div>
  `
})
export class ListDeviceRegistryComponent implements OnInit {

  devices: any[] = [];
  loading = false;
  error: string | null = null;
  filterText = '';

  get filtered() {
    if (!this.filterText) return this.devices;
    const q = this.filterText.toLowerCase();
    return this.devices.filter(d =>
      (d.serial_number || '').toLowerCase().includes(q) ||
      (d.device_type || '').toLowerCase().includes(q) ||
      (d.status || '').toLowerCase().includes(q) ||
      (d.manufacturer || '').toLowerCase().includes(q)
    );
  }

  constructor(private svc: DeviceRegistryService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    const projectId = (window as any)['BOOTSTRAP_DATA']?.user?.selectedProject?.id;
    this.svc.list(projectId).subscribe(
      (res: any) => {
        this.loading = false;
        this.devices = res.response || res || [];
      },
      (err: any) => {
        this.loading = false;
        this.error = 'Failed to load devices.';
      }
    );
  }
}
