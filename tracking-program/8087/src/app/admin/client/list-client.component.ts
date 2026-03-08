import {Component, OnInit} from '@angular/core';
import {ClientService} from "./client.service";
import { CurrentUserService } from '../../shared/user/currentUser.service';
import {WhitelabelService} from '../../shared/services/whitelabel.service';

@Component({
  template: `
    <div class="container-fluid">
      <div class="clearfix" style="margin-bottom: 1.5em; padding: 0.5em 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1em; position: relative;">
        <h3 style="margin: 0; flex: 1 1 auto; text-align: center;">Manage {{brandName}}'s Clients</h3>
        <a *ngIf="canAddClient" class="btn btn-primary" style="flex-shrink: 0; position: absolute; right: 0;" [routerLink]="['/xeco-administrator/client/create']">Add new client</a>
      </div>
      <p>Click a client to add a new project for them. Use "View Projects" to see existing projects.</p>
      <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="clients" [lazy]="true" [paginator]="true" [rows]="perPage"
                   [totalRecords]="recordCount" (onLazyLoad)="fetch($event)">
        <p-column field="name" header="Client" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'">
          <ng-template let-row="rowData" pTemplate="body">
            <a [routerLink]="['/xeco-administrator/project/create']" [queryParams]="{clientId: row.id}">{{row.name}}</a>
          </ng-template>
        </p-column>
        <p-column field="contactName" header="Contact" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="country" header="Country" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="" header="" [style]="{'width':'180px'}" styleClass="text-center">
          <ng-template let-row="rowData" pTemplate="body">
            <a *ngIf="canManageClients" class="btn btn-sm btn-primary" [routerLink]="['/xeco-administrator/client/edit', row.id]"><span class="button-icon ss-write"></span></a>&nbsp;
            <a *ngIf="canManageClients" class="btn btn-sm btn-primary" [routerLink]="['/xeco-administrator/client/projects', row.id]">View Projects&nbsp;<span class="button-icon ss-navigateright"></span></a>&nbsp;
          </ng-template>
        </p-column>
      </p-dataTable>
    </div>
  `
})
export class ClientListComponent implements OnInit {

  public clients:any;
  private recordCount;
  private perPage = 10;
  private isAdmin: boolean;
  /** Admin (8), Account Manager (7), or OEM (9, 10) - can add, edit, view clients */
  public canManageClients: boolean;
  /** Admin (8) or OEM (9, 10) - can create new clients */
  public canAddClient: boolean;
  public brandName: string = 'Synerex';

  constructor(private clientService: ClientService, private currentUserService: CurrentUserService, private whitelabelService: WhitelabelService) {
    this.isAdmin = currentUserService.user.role === 8;
    const role = Number(currentUserService.user.role);
    this.canManageClients = role === 7 || role === 8 || role === 9 || role === 10;
    this.canAddClient = role === 8 || role === 9 || role === 10;
    // OEM users (9, 10): use OEM display name from bootstrap (e.g. "HarmoniQ")
    const bootstrap = (typeof window !== 'undefined' && window['BOOTSTRAP_DATA']) || {};
    const oemName = bootstrap['oemDisplayName'];
    if (oemName) {
      this.brandName = oemName;
    }
  }

  ngOnInit() {
    if (this.brandName === 'Synerex') {
      this.whitelabelService.getBrandName().subscribe(brandName => {
        this.brandName = brandName;
      });
    }
  }

  fetch(params) {
    if (!params || params.first == null || params.rows == null) {
      params = { first: 0, rows: this.perPage };
    }
    this.clientService.getPaginated(params).subscribe(responseData => {
      const meta = responseData && responseData.meta;
      this.recordCount = (meta && meta.total != null) ? meta.total : (responseData.response || []).length;
      this.clients = responseData && responseData.response ? responseData.response : [];
    });
  }

}
