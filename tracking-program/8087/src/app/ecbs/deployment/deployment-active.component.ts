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
  private _timer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
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
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/devices').subscribe({
      next: (r: any) => {
        this.devices = (r && r.response) ? r.response : [];
      },
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/events?limit=8').subscribe({
      next: (r: any) => {
        this.events = (r && r.response) ? r.response : [];
      },
    });
  }

  get pendingDevices(): any[] {
    var result: any[] = [];
    for (var i = 0; i < this.devices.length; i++) {
      var d = this.devices[i];
      if (d.status !== 'Commissioned') result.push(d);
    }
    return result.slice(0, 5);
  }

  get progressPct(): number { return (this.summary && this.summary.progress_pct) || 0; }
  get totalDevices(): number { return (this.summary && this.summary.total_devices) || 0; }
  get installedCount(): number { return (this.summary && this.summary.installed) || 0; }
  get commissionedCount(): number { return (this.summary && this.summary.commissioned) || 0; }
  get inProgressCount(): number { return (this.summary && this.summary.in_progress) || 0; }
  get pendingCount(): number { return (this.summary && this.summary.pending) || 0; }
  get openIssues(): number { return (this.summary && this.summary.open_issues) || 0; }
  get safetyHolds(): number { return (this.summary && this.summary.safety_holds) || 0; }

  get depNumber(): string { return (this.dep && this.dep.deployment_number) || 'DEP'; }
  get depName(): string { return (this.dep && (this.dep.deployment_name || this.dep.notes)) || ('Deployment #' + this.depId); }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }

  statusLabel(s: string): string {
    var m: any = {
      'not_started': 'Not Started', 'scheduled': 'Scheduled',
      'installing': 'IN PROGRESS', 'commissioning': 'Commissioning',
      'awaiting_approval': 'Awaiting Approval', 'activated': 'Activated',
      'on_hold': 'On Hold', 'closed': 'Closed',
    };
    return m[s] || s;
  }

  statusClass(s: string): string {
    if (s === 'Commissioned') return 'sv-commissioned';
    if (s === 'Installed' || s === 'CT Verified' || s === 'Communications Verified') return 'sv-installed';
    if (s === 'In Progress') return 'sv-progress';
    return 'sv-pending';
  }

  fmtTs(ms: any): string {
    if (!ms) return '—';
    var d = new Date(Number(ms));
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  fmtEvent(e: any): string {
    var m: any = {
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
    return m[e.event_type] || e.event_type;
  }

  go(page: string) {
    this.router.navigate(['/ecbs/deployment', this.depId, page]);
  }

  startDeployment() {
    this.api.patch('/api/dep/deployments/' + this.depId + '/status', { status: 'installing' }).subscribe({
      next: () => this.load(),
    });
  }

  continueDeployment() {
    var next = this.pendingDevices[0];
    if (next) {
      this.router.navigate(['/ecbs/deployment', this.depId, 'devices'], { queryParams: { device: next.id } });
    } else {
      this.go('commissioning');
    }
  }

  get donutCircumference(): number { return 2 * Math.PI * 52; }
  get donutOffset(): number {
    return this.donutCircumference * (1 - this.progressPct / 100);
  }
}
