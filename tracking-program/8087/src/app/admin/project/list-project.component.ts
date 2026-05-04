import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import {AdminProjectService} from "./admin-project.service";
import {ClientService} from "../client/client.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";
import {EnergySavingsService} from "../../savings/energySavings.service";
import {WhitelabelService} from '../../shared/services/whitelabel.service';
import {PENDING_BILL_PROJECT_KEY} from '../../project/create-from-bill/create-from-bill-wizard.component';

@Component({
  template: `
    <div class="container-fluid">
      <div style="display: flex; justify-content: space-between; align-items: center; position: relative;">
        <h3 style="margin: 0; flex: 1 1 auto; text-align: center;">{{pageTitle}}</h3>
        <button *ngIf="canManageProjects" class="btn btn-primary" style="flex-shrink: 0; position: absolute; right: 0;" [routerLink]="['/synerex-administrator/project/create']" [queryParams]="selectedClientId ? {clientId: selectedClientId} : {}">Add new project</button>
      </div>
      <p *ngIf="selectedClientId"><a [routerLink]="['/synerex-administrator/client/list']">&larr; Back to clients</a> &nbsp;|&nbsp; {{pageDescription}} &nbsp;|&nbsp; <a *ngIf="canManageProjects" [routerLink]="['/synerex-administrator/project/create']" [queryParams]="{clientId: selectedClientId}">Add new project</a></p>
      <p *ngIf="!selectedClientId">To explore or edit one of the projects below, just give it a click.</p>

      <!-- Pending "Create from Bill" job banner -->
      <div *ngIf="pendingBillJob"
           style="margin-bottom:1em; padding:0.9em 1.25em; border-radius:6px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;"
           [style.background]="pendingBillJob._status === 'done' ? '#d4edda' : pendingBillJob._status === 'error' ? '#f8d7da' : '#f5f0ff'"
           [style.border]="pendingBillJob._status === 'done' ? '1px solid #c3e6cb' : pendingBillJob._status === 'error' ? '1px solid #f5c6cb' : '1px solid #c8b4e0'">
        <div>
          <strong style="color:#4a1a5c;">Create Project from Bill</strong>
          <span style="margin-left:0.5em; color:#555; font-size:0.9em;">{{ pendingBillJob.filename }}</span>
          <span *ngIf="!pendingBillJob._status || pendingBillJob._status === 'pending'"
                style="margin-left:0.75em; font-size:0.82em; color:#555;">
            Scanning&hellip; ({{ getElapsedMin() }} min elapsed, est. {{ pendingBillJob.estimated_minutes }} min)
          </span>
          <span *ngIf="pendingBillJob._status === 'done'"
                style="margin-left:0.75em; padding:2px 8px; border-radius:10px; background:#c3e6cb; color:#155724; font-size:0.82em; font-weight:bold;">
            &#10003; Ready
          </span>
          <span *ngIf="pendingBillJob._status === 'error'"
                style="margin-left:0.75em; padding:2px 8px; border-radius:10px; background:#f5c6cb; color:#721c24; font-size:0.82em;">
            Failed
          </span>
          <span *ngIf="pendingBillJob._status === 'error' && pendingBillJob._errorMsg"
                style="margin-left:0.5em; font-size:0.82em; color:#721c24;">
            &mdash; {{ pendingBillJob._errorMsg }}
          </span>
        </div>
        <div style="display:flex; gap:6px;">
          <button *ngIf="pendingBillJob._status === 'done'" type="button"
                  class="btn btn-success btn-sm" (click)="resumeBillProject()">
            Continue Setup &rarr;
          </button>
          <button *ngIf="pendingBillJob._status === 'error'" type="button"
                  class="btn btn-warning btn-sm" (click)="retryBillProject()">
            Try Again
          </button>
          <button type="button" class="btn btn-default btn-sm" (click)="dismissBillProject()">Dismiss</button>
        </div>
      </div>
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
export class ProjectListComponent implements OnInit, OnDestroy {

  public projects:any;
  public pendingBillJob: any = null;
  private _pendingPollInterval: any = null;
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
    private http: HttpClient,
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
    // Load any pending "create from bill" job and start polling
    this._loadPendingBillJob();
    if (this.pendingBillJob) {
      this._pollPendingBillJob();
      this._pendingPollInterval = setInterval(() => this._pollPendingBillJob(), 30000);
    }
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
    // Always fetch the full project shape (electricBillAnalysis, reportFields, etc.) so the
    // bill analytic page has complete data regardless of how the user navigated here.
    // The admin list returns slim rows without these fields, so we cannot use `row` directly.
    this.projectService.get(projectId).subscribe((res: any) => {
      const p = res.response || res;
      if (p && p.id) {
        // Replace any stale/slim entry for this project, then prepend the full version.
        const existing = (this.currentUserService.user.projects || []).filter((x: any) => x.id != projectId);
        this.currentUserService.user.projects = [p, ...existing];
        if (typeof window !== 'undefined' && window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].user) {
          window['BOOTSTRAP_DATA'].user.projects = this.currentUserService.user.projects;
        }
        this.currentUserService.selectProject(projectId);
        this.router.navigate(['/savings/energy-savings']);
      }
    }, () => {
      // Fallback: if fetch fails, use whatever is already in user.projects
      const inUserProjects = (this.currentUserService.user.projects || []).some((x: any) => x.id == projectId);
      if (inUserProjects) {
        this.currentUserService.selectProject(projectId);
        this.router.navigate(['/savings/energy-savings']);
      }
    });
  }

  calculateSavings(){
    this.energySavingsService.calculateSavings().subscribe(result => {});  
 }

  calculateProjectSavings(){
    this.energySavingsService.calculateProjectSavings().subscribe(result => {});  
 }

  ngOnDestroy() {
    if (this._pendingPollInterval) clearInterval(this._pendingPollInterval);
  }

  private _loadPendingBillJob() {
    try {
      const raw = localStorage.getItem(PENDING_BILL_PROJECT_KEY);
      this.pendingBillJob = raw ? JSON.parse(raw) : null;
    } catch (_) { this.pendingBillJob = null; }
  }

  private _pollPendingBillJob() {
    if (!this.pendingBillJob) return;
    if (this.pendingBillJob._status === 'done' || this.pendingBillJob._status === 'error') return;
    const gpuJobId = this.pendingBillJob.gpu_job_id;
    this.http.get(`/tracking/api/bill/analyze/${gpuJobId}`, { withCredentials: true }).subscribe(
      (res: any) => {
        if (res.status === 'done') {
          this.pendingBillJob._status = 'done';
        } else if (res.status === 'error') {
          this.pendingBillJob._status = 'error';
          this.pendingBillJob._errorMsg = res.error || 'Analysis failed.';
        } else {
          this.pendingBillJob._status = res.status || 'pending';
        }
      },
      () => { /* network error — will retry on next tick */ }
    );
  }

  getElapsedMin(): number {
    if (!this.pendingBillJob || !this.pendingBillJob.submitted_at) return 0;
    return Math.round((Date.now() - this.pendingBillJob.submitted_at) / 60000);
  }

  resumeBillProject() {
    if (!this.pendingBillJob) return;
    this.router.navigate(['/project/create-from-bill'], {
      queryParams: { resume: this.pendingBillJob.gpu_job_id }
    });
  }

  retryBillProject() {
    this.dismissBillProject();
    this.router.navigate(['/project/create-from-bill']);
  }

  dismissBillProject() {
    try { localStorage.removeItem(PENDING_BILL_PROJECT_KEY); } catch (_) {}
    this.pendingBillJob = null;
    if (this._pendingPollInterval) {
      clearInterval(this._pendingPollInterval);
      this._pendingPollInterval = null;
    }
  }

}
