import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  template: `
    <div class="container-fluid">
      <div class="clearfix" style="margin-bottom: 1.5em; padding: 0.5em 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1em; position: relative;">
        <h3 style="margin: 0; flex: 1 1 auto; text-align: center;">Manage OEM Partners</h3>
      </div>

      <p class="text-muted">These are the OEM organizations that resell Synerex products under their own brand.</p>

      <div *ngIf="loading" class="text-center" style="padding: 2em;">
        <span class="glyphicon glyphicon-refresh" style="animation: spin 1s linear infinite;"></span> Loading OEMs...
      </div>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

      <div *ngIf="!loading && !error">
        <p-dataTable
          tableStyleClass="table dataTable table-striped table-bordered"
          [value]="oems"
          [paginator]="true"
          [rows]="10"
          [totalRecords]="oems.length"
          emptyMessage="No OEM organizations found.">

          <p-column field="org_name" header="OEM Name" [sortable]="true">
            <ng-template let-row="rowData" pTemplate="body">
              <strong>{{ row.org_name }}</strong>
            </ng-template>
          </p-column>

          <p-column field="org_id" header="Org ID" [sortable]="true">
            <ng-template let-row="rowData" pTemplate="body">
              <code>{{ row.org_id }}</code>
            </ng-template>
          </p-column>

          <p-column field="client_count" header="Clients" [sortable]="true" [style]="{'width':'100px','text-align':'center'}">
            <ng-template let-row="rowData" pTemplate="body">
              <span class="badge" style="background:#337ab7; font-size:13px;">{{ row.client_count }}</span>
            </ng-template>
          </p-column>

          <p-column field="admin_emails" header="OEM Admins">
            <ng-template let-row="rowData" pTemplate="body">
              <span *ngIf="row.admin_emails && row.admin_emails.length > 0">
                <span *ngFor="let email of row.admin_emails; let last = last">
                  {{ email }}<span *ngIf="!last">, </span>
                </span>
              </span>
              <span *ngIf="!row.admin_emails || row.admin_emails.length === 0" class="text-muted">—</span>
            </ng-template>
          </p-column>

          <p-column header="Actions" [style]="{'width':'200px','text-align':'center'}">
            <ng-template let-row="rowData" pTemplate="body">
              <a class="btn btn-sm btn-primary"
                 [routerLink]="['/synerex-administrator/client/list']"
                 [queryParams]="{ sponsor_org_id: row.org_id }"
                 title="View this OEM's clients">
                <span class="glyphicon glyphicon-list"></span> View Clients
              </a>
            </ng-template>
          </p-column>

        </p-dataTable>
      </div>
    </div>
  `
})
export class OemListComponent implements OnInit {
  public oems: any[] = [];
  public loading = true;
  public error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const base = (window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].apiBasePath) || '';
    this.http.get<any>(`${base}/api/oems`).subscribe(
      data => {
        this.oems = data.oems || [];
        this.loading = false;
      },
      err => {
        this.error = (err && err.error && err.error.error) || 'Failed to load OEM organizations.';
        this.loading = false;
      }
    );
  }
}
