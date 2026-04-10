import {Component, OnInit} from '@angular/core';
import {ClientService} from "./client.service";
import { CurrentUserService } from '../../shared/user/currentUser.service';
import {WhitelabelService} from '../../shared/services/whitelabel.service';
import { HttpClient } from '@angular/common/http';

@Component({
  template: `
    <div class="container-fluid">
      <div class="clearfix" style="margin-bottom: 1.5em; padding: 0.5em 0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1em; position: relative;">
        <h3 style="margin: 0; flex: 1 1 auto; text-align: center;">Manage {{brandName}}'s Clients</h3>
        <div style="flex-shrink: 0; position: absolute; right: 0; display:flex; gap:0.5em;">
          <button *ngIf="canInviteClient" class="btn btn-default" (click)="showInviteForm = !showInviteForm">
            <span class="glyphicon glyphicon-envelope"></span> Invite Client
          </button>
          <a *ngIf="canAddClient" class="btn btn-primary" [routerLink]="['/synerex-administrator/client/create']">Add new client</a>
        </div>
      </div>

      <!-- Invite Client Panel -->
      <div *ngIf="showInviteForm" class="panel panel-default" style="max-width:520px; margin:0 auto 1.5em auto;">
        <div class="panel-heading"><strong><span class="glyphicon glyphicon-envelope"></span> Send Subscription Invitation</strong></div>
        <div class="panel-body">
          <p class="text-muted" style="font-size:0.9em; margin-bottom:1em;">
            Send a branded invitation email to a prospective client. They'll be directed to subscribe and pay through the {{brandName}} portal.
          </p>
          <div *ngIf="inviteSuccess" class="alert alert-success">
            <span class="glyphicon glyphicon-ok"></span> Invitation sent to <strong>{{inviteEmail}}</strong>!
          </div>
          <div *ngIf="inviteError" class="alert alert-danger">{{inviteError}}</div>
          <div *ngIf="!inviteSuccess">
            <div class="form-group">
              <label>Client Email <span class="text-danger">*</span></label>
              <input type="email" class="form-control" [(ngModel)]="inviteEmail" placeholder="client@company.com" [disabled]="inviteSending"/>
            </div>
            <div class="form-group">
              <label>Company Name <span class="text-muted">(optional)</span></label>
              <input type="text" class="form-control" [(ngModel)]="inviteCompany" placeholder="Acme Corp" [disabled]="inviteSending"/>
            </div>
            <button class="btn btn-primary" (click)="sendInvite()" [disabled]="inviteSending || !inviteEmail">
              <span *ngIf="inviteSending"><span class="glyphicon glyphicon-refresh"></span> Sending...</span>
              <span *ngIf="!inviteSending"><span class="glyphicon glyphicon-send"></span> Send Invitation</span>
            </button>
            <button class="btn btn-default" style="margin-left:0.5em;" (click)="showInviteForm = false" [disabled]="inviteSending">Cancel</button>
          </div>
          <div *ngIf="inviteSuccess" style="margin-top:0.5em;">
            <button class="btn btn-default btn-sm" (click)="resetInvite()">Send Another</button>
            <button class="btn btn-default btn-sm" style="margin-left:0.5em;" (click)="showInviteForm = false">Close</button>
          </div>
        </div>
      </div>

      <p>Click a client to add a new project for them. Use "View Projects" to see existing projects.</p>
      <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="clients" [lazy]="true" [paginator]="true" [rows]="perPage"
                   [totalRecords]="recordCount" (onLazyLoad)="fetch($event)">
        <p-column field="name" header="Client" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'">
          <ng-template let-row="rowData" pTemplate="body">
            <a [routerLink]="['/synerex-administrator/project/create']" [queryParams]="{clientId: row.id}">{{row.name}}</a>
          </ng-template>
        </p-column>
        <p-column field="contactName" header="Contact" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="country" header="Country" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="" header="" [style]="{'width':'180px'}" styleClass="text-center">
          <ng-template let-row="rowData" pTemplate="body">
            <a *ngIf="canManageClients" class="btn btn-sm btn-primary" [routerLink]="['/synerex-administrator/client/edit', row.id]"><span class="button-icon ss-write"></span></a>&nbsp;
            <a *ngIf="canManageClients" class="btn btn-sm btn-primary" [routerLink]="['/synerex-administrator/client/projects', row.id]">View Projects&nbsp;<span class="button-icon ss-navigateright"></span></a>&nbsp;
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
  /** Admin (8) or OEM Admin (9) only - can send subscription invitations */
  public canInviteClient: boolean = false;
  public brandName: string = 'Synerex';

  // Invite form state
  public showInviteForm: boolean = false;
  public inviteEmail: string = '';
  public inviteCompany: string = '';
  public inviteSending: boolean = false;
  public inviteSuccess: boolean = false;
  public inviteError: string = '';

  constructor(private clientService: ClientService, private currentUserService: CurrentUserService, private whitelabelService: WhitelabelService, private http: HttpClient) {
    this.isAdmin = currentUserService.user.role === 8;
    const role = Number(currentUserService.user.role);
    this.canManageClients = role === 2 || role === 7 || role === 8 || role === 9 || role === 10;
    this.canAddClient = role === 8 || role === 9 || role === 10;
    /** Only OEM Admin (9) and Synerex Admin (8) can send subscription invitations */
    this.canInviteClient = role === 8 || role === 9;
    // OEM users (9, 10): use OEM display name from bootstrap
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

  sendInvite() {
    if (!this.inviteEmail || this.inviteSending) return;
    this.inviteSending = true;
    this.inviteError = '';
    const base = (window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].apiBasePath) || '';
    this.http.post(`${base}/api/client/invite`, {
      email: this.inviteEmail,
      company_name: this.inviteCompany,
    }).subscribe(
      () => {
        this.inviteSending = false;
        this.inviteSuccess = true;
      },
      (err: any) => {
        this.inviteSending = false;
        this.inviteError = (err && err.error && err.error.error) || 'Failed to send invitation. Check email settings.';
      }
    );
  }

  resetInvite() {
    this.inviteEmail = '';
    this.inviteCompany = '';
    this.inviteSuccess = false;
    this.inviteError = '';
  }

}
