import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-deployment-layout',
  templateUrl: './deployment-layout.component.html',
  styleUrls: ['./deployment-layout.component.scss'],
})
export class DeploymentLayoutComponent implements OnInit, OnDestroy {
  depId = 0;
  dep: any = null;
  summary: any = {};
  openIssues = 0;
  currentPath = '';
  loading = true;

  private _subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private api: ApiRequestService,
    public userService: CurrentUserService,
  ) {}

  ngOnInit() {
    this._subs.push(
      this.route.params.subscribe(p => {
        this.depId = +p['id'];
        this._load();
      })
    );
    this._trackRoute();
    this._subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this._trackRoute();
      })
    );
  }

  ngOnDestroy() { this._subs.forEach(s => s.unsubscribe()); }

  private _trackRoute() {
    const url = this.router.url;
    const match = url.match(/\/deployment\/\d+\/?(.*)$/);
    this.currentPath = match ? (match[1] || 'active') : 'active';
  }

  private _load() {
    this.loading = true;
    this.api.get(`/api/dep/deployments/${this.depId}`).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.summary = this.dep.summary || {};
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/dep/deployments/${this.depId}/issues?status=open`).subscribe({
      next: (r: any) => {
        const items = r && r.response ? r.response : [];
        this.openIssues = Array.isArray(items) ? items.length : 0;
      },
      error: () => {}
    });
  }

  // ─── Sidebar data ─────────────────────────────────────────────────────────
  get depName(): string { return (this.dep && this.dep.deployment_name) || 'Deployment'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '';
  }

  get totalDevices(): number { return (this.summary && this.summary.total_devices) || 0; }
  get installedCount(): number { return (this.summary && this.summary.installed) || 0; }
  get inProgressCount(): number { return (this.summary && this.summary.in_progress) || 0; }
  get pendingCount(): number { return (this.summary && this.summary.pending) || 0; }
  get notStartedCount(): number {
    return Math.max(0, this.totalDevices - this.installedCount - this.inProgressCount - this.pendingCount);
  }
  get progressPct(): number {
    if (!this.totalDevices) return 0;
    return Math.round(this.installedCount / this.totalDevices * 100);
  }

  // SVG donut — r=45 → circumference ≈ 282.74
  private readonly _circ = 2 * Math.PI * 45;

  private _seg(pct: number): number {
    return Math.max(0, Math.min(1, pct)) * this._circ;
  }

  get donutSegments(): Array<{color: string; dash: number; offset: number}> {
    const t = this.totalDevices || 1;
    const c  = this.installedCount / t;
    const ip = this.inProgressCount / t;
    const pd = this.pendingCount / t;
    const ns = Math.max(0, 1 - c - ip - pd);
    const segs = [
      { color: '#22c55e', frac: c },
      { color: '#3b82f6', frac: ip },
      { color: '#f59e0b', frac: pd },
      { color: '#1f2937', frac: ns },
    ];
    let off = 0;
    return segs.map(s => {
      const dash = this._seg(s.frac);
      const seg = { color: s.color, dash, offset: -off };
      off += dash;
      return seg;
    });
  }

  get userName(): string {
    const u = this.userService.user;
    if (!u) return '';
    const f = (u.firstName || '').toString().trim();
    const l = (u.lastName || '').toString().trim();
    return (f + ' ' + l).trim() || (u.email || '').toString();
  }
  get userRole(): string {
    const u = this.userService.user;
    return u ? (u.roleFriendlyName || '').toString() : '';
  }
  get userInitials(): string {
    const parts = this.userName.split(' ');
    return parts.map(p => p[0] || '').join('').toUpperCase().slice(0, 2) || 'U';
  }

  isActive(path: string): boolean {
    if (path === 'active') return this.currentPath === 'active' || this.currentPath === '';
    return this.currentPath === path || this.currentPath.startsWith(path + '/');
  }

  go(path: string) {
    if (path === 'active') {
      this.router.navigate(['/ecbs/deployment', this.depId]);
    } else {
      this.router.navigate(['/ecbs/deployment', this.depId, path]);
    }
  }

  goBack() {
    this.router.navigate(['/ecbs/deployment']);
  }
}
