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

  activeTab: 'rules' | 'events' = 'rules';
  showAllAlarms = false;

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

  // Chart constants
  readonly HC_W = 360;
  readonly HC_H = 170;
  readonly DON_R = 45;
  readonly DON_CX = 60;
  readonly DON_CY = 60;

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

    this.api.get(`/api/alarms/active?project_id=${pid}`).subscribe({
      next: (r: any) => { this.alarms = r?.alarms || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.summary = r; },
      error: () => {},
    });
    this.api.get(`/api/alarms/events?project_id=${pid}&limit=100`).subscribe({
      next: (r: any) => { this.events = r?.events || r || []; },
      error: () => {},
    });
    this.api.get(`/api/alert-rules?project_id=${pid}`).subscribe({
      next: (r: any) => { this.alertRules = Array.isArray(r) ? r : (r?.rules || []); },
      error: () => {},
    });
    this.api.get(`/api/alarms/history?project_id=${pid}&limit=200`).subscribe({
      next: (r: any) => { this.historyAlarms = r?.alarms || []; },
      error: () => {},
    });
  }

  // ── KPI summary ───────────────────────────────────────────────────────────

  get criticalCount(): number    { return this.summary?.critical     ?? 0; }
  get warningCount(): number     { return this.summary?.high         ?? 0; }
  get infoCount(): number        { return this.summary?.information  ?? 0; }
  get totalActive(): number      { return this.summary?.total_active ?? this.alarms.length; }
  get mttrMinutes(): number|null { return this.summary?.mttr_minutes ?? null; }

  get alarmRate7d(): string {
    const rate = this.totalActive / 7;
    return rate > 0 ? rate.toFixed(1) : '0.0';
  }
  get systemHealthPct(): number {
    const score = 100 - (this.criticalCount * 20) - (this.warningCount * 10);
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

  // ── Alarm Summary stats (right panel) ────────────────────────────────────

  get totalAlarms7d(): number {
    return this.summary?.total_7d ?? (this.historyAlarms.length + this.alarms.length);
  }
  get criticalAlarms7d(): number  { return this.summary?.critical_7d  ?? this.criticalCount; }
  get warningAlarms7d(): number   { return this.summary?.high_7d      ?? this.warningCount; }
  get infoEvents7d(): number      { return this.summary?.info_7d      ?? this.infoCount; }
  get acknowledgedCount(): number { return this.alarms.filter(a => a.status === 'acknowledged').length; }
  get unacknowledgedCount(): number { return this.alarms.filter(a => a.status === 'new').length; }
  get shelvedCount(): number      { return this.alarms.filter(a => a.status === 'shelved').length; }
  get acknowledgedPct(): string {
    if (!this.totalActive) return '0';
    return Math.round((this.acknowledgedCount / this.totalActive) * 100).toString();
  }
  get unacknowledgedPct(): string {
    if (!this.totalActive) return '0';
    return Math.round((this.unacknowledgedCount / this.totalActive) * 100).toString();
  }
  get longestAlarmDisplay(): string {
    if (!this.alarms.length) return '—';
    let maxMs = 0;
    this.alarms.forEach(a => {
      const ms = a.triggered_at ? Date.now() - a.triggered_at : 0;
      if (ms > maxMs) { maxMs = ms; }
    });
    const min = Math.floor(maxMs / 60000);
    if (min < 60) { return min + ' min'; }
    const hr = Math.floor(min / 60);
    return hr + ' hrs ' + (min % 60) + ' min';
  }

  // ── Alarm History chart (stacked bars, last 7 days) ───────────────────────

  get historyDays(): { label: string; critical: number; warning: number; info: number; }[] {
    const result = [];
    const all = ([] as any[]).concat(this.alarms, this.historyAlarms);
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + 86400000;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayA = all.filter(a => a.triggered_at >= start && a.triggered_at < end);
      result.push({
        label,
        critical: dayA.filter(a => (a.severity || '').toLowerCase() === 'critical').length,
        warning:  dayA.filter(a => ['high', 'warning', 'medium'].includes((a.severity || '').toLowerCase())).length,
        info:     dayA.filter(a => ['low', 'information', 'info'].includes((a.severity || '').toLowerCase())).length,
      });
    }
    return result;
  }

  get historyChartBars(): any[] {
    const days = this.historyDays;
    const maxTotal = Math.max(1, ...days.map(d => d.critical + d.warning + d.info));
    const chartH = this.HC_H - 32;
    const slotW = (this.HC_W - 20) / 7;
    const barW = Math.floor(slotW * 0.55);
    const baseline = this.HC_H - 22;

    return days.map((d, i) => {
      const x = 10 + i * slotW + (slotW - barW) / 2;
      const scale = chartH / maxTotal;
      const critH = Math.round(d.critical * scale);
      const warnH = Math.round(d.warning  * scale);
      const infoH = Math.round(d.info     * scale);
      return {
        label: d.label,
        x, barW,
        critY: baseline - critH,           critH,
        warnY: baseline - critH - warnH,   warnH,
        infoY: baseline - critH - warnH - infoH, infoH,
        total: d.critical + d.warning + d.info,
      };
    });
  }

  get historyHasData(): boolean {
    return this.historyDays.some(d => d.critical + d.warning + d.info > 0);
  }

  get yAxisLabels(): { y: number; val: number }[] {
    const days = this.historyDays;
    const maxTotal = Math.max(1, ...days.map(d => d.critical + d.warning + d.info));
    const chartH = this.HC_H - 32;
    const baseline = this.HC_H - 22;
    const step = Math.ceil(maxTotal / 4);
    const labels = [];
    for (let v = 0; v <= maxTotal; v += step) {
      labels.push({ val: v, y: baseline - Math.round((v / maxTotal) * chartH) });
    }
    return labels;
  }

  // ── Severity donut (active alarms) ────────────────────────────────────────

  get severityDonutTotal(): number { return this.criticalCount + this.warningCount + this.infoCount; }

  get severitySegments(): any[] {
    const circ = 2 * Math.PI * this.DON_R;
    const items = [
      { val: this.criticalCount, color: '#ef5350', label: 'Critical' },
      { val: this.warningCount,  color: '#ffd740', label: 'Warning'  },
      { val: this.infoCount,     color: '#29b6f6', label: 'Info'     },
    ];
    const total = items.reduce((s, it) => s + it.val, 0) || 1;
    let cumPct = 0;
    return items.map(it => {
      const pct = it.val / total;
      const seg = {
        ...it,
        dash:   pct * circ,
        gap:    circ - pct * circ,
        offset: circ * (1 - cumPct),
        pct:    Math.round(pct * 100),
      };
      cumPct += pct;
      return seg;
    });
  }

  // ── Alarm sources donut ───────────────────────────────────────────────────

  get alarmSourceGroups(): { label: string; count: number; color: string }[] {
    const colors = ['#29b6f6', '#ffd740', '#ef5350', '#66bb6a', '#ab47bc', '#ff7043'];
    const groups: Record<string, number> = {};
    this.alarms.forEach(a => {
      const key = a.asset_type || a.category || a.alarm_category || 'Other';
      groups[key] = (groups[key] || 0) + 1;
    });
    const keys = Object.keys(groups).sort((a, b) => groups[b] - groups[a]);
    return keys.map((k, i) => ({ label: k, count: groups[k], color: colors[i % colors.length] }));
  }

  get sourceDonutTotal(): number { return this.alarms.length; }

  get sourceSegments(): any[] {
    const circ = 2 * Math.PI * this.DON_R;
    const groups = this.alarmSourceGroups;
    const total = groups.reduce((s, g) => s + g.count, 0) || 1;
    let cumPct = 0;
    return groups.map(g => {
      const pct = g.count / total;
      const seg = {
        ...g,
        dash:   pct * circ,
        gap:    circ - pct * circ,
        offset: circ * (1 - cumPct),
        pct:    Math.round(pct * 100),
      };
      cumPct += pct;
      return seg;
    });
  }

  // ── Alarm Timeline (today's events) ──────────────────────────────────────

  get todayTimeline(): any[] {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return this.events
      .filter(e => (e.occurred_at || e.triggered_at || 0) >= startOfDay.getTime())
      .slice(0, 6);
  }

  timelineTime(e: any): string {
    const ts = e.occurred_at || e.triggered_at;
    if (!ts) { return '—'; }
    const d = new Date(ts);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }

  timelineSeverityColor(sev: string): string {
    return this.severityColor(sev);
  }

  // ── Top alarms (last 30 days) ─────────────────────────────────────────────

  get topAlarmTypes(): { type: string; count: number }[] {
    const groups: Record<string, number> = {};
    const all = ([] as any[]).concat(this.alarms, this.historyAlarms);
    all.forEach(a => {
      const key = a.alarm_type || a.title || 'Unknown';
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.keys(groups)
      .map(k => ({ type: k, count: groups[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // ── Active alarms (filtered + paginated) ─────────────────────────────────

  get filteredAlarms(): any[] {
    let list = this.alarms;
    if (this.filterSeverity) { list = list.filter(a => a.severity === this.filterSeverity); }
    if (this.filterStatus)   { list = list.filter(a => a.status   === this.filterStatus); }
    return list;
  }

  get visibleAlarms(): any[] {
    return this.showAllAlarms ? this.filteredAlarms : this.filteredAlarms.slice(0, 5);
  }

  // ── Duration helper ───────────────────────────────────────────────────────

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
      case 'warning':     return '#ffd740';
      case 'medium':      return '#29b6f6';
      default:            return '#546e7a';
    }
  }

  // ── Alarm actions ─────────────────────────────────────────────────────────

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
  closeAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/close`, {}).subscribe({
      next: () => { this.alarms = this.alarms.filter(a => a.id !== alarm.id); },
      error: () => {},
    });
  }

  // ── Alert rule CRUD ───────────────────────────────────────────────────────

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
    if (rule.notify_email) { parts.push('Email'); }
    if (rule.notify_push)  { parts.push('In-App'); }
    if (rule.notify_sms)   { parts.push('SMS'); }
    return parts.length ? parts.join(' + ') : 'None';
  }

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
