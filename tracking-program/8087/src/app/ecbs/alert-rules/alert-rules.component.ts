import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-alert-rules',
  templateUrl: './alert-rules.component.html',
  styleUrls: ['./alert-rules.component.scss'],
})
export class AlertRulesComponent implements OnInit, OnDestroy {
  projectId: number;
  loading = true;
  alertRules: any[]  = [];
  alarmSummary: any  = null;
  searchQuery        = '';
  currentPage        = 1;
  readonly pageSize  = 12;
  autoRefreshSec     = 10;
  lastUpdated        = '';

  private _timer: any;

  // Chart constants
  readonly DON_R  = 55;
  readonly DON_CX = 70;
  readonly DON_CY = 70;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
    this._timer = setInterval(() => this.loadAll(), this.autoRefreshSec * 1000);
  }

  ngOnDestroy() {
    if (this._timer) { clearInterval(this._timer); }
  }

  loadAll() {
    const pid = this.projectId;
    this.api.get('/api/alert-rules?project_id=' + pid).subscribe({
      next: (r: any) => {
        this.alertRules = Array.isArray(r) ? r : (r?.rules || []);
        this.loading = false;
        this.lastUpdated = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      },
      error: () => { this.loading = false; },
    });
    this.api.get('/api/alarms/summary?project_id=' + pid).subscribe({
      next: (r: any) => { this.alarmSummary = r; },
      error: () => {},
    });
    this.api.get('/api/alarms/active?project_id=' + pid).subscribe({
      next: (r: any) => { this._activeAlarms = r?.alarms || []; },
      error: () => {},
    });
  }

  _activeAlarms: any[] = [];

  // ── KPIs ─────────────────────────────────────────────────────────────────

  get criticalCount(): number { return this.alarmSummary?.critical     ?? this._activeAlarms.filter(a => (a.severity||'').toLowerCase()==='critical').length; }
  get warningCount(): number  { return this.alarmSummary?.high         ?? this._activeAlarms.filter(a => { var s = (a.severity||'').toLowerCase(); return s==='high'||s==='warning'||s==='medium'; }).length; }
  get unacknowledgedCount(): number { return this._activeAlarms.filter(a => a.status === 'new').length; }
  get acknowledgedCount(): number   { return this._activeAlarms.filter(a => a.status === 'acknowledged').length; }

  get normalRules(): number  { return this.alertRules.filter(r => (r.status||'').toLowerCase() === 'normal' || !r.current_status || r.current_status === 'ok').length; }
  get totalRules(): number   { return this.alertRules.length; }
  get enabledRules(): number { return this.alertRules.filter(r => r.is_active !== false).length; }
  get disabledRules(): number{ return this.alertRules.filter(r => r.is_active === false).length; }

  get compliancePct(): number {
    if (!this.totalRules) { return 100; }
    return Math.round((this.normalRules / this.totalRules) * 100);
  }

  get escalationCount(): number {
    return this.alertRules.filter(r => r.escalation_level && r.escalation_level > 0).length;
  }

  get warningRules(): number {
    return this.alertRules.filter(r => (r.current_status||'').toLowerCase() === 'warning').length;
  }

  get criticalRules(): number {
    return this.alertRules.filter(r => (r.current_status||'').toLowerCase() === 'critical').length;
  }

  // ── Alert overview donut ──────────────────────────────────────────────────

  get ruleStatusGroups(): { label: string; count: number; color: string }[] {
    return [
      { label: 'Critical', count: this.criticalRules,                                        color: '#ef5350' },
      { label: 'Warning',  count: this.warningRules,                                         color: '#ffd740' },
      { label: 'Normal',   count: this.normalRules,                                          color: '#00e676' },
      { label: 'Disabled', count: this.disabledRules,                                        color: '#546e7a' },
    ];
  }

  get overviewDonutSegments(): any[] {
    const circ = 2 * Math.PI * this.DON_R;
    const groups = this.ruleStatusGroups;
    const total = groups.reduce((s, g) => s + g.count, 0) || 1;
    let cumPct = 0;
    return groups.map(g => {
      const pct = g.count / total;
      const seg = {
        ...g,
        dash: pct * circ, gap: circ - pct * circ,
        offset: circ * (1 - cumPct),
        pct: Math.round(pct * 100),
      };
      cumPct += pct;
      return seg;
    });
  }

  // ── Filtered & paginated rules ────────────────────────────────────────────

  get filteredRules(): any[] {
    const q = (this.searchQuery || '').toLowerCase();
    if (!q) { return this.alertRules; }
    return this.alertRules.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.metric_key || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q)
    );
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filteredRules.length / this.pageSize)); }

  get visibleRules(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRules.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(5, this.totalPages); i++) { pages.push(i); }
    return pages;
  }

  // ── Top active alerts ─────────────────────────────────────────────────────

  get topActiveAlerts(): any[] {
    return this._activeAlarms
      .sort((a, b) => {
        const sv = (s: string) => s.toLowerCase() === 'critical' ? 3 : s.toLowerCase() === 'high' ? 2 : 1;
        return sv(b.severity || '') - sv(a.severity || '');
      })
      .slice(0, 4);
  }

  // ── Notification status ───────────────────────────────────────────────────

  get notifEmailPct(): number  { return this.alarmSummary?.notify_email_pct  ?? 78; }
  get notifSmsPct(): number    { return this.alarmSummary?.notify_sms_pct    ?? 89; }
  get notifPortalPct(): number { return this.alarmSummary?.notify_portal_pct ?? 100; }

  // ── Rule helpers ──────────────────────────────────────────────────────────

  ruleStatusClass(rule: any): string {
    const s = (rule.current_status || rule.status || '').toLowerCase();
    if (s === 'critical') { return 'status-critical'; }
    if (s === 'warning')  { return 'status-warning';  }
    if (s === 'disabled') { return 'status-disabled'; }
    return 'status-normal';
  }

  ruleStatusLabel(rule: any): string {
    const s = (rule.current_status || rule.status || '').toLowerCase();
    if (s === 'critical') { return 'Critical'; }
    if (s === 'warning')  { return 'Warning';  }
    if (s === 'disabled' || rule.is_active === false) { return 'Disabled'; }
    return 'Normal';
  }

  alertSeverityColor(sev: string): string {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return '#ef5350';
      case 'high':
      case 'warning':  return '#ffd740';
      default:         return '#29b6f6';
    }
  }

  ruleLastTriggered(rule: any): string {
    const ts = rule.last_triggered_at || rule.triggered_at;
    if (!ts) { return '—'; }
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }

  ruleDuration(rule: any): string {
    const ts = rule.triggered_at;
    if (!ts) { return '—'; }
    const ms = Date.now() - ts;
    const min = Math.floor(ms / 60000);
    if (min < 60) { return '00:' + (min < 10 ? '0' : '') + min + ':00'; }
    const hr = Math.floor(min / 60);
    return (hr < 10 ? '0' : '') + hr + ':' + (min % 60 < 10 ? '0' : '') + (min % 60) + ':00';
  }

  toggleRule(rule: any) {
    const was = rule.is_active;
    rule.is_active = !was;
    this.api.put('/api/alert-rules/' + rule.id, { is_active: rule.is_active }).subscribe({
      error: () => { rule.is_active = was; },
    });
  }

  acknowledgeRule(rule: any) {
    this.api.post('/api/alert-rules/' + rule.id + '/acknowledge', {}).subscribe({
      next: () => { rule.acknowledged = true; }, error: () => {},
    });
  }
}
