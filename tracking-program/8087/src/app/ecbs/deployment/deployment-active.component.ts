import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-active',
  templateUrl: './deployment-active.component.html',
  styleUrls: ['./deployment-active.component.scss'],
})
export class DeploymentActiveComponent implements OnInit, OnDestroy {
  depId: number = 0;
  dep: any = null;
  summary: any = {};
  devices: any[] = [];
  events: any[] = [];
  loading = true;
  syncedAt: string = '';
  private _timer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
    this._timer = setInterval(() => this.load(), 30000);
  }

  ngOnDestroy() {
    if (this._timer) clearInterval(this._timer);
  }

  load() {
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        if (r && r.response) {
          this.dep = r.response;
          this.summary = r.response.summary || {};
        }
        this.syncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/devices').subscribe({
      next: (r: any) => { this.devices = (r && r.response) ? r.response : []; },
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/events?limit=8').subscribe({
      next: (r: any) => { this.events = (r && r.response) ? r.response : []; },
    });
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  get depNumber(): string { return (this.dep && this.dep.deployment_number) || 'DEP'; }
  get depName(): string   { return (this.dep && (this.dep.deployment_name || this.dep.notes)) || ('Deployment #' + this.depId); }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }

  get projectName(): string { return (this.dep && this.dep.project_info && this.dep.project_info.name) || '—'; }
  get siteName(): string    { return (this.dep && this.dep.site_info && this.dep.site_info.name) || this.projectName; }
  get siteAddress(): string {
    var s = this.dep && this.dep.site_info;
    if (!s) return '—';
    return [s.address, s.city, s.state].filter(Boolean).join(', ') || '—';
  }
  get siteUtility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get pmName(): string        { return (this.dep && this.dep.pm_name) || '—'; }
  get fieldLeadName(): string { return (this.dep && this.dep.field_lead_name) || '—'; }
  get photosCount(): number   { return (this.dep && this.dep.photos_count) || 0; }

  get startedLabel(): string {
    var ms = this.dep && this.dep.started_at;
    return ms ? new Date(Number(ms)).toLocaleDateString() : '—';
  }
  get estCompletionLabel(): string {
    var d = this.dep && this.dep.est_completion_date;
    return d || '—';
  }

  get totalDevices(): number   { return (this.summary && this.summary.total_devices)  || 0; }
  get installedCount(): number { return (this.summary && this.summary.installed)       || 0; }
  get commissionedCount(): number { return (this.summary && this.summary.commissioned) || 0; }
  get inProgressCount(): number { return (this.summary && this.summary.in_progress)   || 0; }
  get pendingCount(): number   { return (this.summary && this.summary.pending)         || 0; }
  get openIssues(): number     { return (this.summary && this.summary.open_issues)     || 0; }
  get safetyHolds(): number    { return (this.summary && this.summary.safety_holds)    || 0; }
  get progressPct(): number    { return (this.summary && this.summary.progress_pct)    || 0; }

  get donutCircumference(): number { return 2 * Math.PI * 52; }
  get donutOffset(): number {
    return this.donutCircumference * (1 - this.progressPct / 100);
  }

  // Devices for Today's Work (non-commissioned first, up to 5)
  get todayTasks(): any[] {
    var pending = this.devices.filter(d => d.status !== 'Commissioned');
    return pending.slice(0, 5);
  }

  // "Deployment Health" derived from device statuses
  get devicesReporting(): number {
    return this.devices.filter(d => d.comms_verified).length;
  }

  // Milestone progress items
  get milestones(): any[] {
    var t = this.totalDevices;
    return [
      { label: 'Install All Devices',     current: this.installedCount,    total: t, pct: t ? Math.round(this.installedCount / t * 100) : 0 },
      { label: 'Commission All Devices',  current: this.commissionedCount,  total: t, pct: t ? Math.round(this.commissionedCount / t * 100) : 0 },
      { label: 'Close Open Issues',       current: 0,                       total: this.openIssues, pct: this.openIssues ? 0 : 100 },
      { label: 'Complete Commissioning',  current: this.commissionedCount,  total: t, pct: t ? Math.round(this.commissionedCount / t * 100) : 0 },
    ];
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  statusLabel(s: string): string {
    var m: any = {
      'not_started': 'NOT STARTED', 'scheduled': 'SCHEDULED',
      'installing': 'IN PROGRESS', 'commissioning': 'COMMISSIONING',
      'awaiting_approval': 'AWAITING APPROVAL', 'activated': 'ACTIVATED',
      'on_hold': 'ON HOLD', 'closed': 'CLOSED',
    };
    return m[s] || s.toUpperCase();
  }

  statusBadgeClass(s: string): string {
    var m: any = {
      'not_started': 'badge-pending', 'scheduled': 'badge-warning',
      'installing': 'badge-progress', 'commissioning': 'badge-progress',
      'awaiting_approval': 'badge-warning', 'activated': 'badge-active',
      'on_hold': 'badge-hold', 'closed': 'badge-active',
    };
    return m[s] || 'badge-pending';
  }

  deviceStatusLabel(s: string): string {
    var m: any = {
      'Pending': 'PENDING', 'In Progress': 'IN PROGRESS',
      'Installed': 'INSTALLED', 'CT Verified': 'COMPLETED',
      'Communications Verified': 'COMPLETED', 'Commissioned': 'COMMISSIONED',
    };
    return m[s] || s;
  }

  deviceStatusClass(s: string): string {
    if (s === 'Commissioned' || s === 'CT Verified' || s === 'Communications Verified') return 'task-done';
    if (s === 'In Progress' || s === 'Installed') return 'task-progress';
    return 'task-pending';
  }

  eventLabel(type: string): string {
    var m: any = {
      'DEPLOYMENT_CREATED': 'Deployment Created',
      'DEVICE_INSTALLED': 'Device Installed',
      'DEVICE_COMMISSIONED': 'Device Commissioned',
      'CT_VERIFIED': 'CT Verification Complete',
      'COMMISSIONING_COMPLETED': 'Commissioning Complete',
      'ISSUE_CREATED': 'Issue Created',
      'ISSUE_RESOLVED': 'Issue Resolved',
      'PHOTO_UPLOADED': 'Photos Uploaded',
      'SAFETY_HOLD_CREATED': 'Safety Hold Created',
      'SAFETY_HOLD_RELEASED': 'Safety Hold Released',
      'STATUS_CHANGED_INSTALLING': 'Deployment Started',
      'STATUS_CHANGED_COMMISSIONING': 'Commissioning Phase',
      'STATUS_CHANGED_ACTIVATED': 'Released to Operations',
    };
    return m[type] || type;
  }

  fmtTs(ms: any): string {
    if (!ms) return '';
    return new Date(Number(ms)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  go(page: string) {
    this.router.navigate(['/ecbs/deployment', this.depId, page]);
  }

  goBack() {
    this.router.navigate(['/ecbs/deployment']);
  }

  startDeployment() {
    this.api.patch('/api/dep/deployments/' + this.depId + '/status', { status: 'installing' }).subscribe({
      next: () => this.load(),
    });
  }

  continueDeployment() {
    var next = this.devices.filter(d => d.status !== 'Commissioned')[0];
    if (next) {
      this.router.navigate(['/ecbs/deployment', this.depId, 'devices'], { queryParams: { device: next.id } });
    } else {
      this.go('commissioning');
    }
  }
}
