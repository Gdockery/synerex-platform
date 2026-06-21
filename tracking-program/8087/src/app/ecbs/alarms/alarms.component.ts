import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-alarms',
  templateUrl: './alarms.component.html',
  styleUrls: ['./alarms.component.scss'],
})
export class AlarmsComponent implements OnInit {
  projectId: number;
  loading = true;
  alarms: any[]        = [];
  historyAlarms: any[] = [];
  events: any[]        = [];
  summary: any         = null;
  alertRules: any[]    = [];

  activeTab: 'alarms' | 'history' | 'events' | 'rules' = 'alarms';

  // Filters
  filterSeverity = '';
  filterStatus   = '';

  // Alert rule modal
  showRuleModal = false;
  editingRule: any    = null;
  newRule: any = {
    name: '', category: 'Utility', metric_key: '', condition: '>', threshold: null,
    unit: '', severity: 'high', description: '', notify_email: true, notify_push: true, notify_sms: false,
  };

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    const pid = this.projectId;

    // Active alarms — correct endpoint is /api/alarms/active
    this.api.get(`/api/alarms/active?project_id=${pid}`).subscribe({
      next: (r: any) => { this.alarms = r?.alarms || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
    // Summary KPIs
    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.summary = r; },
      error: () => {},
    });
    // Event log
    this.api.get(`/api/alarms/events?project_id=${pid}&limit=100`).subscribe({
      next: (r: any) => { this.events = r?.events || r || []; },
      error: () => {},
    });
    // Alert rules
    this.api.get(`/api/alert-rules?project_id=${pid}`).subscribe({
      next: (r: any) => { this.alertRules = Array.isArray(r) ? r : (r?.rules || []); },
      error: () => {},
    });
    // Alarm history (resolved/closed in last 30 days)
    this.api.get(`/api/alarms/history?project_id=${pid}&limit=100`).subscribe({
      next: (r: any) => { this.historyAlarms = r?.alarms || []; },
      error: () => {},
    });
  }

  // ── Computed summary KPIs ──────────────────────────────────────────────────

  get criticalCount(): number    { return this.summary?.critical     ?? 0; }
  get warningCount(): number     { return this.summary?.high         ?? 0; }
  get mediumCount(): number      { return this.summary?.medium       ?? 0; }
  get infoCount(): number        { return this.summary?.information  ?? 0; }
  get totalActive(): number      { return this.summary?.total_active ?? this.alarms.length; }
  get mttrMinutes(): number|null { return this.summary?.mttr_minutes ?? null; }
  get acknowledged(): number     { return this.alarms.filter(a => a.status === 'acknowledged').length; }
  get resolvedToday(): number    {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    return this.historyAlarms.filter(a => a.resolved_at && a.resolved_at >= startOfDay.getTime()).length;
  }

  get alarmRate7d(): string {
    // total active / 7 = avg per day (approximation; real rate would need historical data)
    const rate = (this.totalActive / 7);
    return rate > 0 ? rate.toFixed(1) : '0.0';
  }
  get systemHealthPct(): number {
    const score = 100
      - (this.criticalCount * 20)
      - (this.warningCount * 10)
      - (this.mediumCount * 5);
    return Math.max(0, Math.min(100, score));
  }
  get systemHealthLabel(): string {
    const h = this.systemHealthPct;
    if (h >= 95) return 'Excellent';
    if (h >= 85) return 'Good';
    if (h >= 70) return 'Fair';
    return 'Needs Attention';
  }
  get mttrDisplay(): string {
    if (this.mttrMinutes == null) return '—';
    if (this.mttrMinutes < 60)    return this.mttrMinutes.toFixed(0) + ' min';
    return (this.mttrMinutes / 60).toFixed(1) + ' hr';
  }

  // ── Filtered alarm list ────────────────────────────────────────────────────

  get filteredAlarms(): any[] {
    let list = this.alarms;
    if (this.filterSeverity) list = list.filter(a => a.severity === this.filterSeverity);
    if (this.filterStatus)   list = list.filter(a => a.status   === this.filterStatus);
    return list;
  }

  // ── Duration helpers ───────────────────────────────────────────────────────

  alarmDuration(alarm: any): string {
    if (!alarm.triggered_at) { return '—'; }
    const ms = Date.now() - alarm.triggered_at;
    const min = Math.floor(ms / 60000);
    if (min < 60)  { return min + 'm'; }
    const hr = Math.floor(min / 60);
    if (hr < 24)   { return hr + 'h ' + (min % 60) + 'm'; }
    return Math.floor(hr / 24) + 'd ' + (hr % 24) + 'h';
  }

  // ── Severity styling ───────────────────────────────────────────────────────

  severityClass(sev: string): string {
    switch ((sev || '').toLowerCase()) {
      case 'critical':    return 'badge-critical';
      case 'high':        return 'badge-warning';
      case 'medium':      return 'badge-info';
      case 'information': return 'badge-info';
      default:            return 'badge-offline';
    }
  }
  severityColor(sev: string): string {
    switch ((sev || '').toLowerCase()) {
      case 'critical':    return '#ef5350';
      case 'high':        return '#ffd740';
      case 'medium':      return '#29b6f6';
      default:            return '#546e7a';
    }
  }

  // ── Alarm actions ──────────────────────────────────────────────────────────

  acknowledgeAll() {
    this.alarms.filter(a => a.status === 'new').forEach(a => this.acknowledgeAlarm(a));
  }

  acknowledgeAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/acknowledge`, {}).subscribe({
      next: () => { alarm.status = 'acknowledged'; alarm.acknowledged_at = Date.now(); },
      error: () => {},
    });
  }
  resolveAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/resolve`, {}).subscribe({
      next: () => { alarm.status = 'resolved'; alarm.resolved_at = Date.now(); },
      error: () => {},
    });
  }
  assignAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/assign`, {}).subscribe({
      next: () => { alarm.status = 'assigned'; }, error: () => {},
    });
  }
  startAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/start`, {}).subscribe({
      next: () => { alarm.status = 'in_progress'; }, error: () => {},
    });
  }
  closeAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/close`, {}).subscribe({
      next: () => { this.alarms = this.alarms.filter(a => a.id !== alarm.id); },
      error: () => {},
    });
  }

  // ── Alert rule CRUD ────────────────────────────────────────────────────────

  openCreateRule() {
    this.editingRule = null;
    this.newRule = {
      name: '', category: 'Utility', metric_key: '', condition: '>', threshold: null,
      unit: '', severity: 'high', description: '', notify_email: true, notify_push: true, notify_sms: false,
    };
    this.showRuleModal = true;
  }

  openEditRule(rule: any) {
    this.editingRule = rule;
    this.newRule = { ...rule };
    this.showRuleModal = true;
  }

  saveRule() {
    const payload = { ...this.newRule, project_id: this.projectId };
    if (this.editingRule) {
      this.api.put(`/api/alert-rules/${this.editingRule.id}`, payload).subscribe({
        next: (r: any) => {
          const idx = this.alertRules.findIndex(x => x.id === this.editingRule.id);
          if (idx >= 0) { this.alertRules[idx] = r; }
          this.showRuleModal = false;
        }, error: () => {},
      });
    } else {
      this.api.post('/api/alert-rules', payload).subscribe({
        next: (r: any) => { this.alertRules.push(r); this.showRuleModal = false; },
        error: () => {},
      });
    }
  }

  deleteRule(rule: any) {
    this.api.delete(`/api/alert-rules/${rule.id}`).subscribe({
      next: () => { this.alertRules = this.alertRules.filter(r => r.id !== rule.id); },
      error: () => {},
    });
  }

  toggleRule(rule: any) {
    const was = rule.is_active;
    rule.is_active = !was;
    this.api.put(`/api/alert-rules/${rule.id}`, { is_active: rule.is_active }).subscribe({
      error: () => { rule.is_active = was; },
    });
  }

  ruleNotifyLabel(rule: any): string {
    const parts: string[] = [];
    if (rule.notify_email) parts.push('Email');
    if (rule.notify_push)  parts.push('In-App');
    if (rule.notify_sms)   parts.push('SMS');
    return parts.length ? parts.join(' + ') : 'None';
  }

  // ── Alert rules categories/parameters ─────────────────────────────────────
  readonly ruleCategories = ['Utility', 'Capacity', 'Current Balance', 'Savings', 'Device'];
  readonly ruleParameters: Record<string, string[]> = {
    'Utility':          ['Peak kW Demand (15 Min)', 'kVA Demand (15 Min)', 'Power Factor', 'Energy Cost (Monthly)', 'Demand Cost (Monthly)'],
    'Capacity':         ['Transformer T-Load (%)', 'Available kVA', 'Recovered kVA'],
    'Current Balance':  ['Current Balance Index™', 'THD (%)', 'Phase Imbalance (%)'],
    'Savings':          ['Monthly Savings ($)', 'Annual Savings ($)', 'ROI (%)'],
    'Device':           ['Device Status', 'Comm Latency (ms)', 'Last Seen (min)'],
  };
  readonly ruleConditions  = ['Greater Than (>)', 'Less Than (<)', 'Equal To (=)', 'Not Equal (≠)'];
  readonly ruleSeverities  = ['critical', 'high', 'medium', 'low'];

  get currentParameters(): string[] {
    return this.ruleParameters[this.newRule.category] || [];
  }
}
