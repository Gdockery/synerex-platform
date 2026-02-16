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
      <h3>{{pageTitle}}
        <button class="btn btn-primary pull-right" [routerLink]="['/xeco-administrator/project/create']" [queryParams]="selectedClientId ? {clientId: selectedClientId} : {}">Add new project</button>
      </h3>
      <p *ngIf="selectedClientId"><a [routerLink]="['/xeco-administrator/client/list']">&larr; Back to clients</a> &nbsp;|&nbsp; {{pageDescription}}</p>
      <p *ngIf="!selectedClientId">To explore or edit one of the projects below, just give it a click.</p>
      <p-dataTable tableStyleClass="table dataTable table-striped table-bordered" [value]="projects" [lazy]="true" [paginator]="true" [rows]="perPage"
                   [totalRecords]="recordCount" (onLazyLoad)="fetch($event)">
        <p-column field="name" header="Project" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column *ngIf="!selectedClientId" field="client.name" header="Client" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="xecoManager.fullName" [header]="brandName + ' Manager'" [sortable]="true" [filter]="true" [filterMatchMode]="'contains'"></p-column>
        <p-column field="slug" header="Slug"></p-column>
        <p-column field="" header="" [filterMatchMode]="'contains'" [style]="{'width': isAdmin ? '140px' : '90px'}" styleClass="text-center">
          <ng-template let-row="rowData" pTemplate="body">
            <a *ngIf="isAdmin" class="btn btn-sm btn-primary" [routerLink]="['/xeco-administrator/project/edit', row.id]"><span class="button-icon ss-write"></span></a>&nbsp;
            <span *ngIf="isAdmin" (click)="goToProject(row.id)" class="btn btn-sm btn-info">View&nbsp;<span class="button-icon ss-navigateright"></span></span>
          </ng-template>
        </p-column>
      </p-dataTable>
    </div>
  `
})
export class ProjectListComponent implements OnInit {

  public projects:any;
  private isAdmin:boolean;
  private syncingProjects;
  private recordCount = 0;
  private perPage = 17;
  public selectedClientId;
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
    this.selectedClientId = route.snapshot.params['clientId'];
  }

  ngOnInit() {
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    if (this.selectedClientId) {
      this.pageTitle = 'Projects';
      this.clientService.get(this.selectedClientId).subscribe((res: any) => {
        const c = res.response || res;
        this.pageTitle = c.name ? `Projects for ${c.name}` : 'Projects for this client';
      }, () => {
        this.pageTitle = 'Projects for this client';
      });
    }
  }

  fetch(params) {
    if (this.selectedClientId) {
      params.client = this.selectedClientId;
    }
    if (this.isAdmin) {
      this.projectService.getPaginated(params).subscribe(responseData => {
        const meta = responseData && responseData.meta;
        this.recordCount = (meta && meta.total != null) ? meta.total : (responseData.response || []).length;
        this.projects = responseData && responseData.response ? responseData.response : [];
      });
    } else {
      this.projects = [];
    }
  }

  goToProject(projectId) {
    // Set the current project
    this.currentUserService.selectProject(projectId);
    console.log("projectId",projectId);
    this.router.navigate(['/savings/energy-savings']);
  }

  calculateSavings(){
    this.energySavingsService.calculateSavings().subscribe(result => {});  
 }

  calculateProjectSavings(){
    this.energySavingsService.calculateProjectSavings().subscribe(result => {});  
 }

}
