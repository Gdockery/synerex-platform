import {Component} from '@angular/core';
import {ClientService} from "./client.service";
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  template: `
    <div class="container-fluid">
      <h3>Your Clients
        <a class="btn btn-primary pull-right" [routerLink]="['/project/client/create']">Add new client</a>
      </h3>
      <p>To view or edit one of the clients below, click the corresponding icon.</p>
      <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="clients" [lazy]="true" [paginator]="true" [rows]="perPage"
                   [totalRecords]="recordCount" (onLazyLoad)="fetch($event)">
        <p-column field="name" header="Client" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="contactName" header="Contact" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="country" header="Country" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="" header="" [style]="{'width':'180px'}" styleClass="text-center">
          <ng-template let-row="rowData" pTemplate="body">
            <a class="btn btn-sm btn-primary" [routerLink]="['/project/client/edit', row.id]"><span class="button-icon ss-write"></span></a>&nbsp;
          </ng-template>
        </p-column>
      </p-dataTable>
    </div>
  `
})
export class ClientListComponent {

  public clients:any;
  private recordCount;
  private perPage = 10;

  constructor(private clientService: ClientService, private currentUserService: CurrentUserService) {}

  fetch(params) {
    params.createdBy = this.currentUserService.user.id;
    this.clientService.getPaginated(params).subscribe(responseData =>{
      this.recordCount = responseData.meta.total;
      this.clients = responseData.response;
    });
  }

}
