import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'app-enterprise-dashboard',
  templateUrl: './enterprise-dashboard.component.html',
  styleUrls: ['./enterprise-dashboard.component.scss'],
})
export class EnterpriseDashboardComponent implements OnInit, OnDestroy {

  // ── Project / Date controls ──────────────────────────────────────────────
  projects: any[] = [];
  selectedProjectId: number | null = null;
  selectedProjectName = '';

  dateFrom = '';
  dateTo   = '';

  currentUser: any = null;

  // ── Loading ───────────────────────────────────────────────────────────────
  loading = false;

  // ── Savings Intelligence ─────────────────────────────────────────────────
  siData: any      = null;
  roiData: any     = null;
  paybackData: any = null;

  // ── Trends (cumulative chart) ─────────────────────────────────────────────
  trendMode: 'year' | 'last12' | 'lifetime' = 'last12';
  trendData: any[] = [];

  // ── Waterfall ────────────────────────────────────────────────────────────
  waterfallData: any = null;

  // ── CBI ──────────────────────────────────────────────────────────────────
  cbiData: any = null;

  // ── Capacity ─────────────────────────────────────────────────────────────
  capData: any = null;

  // ── Utility ──────────────────────────────────────────────────────────────
  utilData: any = null;

  // ── Alarms ───────────────────────────────────────────────────────────────
  alarmData: any = null;

  // ── Device health ─────────────────────────────────────────────────────────
  meterData: any = null;

  // ── Real-time ticker ─────────────────────────────────────────────────────
  private _ticker: any = null;
  tickerSeconds = 0;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
    private router: Router,
  ) {}

  ngOnInit() {
    const u = this.userService.user as any;
    this.currentUser = u;

    // Build project list from user's accessible projects, alphabetical
    this.projects = ((u && u.projects) || [])
      .filter((p: any) => p && p.id)
      .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));

    // Select current project or first available
    const sel = u && u.selectedProject;
    if (sel && sel.id) {
      this.selectedProjectId   = sel.id;
      this.selectedProjectName = sel.name || '';
    } else if (this.projects.length) {
      this.selectedProjectId   = this.projects[0].id;
      this.selectedProjectName = this.projects[0].name || '';
      this.userService.selectProject(this.selectedProjectId);
    }

    // Default date range: last 7 days
    const now   = new Date();
    const week  = new Date(now.getTime() - 7 * 86400000);
    this.dateTo   = this._fmt(now);
    this.dateFrom = this._fmt(week);

    if (this.selectedProjectId) this.loadAll();

    // Real-time ticker (every second)
    this._ticker = setInterval(() => { this.tickerSeconds++; }, 1000);
  }

  ngOnDestroy() {
    if (this._ticker) clearInterval(this._ticker);
  }

  private _fmt(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  // ── Project switch ────────────────────────────────────────────────────────
  onProjectChange(id: any) {
    this.selectedProjectId = Number(id);
    const p = this.projects.find((x: any) => x.id == id);
    this.selectedProjectName = p ? (p.name || '') : '';
    if (p) this.userService.selectProject(id);
    this.loadAll();
  }

  // ── Date change ───────────────────────────────────────────────────────────
  onDateChange() {
    if (this.dateFrom && this.dateTo && this.selectedProjectId) {
      this.loadAll();
    }
  }

  // ── Load all data ─────────────────────────────────────────────────────────
  loadAll() {
    const pid  = this.selectedProjectId;
    if (!pid) return;
    const from = new Date(this.dateFrom).getTime();
    const to   = new Date(this.dateTo).getTime() + 86399999;

    this.loading = true;

    this.api.get(`/api/savings/intelligence?project_id=${pid}&from_ts=${from}&to_ts=${to}`).subscribe({
      next: (r: any) => { this.siData = r?.latest || r?.response || r; this.loading = false; },
      error: () => { this.loading = false; }
    });

    this.api.get(`/api/roi?project_id=${pid}`).subscribe({
      next: (r: any) => { this.roiData = r?.response || r; },
      error: () => {}
    });

    this.api.get(`/api/payback?project_id=${pid}`).subscribe({
      next: (r: any) => { this.paybackData = r?.response || r; },
      error: () => {}
    });

    this.loadTrend();

    this.api.get(`/api/savings/waterfall?project_id=${pid}&from_ts=${from}&to_ts=${to}`).subscribe({
      next: (r: any) => { this.waterfallData = r?.response || r; },
      error: () => {}
    });

    this.api.get(`/api/current-balance/summary?project_id=${pid}&from_ts=${from}&to_ts=${to}`).subscribe({
      next: (r: any) => { this.cbiData = r?.latest || r?.response || r; },
      error: () => {}
    });

    this.api.get(`/api/capacity/summary?project_id=${pid}&from_ts=${from}&to_ts=${to}`).subscribe({
      next: (r: any) => { this.capData = r?.response || r; },
      error: () => {}
    });

    this.api.get(`/api/utility/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.utilData = r?.response || r; },
      error: () => {}
    });

    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.alarmData = r?.response || r; },
      error: () => {}
    });

    this.api.get(`/api/meter?project=${pid}&limit=1000`).subscribe({
      next: (r: any) => {
        const meters = r?.response || r || [];
        const arr = Array.isArray(meters) ? meters : [];
        this.meterData = {
          total:   arr.length,
          online:  arr.filter((m: any) => m.online || m.isOnline).length,
          offline: arr.filter((m: any) => !m.online && !m.isOnline).length,
        };
      },
      error: () => {}
    });
  }

  loadTrend() {
    const pid = this.selectedProjectId;
    if (!pid) return;
    const now     = Date.now();
    const oneYear = 365 * 86400000;
    let from: number;
    if (this.trendMode === 'year') {
      from = new Date(new Date().getFullYear(), 0, 1).getTime();
    } else if (this.trendMode === 'last12') {
      from = now - oneYear;
    } else {
      from = now - oneYear * 5;
    }
    this.api.get(`/api/savings/trends?project_id=${pid}&from_ts=${from}&to_ts=${now}&limit=500`).subscribe({
      next: (r: any) => { this.trendData = r?.data || r?.response || []; },
      error: () => {}
    });
  }

  setTrendMode(m: 'year' | 'last12' | 'lifetime') {
    this.trendMode = m;
    this.loadTrend();
  }

  // ── Computed: Savings KPIs ────────────────────────────────────────────────
  get annualSavings(): number  { return Number(this.siData?.annual_savings || this.siData?.annual_savings_est || 0); }
  get lifetimeSavings(): number { return Number(this.siData?.lifetime_savings || this.annualSavings); }
  get yearToDate(): number { return Math.round(this.annualSavings * (new Date().getMonth() + 1) / 12); }
  get monthSavings(): number { return Math.round(this.annualSavings / 12); }
  get todaySavings(): number { return Math.round(this.annualSavings / 365); }

  // Real-time savings rate
  get ratePerMin(): number  { return this.annualSavings ? this.annualSavings / 525600 : 0; }
  get ratePerHour(): number { return this.ratePerMin * 60; }
  get ratePerDay(): number  { return this.ratePerMin * 1440; }
  get ratePerMonth(): number { return this.ratePerMin * 43800; }
  get ratePerYear(): number  { return this.annualSavings; }

  // Capacity
  get recoveredKva(): number { return Number(this.capData?.recovered_capacity_kva || this.siData?.recoverable_kva || 0); }
  get installedKva(): number { return Number(this.capData?.installed_capacity_kva || this.capData?.total_installed_kva || 0); }
  get availableKva(): number { return Number(this.capData?.available_capacity_kva || 0); }
  get currentLoadKva(): number { return Math.max(0, this.installedKva - this.availableKva - this.recoveredKva); }
  get utilizationPct(): number { return this.installedKva > 0 ? Math.round(this.currentLoadKva / this.installedKva * 100) : 0; }
  get deferredCapital(): number { return Math.round(this.recoveredKva * 65); }
  get recoveredMva(): string {
    const v = this.recoveredKva;
    if (!v) return '—';
    return v >= 1000 ? (v / 1000).toFixed(2) + ' MVA' : v.toFixed(0) + ' kVA';
  }

  // ROI
  get roiPct(): number { return Number(this.roiData?.roi || this.siData?.roi || 0); }
  get roiLabel(): string {
    const v = this.roiPct;
    if (v >= 200) return 'Outstanding';
    if (v >= 100) return 'Excellent';
    if (v >= 50)  return 'Good';
    if (v > 0)    return 'Fair';
    return '—';
  }
  get paybackYears(): number { return Number(this.paybackData?.payback || this.siData?.payback || 0); }
  get paybackDateStr(): string {
    const yrs = this.paybackYears;
    if (!yrs) return '—';
    const d = new Date();
    d.setFullYear(d.getFullYear() + Math.floor(yrs));
    d.setMonth(d.getMonth() + Math.round((yrs % 1) * 12));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  get projectCost(): number { return Number(this.roiData?.project_cost || this.siData?.project_cost || 0); }
  get annualBenefit(): number { return Number(this.roiData?.annual_benefit || this.annualSavings); }

  // CBI
  get cbiScore(): number { return Number(this.cbiData?.score || this.cbiData?.cbi_score || 0); }
  get cbiScoreLabel(): string {
    const v = this.cbiScore;
    if (v >= 95) return 'A+';
    if (v >= 90) return 'A';
    if (v >= 80) return 'B';
    if (v >= 70) return 'C';
    return 'D';
  }
  get productivePct(): number  { return Number(this.cbiData?.productive_current_pct || 0); }
  get harmonicPct(): number    { return Number(this.cbiData?.harmonic_current_pct || this.cbiData?.avg_thd || 0); }
  get reactivePct(): number    { return Number(this.cbiData?.reactive_current_pct || 0); }
  get imbalancePct(): number   { return Number(this.cbiData?.imbalance_pct || 0); }

  // Waterfall computed
  get baselineUtility(): number { return Number(this.waterfallData?.baseline_utility_cost || this.waterfallData?.baseline || 0); }
  get demandSavings(): number   { return Number(this.waterfallData?.demand_savings || this.siData?.demand_savings || 0); }
  get energySavings(): number   { return Number(this.waterfallData?.energy_savings || this.siData?.energy_savings || 0); }
  get pfSavings(): number       { return Number(this.waterfallData?.pf_savings || this.siData?.pf_savings || 0); }
  get currentUtility(): number  { return Number(this.waterfallData?.current_utility_cost || Math.max(0, this.baselineUtility - this.demandSavings - this.energySavings - this.pfSavings)); }
  get totalAnnualSavings(): number { return this.demandSavings + this.energySavings + this.pfSavings || this.annualSavings; }
  get costReductionPct(): number {
    return this.baselineUtility > 0 ? Math.round(this.totalAnnualSavings / this.baselineUtility * 100 * 10) / 10 : 0;
  }

  // Savings breakdown percentages
  get demandPct(): number { return this.totalAnnualSavings > 0 ? Math.round(this.demandSavings / this.totalAnnualSavings * 100 * 10) / 10 : 0; }
  get energyPct(): number { return this.totalAnnualSavings > 0 ? Math.round(this.energySavings / this.totalAnnualSavings * 100 * 10) / 10 : 0; }
  get pfPct(): number     { return this.totalAnnualSavings > 0 ? Math.round(this.pfSavings / this.totalAnnualSavings * 100 * 10) / 10 : 0; }

  // Utility
  get utilThisMonth(): number    { return Number(this.utilData?.projected_cost_this_month || this.utilData?.this_month || 0); }
  get utilNextMonth(): number    { return Number(this.utilData?.forecast_next_month || this.utilData?.next_month || 0); }
  get utilAnnualForecast(): number { return Number(this.utilData?.annual_forecast || this.utilData?.annual || this.utilThisMonth * 12); }
  get utilVsApril(): number      { return Number(this.utilData?.vs_prior_month_pct || 0); }
  get utilVsBaseline(): number   { return Number(this.utilData?.vs_baseline_pct || 0); }

  // Alarms
  get alarmCritical(): number { return Number(this.alarmData?.critical || 0); }
  get alarmWarning(): number  { return Number(this.alarmData?.high || this.alarmData?.warning || 0); }
  get alarmInfo(): number     { return Number(this.alarmData?.medium || this.alarmData?.info || 0); }
  get alarmTotal(): number    { return this.alarmCritical + this.alarmWarning + this.alarmInfo; }

  // Device health
  get devicesTotal(): number   { return this.meterData?.total || 0; }
  get devicesOnline(): number  { return this.meterData?.online || 0; }
  get devicesOffline(): number { return this.meterData?.offline || 0; }
  get devicesOnlinePct(): string {
    if (!this.devicesTotal) return '—';
    return (this.devicesOnline / this.devicesTotal * 100).toFixed(1) + '%';
  }

  // ── Trend chart SVG ───────────────────────────────────────────────────────
  trendPolyline(w: number, h: number): string {
    const data = this.trendData;
    if (!data || data.length < 2) return '';
    const vals  = data.map((d: any) => Number(d.cumulative_savings || d.value || 0));
    const maxV  = Math.max(...vals, 1);
    return data.map((d: any, i: number) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (Number(d.cumulative_savings || d.value || 0) / maxV) * (h - 10);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  get trendMax(): number {
    const vals = this.trendData.map((d: any) => Number(d.cumulative_savings || d.value || 0));
    return vals.length ? Math.max(...vals, 1) : 1;
  }

  get trendTotal(): string {
    if (!this.trendData.length) return this._currency(this.lifetimeSavings);
    const last = this.trendData[this.trendData.length - 1];
    return this._currency(Number(last.cumulative_savings || last.value || 0));
  }

  get trendLabels(): string[] {
    const data = this.trendData;
    if (!data || !data.length) return [];
    const step = Math.max(1, Math.floor(data.length / 7));
    return data.filter((_: any, i: number) => i % step === 0 || i === data.length - 1)
      .map((d: any) => {
        const ts = d.bucket_ts || d.ts || d.date;
        if (!ts) return '';
        const dt = new Date(typeof ts === 'number' ? ts : ts);
        return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });
  }

  trendLabelX(idx: number, total: number, w: number): number {
    return total <= 1 ? 0 : (idx / (total - 1)) * w;
  }

  // ── Waterfall SVG ─────────────────────────────────────────────────────────
  get waterfallBars(): { label: string; value: number; isNeg: boolean; color: string }[] {
    const b = this.baselineUtility;
    const d = this.demandSavings;
    const e = this.energySavings;
    const p = this.pfSavings;
    const c = this.currentUtility;
    if (!b && !c) return [];
    return [
      { label: 'Baseline\nUtility Cost', value: b, isNeg: false, color: '#546e7a' },
      { label: 'Demand\nSavings',        value: d, isNeg: true,  color: '#00e676' },
      { label: 'Energy\nSavings',        value: e, isNeg: true,  color: '#00e676' },
      { label: 'PF & Other\nSavings',    value: p, isNeg: true,  color: '#00e676' },
      { label: 'Current\nUtility Cost',  value: c, isNeg: false, color: '#29b6f6' },
    ];
  }

  waterfallBarH(value: number, maxVal: number, chartH: number): number {
    return maxVal > 0 ? Math.max(4, (value / maxVal) * chartH) : 4;
  }

  get waterfallMax(): number {
    return Math.max(...this.waterfallBars.map(b => b.value), 1);
  }

  // ── ROI gauge SVG ─────────────────────────────────────────────────────────
  roiGaugeDash(pct: number): string {
    const circ = 251.3;
    const fill = Math.min(pct / 200, 1) * circ; // max visual at 200%
    return `${fill.toFixed(1)} ${circ}`;
  }
  roiGaugeColor(pct: number): string {
    if (pct >= 100) return '#00e676';
    if (pct >= 50)  return '#ffd740';
    return '#f44336';
  }

  // ── CBI gauge SVG ─────────────────────────────────────────────────────────
  cbiGaugeDash(pct: number, total = 100): string {
    const circ = 175.9; // r=28
    const fill = (pct / total) * circ;
    return `${fill.toFixed(1)} ${circ}`;
  }

  // ── Capacity donut ────────────────────────────────────────────────────────
  capDonutDash(pct: number): string {
    const circ = 226.2; // r=36
    return `${(pct / 100 * circ).toFixed(1)} ${circ}`;
  }

  // ── Formatting helpers ────────────────────────────────────────────────────
  _currency(v: number): string {
    if (!v && v !== 0) return '—';
    const n = Math.abs(Math.round(v));
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + n.toLocaleString();
  }

  _currencyFull(v: number): string {
    if (!v && v !== 0) return '—';
    return '$' + Math.round(v).toLocaleString();
  }

  _sign(v: number): string { return v >= 0 ? '+' : ''; }

  nav(path: string) { this.router.navigate(['/ecbs/' + path]); }
  navWithProject(path: string) {
    if (this.selectedProjectId) {
      localStorage.setItem('synerex-project-id', String(this.selectedProjectId));
    }
    this.router.navigate(['/ecbs/' + path]);
  }
}
