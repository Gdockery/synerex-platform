import { Component, OnInit } from '@angular/core';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import { UserService } from "../../shared/user/user.service";
import { WhitelabelService } from "../../shared/services/whitelabel.service";

@Component({
  template: `
    <div class="container-fluid">
      <h3>{{brandName}} Portal User Management
        <button class="btn btn-primary pull-right" [routerLink]="['/xeco-administrator/user/create']">Add new user</button>
      </h3>
      <p>To archive an existing user, or to edit their account information, click one of their icons below.</p>
      <div *ngIf="syncingUsers" class="row">
        <div class="col-xs-12">
          <h4 class="text-primary"><span class="fa fa-spinner"></span> Loading users...</h4>
        </div>
      </div>
      <div [class]="syncingUsers ? 'invisible' : ''">
        <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="users">
          <p-column field="roleFriendlyName" header="Role" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
          <p-column field="fullName" header="Full Name" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
          <p-column field="email" header="Email Address" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
          <p-column field="lastActiveAt" header="Last Logged In" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'">
            <ng-template let-row="rowData" pTemplate="body">
              {{row.lastActiveAt === 0 ? 'Never' : (row.lastActiveAt) | amTimeAgo}}
            </ng-template>
          </p-column>
          <p-column field="" header="" [filterMatchMode]="'contains'" [style]="{'width':'40px'}" styleClass="text-center">
            <ng-template let-row="rowData" pTemplate="body">
              <a *ngIf="!(row.role === 8 && row.id === currentUserService.user.id)" class="ss-navigateright" [routerLink]="['/xeco-administrator/user/edit', row.id]"></a>
            </ng-template>
          </p-column>
        </p-dataTable>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  private users;
  private syncingUsers = true;
  public brandName: string = 'Xeco'; // Default, will be updated

  constructor(private currentUserService: CurrentUserService, private userService: UserService, private whitelabelService: WhitelabelService) {
    this.fetch();
  }

  ngOnInit() {
    // Load brand name
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
  }

  fetch() {
    this.syncingUsers = true;
    this.userService.getAll().subscribe(responseData => {
      this.syncingUsers = false;
      this.users = responseData.response;
    });
  }
}
