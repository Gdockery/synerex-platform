import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ApiRequestService } from '../../api/api-request.service';
import { PENDING_BILL_PROJECT_KEY } from '../create-from-bill/create-from-bill-wizard.component';

@Component({
  selector: 'pipeline-list',
  template: `
    <div class="container-fluid" style="padding: 20px;">
      <h3 style="margin-bottom: 20px;">
        Pipeline Projects
        <span class="badge" style="font-size: 14px; margin-left: 10px; background: #3498db;">{{ projects.length }}</span>
        <button class="btn btn-primary btn-sm" style="margin-left: 16px; float: right;"
                [routerLink]="['/project/create-from-bill']">
          + Scan New Bill
        </button>
      </h3>

      <!-- Pending "Create from Bill" job banner -->
      <div *ngIf="pendingBillJob"
           style="margin-bottom:1em; padding:0.9em 1.25em; border-radius:6px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;"
           [style.background]="pendingBillJob._status === 'done' ? '#d4edda' : pendingBillJob._status === 'error' ? '#f8d7da' : '#f5f0ff'"
           [style.border]="pendingBillJob._status === 'done' ? '1px solid #c3e6cb' : pendingBillJob._status === 'error' ? '1px solid #f5c6cb' : '1px solid #c8b4e0'">
        <div>
          <strong style="color:#4a1a5c;">Bill Scan in Progress</strong>
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

      <div *ngIf="loading" class="text-center" style="padding: 40px;">
        <span class="ss-loading"></span> Loading pipeline&hellip;
      </div>

      <div *ngIf="!loading && projects.length === 0 && !pendingBillJob" class="text-muted" style="padding: 20px;">
        No active pipeline projects. Click <strong>+ Scan New Bill</strong> to get started.
      </div>

      <div *ngIf="!loading">
        <!-- Filter bar -->
        <div style="margin-bottom: 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
          <label style="font-weight: 600; margin-bottom: 0;">Filter:</label>
          <button class="btn btn-xs" [class.btn-primary]="filter === 'all'" [class.btn-default]="filter !== 'all'" (click)="filter='all'">All ({{ projects.length }})</button>
          <button class="btn btn-xs" [class.btn-warning]="filter === 'waiting'" [class.btn-default]="filter !== 'waiting'" (click)="filter='waiting'">
            Waiting on Customer ({{ waitingCount }})
          </button>
          <button class="btn btn-xs" [class.btn-success]="filter === 'progressing'" [class.btn-default]="filter !== 'progressing'" (click)="filter='progressing'">Progressing ({{ progressingCount }})</button>
        </div>

        <!-- Project cards -->
        <div *ngFor="let p of filteredProjects()" class="pipeline-card" (click)="openProject(p)"
          style="background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 16px 20px;
                 margin-bottom: 12px; cursor: pointer; display: flex; align-items: center;
                 justify-content: space-between; gap: 16px; transition: box-shadow .15s;"
          onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.12)'"
          onmouseout="this.style.boxShadow='none'">

          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ p.name }}</div>
            <div style="color: #777; font-size: 13px;">{{ p.client_name }}<span *ngIf="p.location"> &mdash; {{ p.location }}</span></div>
          </div>

          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 13px; font-weight: 600; color: #555; margin-bottom: 4px;">{{ p.current_stage }}</div>
            <span *ngIf="p.waiting_on_customer"
              style="background: #e67e22; color: #fff; font-size: 11px; font-weight: 700;
                     padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: .5px;">
              Waiting on Customer
            </span>
            <span *ngIf="!p.waiting_on_customer && p.release_status"
              style="background: #27ae60; color: #fff; font-size: 11px; font-weight: 700;
                     padding: 2px 8px; border-radius: 10px;">
              Released
            </span>
          </div>

          <div style="flex-shrink: 0; color: #aaa; font-size: 18px;">&rsaquo;</div>
        </div>
      </div>
    </div>
  `
})
export class PipelineListComponent implements OnInit, OnDestroy {
  projects: any[] = [];
  loading = true;
  filter: 'all' | 'waiting' | 'progressing' = 'all';
  pendingBillJob: any = null;
  private _pendingPollInterval: any = null;

  get waitingCount() { return this.projects.filter(p => p.waiting_on_customer).length; }
  get progressingCount() { return this.projects.filter(p => !p.waiting_on_customer).length; }

  constructor(
    private api: ApiRequestService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.api.get('/api/pipeline/projects').subscribe(
      (res: any) => {
        this.projects = Array.isArray(res) ? res : (res.response || []);
        this.loading = false;
      },
      () => { this.loading = false; }
    );

    // Load any pending "create from bill" job and start polling
    this._loadPendingBillJob();
    if (this.pendingBillJob) {
      this._pollPendingBillJob();
      this._pendingPollInterval = setInterval(() => this._pollPendingBillJob(), 30000);
    }
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
      () => { /* network error — retry on next tick */ }
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

  filteredProjects() {
    if (this.filter === 'waiting')     return this.projects.filter(p => p.waiting_on_customer);
    if (this.filter === 'progressing') return this.projects.filter(p => !p.waiting_on_customer);
    return this.projects;
  }

  openProject(p: any) {
    this.router.navigate(['/project/pipeline', p.id]);
  }
}
