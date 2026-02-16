import {Component, OnInit} from '@angular/core';
import {ClientService} from "./client.service";
import { CurrentUserService } from '../../shared/user/currentUser.service';
import {WhitelabelService} from '../../shared/services/whitelabel.service';

@Component({
  template: `
    <div class="container-fluid">
      <h3>Manage {{brandName}}'s Clients
        <a *ngIf="isAdmin" class="btn btn-primary pull-right" [routerLink]="['/xeco-administrator/client/create']">Add new client</a>
      </h3>
      <p>Click a client to view their projects, then add a new project or select an existing one.</p>
      <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="clients" [lazy]="true" [paginator]="true" [rows]="perPage"
                   [totalRecords]="recordCount" (onLazyLoad)="fetch($event)">
        <p-column field="name" header="Client" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'">
          <ng-template let-row="rowData" pTemplate="body">
            <a [routerLink]="['/xeco-administrator/client/projects', row.id]">{{row.name}}</a>
          </ng-template>
        </p-column>
        <p-column field="contactName" header="Contact" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="country" header="Country" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="" header="" [style]="{'width':'180px'}" styleClass="text-center">
          <ng-template let-row="rowData" pTemplate="body">
            <a *ngIf="isAdmin" class="btn btn-sm btn-primary" [routerLink]="['/xeco-administrator/client/edit', row.id]"><span class="button-icon ss-write"></span></a>&nbsp;
            <a *ngIf="isAdmin" class="btn btn-sm btn-primary" [routerLink]="['/xeco-administrator/client/projects', row.id]">View Projects&nbsp;<span class="button-icon ss-navigateright"></span></a>&nbsp;
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
  private isAdmin:boolean;
  public brandName: string = 'Synerex';

  constructor(private clientService: ClientService, private currentUserService: CurrentUserService, private whitelabelService: WhitelabelService) {this.isAdmin = currentUserService.user.role === 8;}

  ngOnInit() {
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
  }

  fetch(params) {
    this.clientService.getPaginated(params).subscribe(responseData => {
      const meta = responseData && responseData.meta;
      this.recordCount = (meta && meta.total != null) ? meta.total : (responseData.response || []).length;
      this.clients = responseData && responseData.response ? responseData.response : [];
    });
  }

}
