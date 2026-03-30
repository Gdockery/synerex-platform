import { Component, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import {AdminProjectService} from "./admin-project.service";
import {ClientService} from "../client/client.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";
import {EnergySavingsService} from "../../savings/energySavings.service";
import {WhitelabelService} from '../../shared/services/whitelabel.service';

@Component({
  template: `
    <div class="container-fluid">
      <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
        <h3 style="margin: 0; flex: 1 1 auto; text-align: center;">{{pageTitle}}</h3>
        <button *ngIf="canManageProjects" class="btn btn-primary" style="flex-shrink: 0; position: absolute; right: 0;" [routerLink]="['/synerex-administrator/project/create']" [queryParams]="selectedClientId ? {clientId: selectedClientId} : {}">Add new project</button>
      </div>
      <p *ngIf="selectedClientId"><a [routerLink]="['/synerex-administrator/client/list']">&larr; Back to clients</a> &nbsp;|&nbsp; {{pageDescription}} &nbsp;|&nbsp; <a *ngIf="canManageProjects" [routerLink]="['/synerex-administrator/project/create']" [queryParams]="{clientId: selectedClientId}">Add new project</a></p>
      <p *ngIf="!selectedClientId">To explore or edit one of the projects below, just give it a click.</p>
      <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="projects" [lazy]="true" [paginator]="true" [rows]="perPage"
                   [totalRecords]="recordCount" (onLazyLoad)="fetch($event)">
        <p-column field="name" header="Project" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column *ngIf="!selectedClientId" field="client.name" header="Client" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="xecoManager.fullName" [header]="(clientName || brandName) + ' Manager'" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="slug" header="Slug"></p-column>
        <p-column field="" header="" [filterMatchMode]="'contains'" [style]="{'width': (canManageProjects || canViewOwnProjects) ? '140px' : '90px'}" styleClass="text-center">
          <ng-template let-row="rowData" pTemplate="body">
            <a *ngIf="canManageProjects" class="btn btn-sm btn-primary" [routerLink]="['/synerex-administrator/project/edit', row.id]"><span class="button-icon ss-write"></span></a>&nbsp;
            <a *ngIf="canManageProjects || canViewOwnProjects" href="#" (click)="goToProject($event, row)" class="btn btn-sm btn-info">View&nbsp;<span class="button-icon ss-navigateright"></span></a>
          </ng-template>
        </p-column>
      </p-dataTable>
    </div>
  `
})
export class ProjectListComponent implements OnInit {

  public projects:any;
  private isAdmin: boolean;
  /** Admin (8) or OEM (9, 10) - can view/edit projects. Client (7) can view own client's projects. */
  public canManageProjects: boolean;
  /** Client (7) viewing their own client's projects can fetch and view (but not edit) */
  public canViewOwnProjects: boolean;
  private syncingProjects;
  private recordCount = 0;
  private perPage = 17;
  public selectedClientId;
  public clientName: string = '';
  public brandName: string = 'Synerex';
  public pageTitle = 'Manage Projects';
  public pageDescription = 'Add a new project for this client or select an existing project to view.';

  constructor(
    private currentUserService: CurrentUserService,
    private route: ActivatedRoute,
    private router: Router,
    private projectService: AdminProjectService,
    private clientService: ClientService,
    private deviceService: DeviceService,
    private energySavingsService: EnergySavingsService,
    private whitelabelService: WhitelabelService,
  ) {
    this.isAdmin = currentUserService.user.role === 8;
    const role = Number(currentUserService.user.role);
    this.canManageProjects = role === 8 || role === 9 || role === 10;
    this.selectedClientId = route.snapshot.params['clientId'];
    const userClientId = currentUserService.user.client && (currentUserService.user.client.id || currentUserService.user.client);
    this.canViewOwnProjects = role === 7 && !!this.selectedClientId && userClientId == this.selectedClientId;
  }

  ngOnInit() {
    this.currentUserService.deselectProject();
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    if (this.selectedClientId) {
      this.pageTitle = 'Projects';
      this.clientService.get(this.selectedClientId).subscribe((res: any) => {
        const c = res.response || res;
        this.clientName = (c.legalName || c.name || '').trim();
        this.pageTitle = c.name ? `Projects for ${c.name}` : 'Projects for this client';
      }, () => {
        this.pageTitle = 'Projects for this client';
      });
    }
  }

  fetch(params) {
    if (!params || params.first == null || params.rows == null) {
      params = { first: 0, rows: this.perPage };
    }
    if (this.selectedClientId) {
      params.client = this.selectedClientId;
    }
    if (this.canManageProjects) {
      this.projectService.getPaginated(params).subscribe(responseData => {
        const meta = responseData && responseData.meta;
        this.recordCount = (meta && meta.total != null) ? meta.total : (responseData.response || []).length;
        this.projects = responseData && responseData.response ? responseData.response : [];
      });
    } else {
      this.projects = [];
    }
  }

  goToProject(event: Event, row: any) {
    event.preventDefault();
    const projectId = row && (row.id || row);
    if (!projectId) return;
    const inUserProjects = (this.currentUserService.user.projects || []).some((p: any) => p.id == projectId);
    if (inUserProjects) {
      this.currentUserService.selectProject(projectId);
      this.router.navigate(['/savings/energy-savings']);
      return;
    }
    // Project not in user.projects (e.g. OEM viewing client's projects) - use row or fetch
    const proj = row && typeof row === 'object' && row.id ? row : null;
    if (proj) {
      const existing = this.currentUserService.user.projects || [];
      this.currentUserService.user.projects = [proj, ...existing];
      if (typeof window !== 'undefined' && window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].user) {
        window['BOOTSTRAP_DATA'].user.projects = this.currentUserService.user.projects;
      }
      this.currentUserService.selectProject(projectId);
      this.router.navigate(['/savings/energy-savings']);
      return;
    }
    this.projectService.get(projectId).subscribe((res: any) => {
      const p = res.response || res;
      if (p && p.id) {
        const existing = this.currentUserService.user.projects || [];
        this.currentUserService.user.projects = [p, ...existing];
        if (typeof window !== 'undefined' && window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].user) {
          window['BOOTSTRAP_DATA'].user.projects = this.currentUserService.user.projects;
        }
        this.currentUserService.selectProject(projectId);
        this.router.navigate(['/savings/energy-savings']);
      }
    }, () => {});
  }

  calculateSavings(){
    this.energySavingsService.calculateSavings().subscribe(result => {});  
 }

  calculateProjectSavings(){
    this.energySavingsService.calculateProjectSavings().subscribe(result => {});  
 }

}
