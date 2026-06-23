import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-transformers',
  templateUrl: './transformers.component.html',
  styleUrls: ['./transformers.component.scss'],
})
export class TransformersComponent implements OnInit, OnDestroy {

  projectId: number;
  loading = true;
  assetsLoading = false;

  // ── Transformer list ───────────────────────────────────────────────
  assets: any[] = [];
  selected: any = null;          // selected row from assets list

  // ── Selected transformer detail data ──────────────────────────────
  detail: any = null;             // { asset, summary, trends }
  detailLoading = false;

  // ── Cross-data for power quality & savings ─────────────────────────
  cbiSummary: any = null;
  savingsData: any = null;
  capTrends: any[] = [];          // capacity/trends time-series
  cbiSummaryLoading = false;

  // ── Tab state ──────────────────────────────────────────────────────
  activeTab: 'overview' | 'performance' | 'loadprofile' | 'powerquality' | 'capacity' | 'alarms' | 'maintenance' | 'documents' = 'overview';

  // ── Chart dimensions ───────────────────────────────────────────────
  readonly CHART_W = 500;
  readonly CHART_H = 130;
  readonly BAR_W   = 600;
  readonly BAR_H   = 100;

  private _pollTimer: any;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAssets();
  }

  ngOnDestroy() { if (this._pollTimer) { clearInterval(this._pollTimer); } }

  // ── Data loading ───────────────────────────────────────────────────

  loadAssets() {
    this.loading = true;
    this.api.get('/api/capacity/assets?project_id=' + this.projectId).subscribe({
      next: (r: any) => {
        const raw = r?.data || r?.assets || (Array.isArray(r) ? r : []);
        // Keep only transformer-type assets (include switchgear as primary unit)
        this.assets = raw.filter((a: any) => {
          const t = (a.asset_type || a.type || '').toLowerCase();
          return t === 'transformer' || t === 'switchgear' || raw.length <= 3;
        });
        if (!this.assets.length) { this.assets = raw; }
        this.loading = false;
        if (this.assets.length > 0) { this.selectAsset(this.assets[0]); }
      },
      error: () => { this.loading = false; }
    });
  }

  selectAsset(asset: any) {
    this.selected = asset;
    this.detail = null;
    this.activeTab = 'overview';
    this.loadDetail(asset);
    this.loadCBI();
    this.loadCapTrends();
    this.loadSavings();
  }

  loadDetail(asset: any) {
    const id = asset?.asset_id || asset?.id;
    if (!id) return;
    this.detailLoading = true;
    this.api.get('/api/capacity/transformer/' + id + '?project_id=' + this.projectId).subscribe({
      next: (r: any) => { this.detail = r; this.detailLoading = false; },
      error: () => { this.detailLoading = false; }
    });
  }

  loadCBI() {
    this.cbiSummaryLoading = true;
    this.api.get('/api/current-balance/summary?project_id=' + this.projectId).subscribe({
      next: (r: any) => { this.cbiSummary = r; this.cbiSummaryLoading = false; },
      error: () => { this.cbiSummaryLoading = false; }
    });
  }

  loadCapTrends() {
    const now = Date.now();
    const from = now - 30 * 86400 * 1000;
    this.api.get('/api/capacity/trends?project_id=' + this.projectId + '&from_ts=' + from + '&to_ts=' + now + '&limit=90').subscribe({
      next: (r: any) => { this.capTrends = r?.data || []; },
      error: () => {}
    });
  }

  loadSavings() {
    this.api.get('/api/savings/summary?project_id=' + this.projectId).subscribe({
      next: (r: any) => { this.savingsData = r; },
      error: () => {}
    });
  }

  setTab(t: any) { this.activeTab = t; }

  refresh() { this.loadAssets(); this.loadCBI(); this.loadCapTrends(); this.loadSavings(); }

  // ── Computed getters — transformer KPIs ───────────────────────────

  get ratedKva(): number {
    return this.detail?.asset?.rated_kva
      || this.selected?.rated_kva
      || this.selected?.capacity_kva || 0;
  }

  get usedKva(): number {
    return this.detail?.summary?.avg_kva
      || this.selected?.used_kva
      || this.selected?.current_load_kva || 0;
  }

  get availableKva(): number {
    const avail = this.ratedKva - this.usedKva;
    return Math.max(0, avail);
  }

  get utilPct(): number {
    if (!this.ratedKva) return this.selected?.utilization_pct || 0;
    return Math.min((this.usedKva / this.ratedKva) * 100, 100);
  }

  get recoveredKva(): number {
    return this.detail?.summary?.capacity_recovery_potential_kva
      || this.selected?.recoverable_kva || 0;
  }

  get recoveredPct(): number {
    if (!this.ratedKva) return 0;
    return (this.recoveredKva / this.ratedKva) * 100;
  }

  get availablePct(): number {
    if (!this.ratedKva) return 0;
    return (this.availableKva / this.ratedKva) * 100;
  }

  get cbiScore(): number {
    return this.cbiSummary?.cbi_score || this.cbiSummary?.score || 0;
  }

  get cbiRating(): string {
    const s = this.cbiScore;
    if (s >= 95) return 'A+';
    if (s >= 90) return 'A';
    if (s >= 80) return 'B';
    if (s >= 70) return 'C';
    return 'D';
  }

  get cbiLabel(): string {
    const s = this.cbiScore;
    if (s >= 90) return 'Excellent Balance';
    if (s >= 80) return 'Good Balance';
    if (s >= 70) return 'Fair Balance';
    return 'Needs Improvement';
  }

  get healthScore(): number {
    return this.detail?.summary?.transformer_health_score
      || this.selected?.health_score || 0;
  }

  get healthLabel(): string {
    const s = this.healthScore;
    if (s >= 85) return 'Healthy';
    if (s >= 70) return 'Good';
    if (s >= 55) return 'Fair';
    return 'Needs Attention';
  }

  get healthColor(): string {
    const s = this.healthScore;
    if (s >= 85) return '#00e676';
    if (s >= 70) return '#69f0ae';
    if (s >= 55) return '#ffd740';
    return '#f44336';
  }

  get annualSavings(): number {
    return this.savingsData?.annual_savings
      || this.detail?.summary?.deferred_upgrade_value
      || 0;
  }

  get energySavings(): number {
    return this.savingsData?.energy_savings || this.annualSavings * 0.575 || 0;
  }

  get demandSavings(): number {
    return this.savingsData?.demand_savings || this.annualSavings * 0.425 || 0;
  }

  // ── Power Quality getters ──────────────────────────────────────────

  get avgPowerFactor(): number {
    return this.cbiSummary?.power_factor || this.cbiSummary?.avg_pf || 0;
  }

  get thdVoltage(): number {
    return this.cbiSummary?.avg_thd_voltage || this.cbiSummary?.avg_thd || 0;
  }

  get thdCurrent(): number {
    return this.cbiSummary?.harmonic_current_pct
      || this.cbiSummary?.avg_harmonic_burden
      || this.detail?.summary?.harmonic_burden_pct || 0;
  }

  get voltageImbalance(): number {
    return this.cbiSummary?.imbalance_pct
      || this.cbiSummary?.avg_imbalance
      || this.detail?.summary?.imbalance_burden_pct || 0;
  }

  get currentImbalance(): number {
    const l1 = this.cbiSummary?.avg_l1_amp || 0;
    const l2 = this.cbiSummary?.avg_l2_amp || 0;
    const l3 = this.cbiSummary?.avg_l3_amp || 0;
    if (!l1 && !l2 && !l3) { return this.voltageImbalance; }
    const avg = (l1 + l2 + l3) / 3;
    if (!avg) return 0;
    const maxDev = Math.max(Math.abs(l1 - avg), Math.abs(l2 - avg), Math.abs(l3 - avg));
    return (maxDev / avg) * 100;
  }

  get frequency(): number { return this.cbiSummary?.frequency || 60; }

  // ── Phase summary ──────────────────────────────────────────────────

  get phases(): Array<{ phase: string; voltage: number; current: number; kva: number; imbalPct: number }> {
    const l1 = this.cbiSummary?.avg_l1_amp || 0;
    const l2 = this.cbiSummary?.avg_l2_amp || 0;
    const l3 = this.cbiSummary?.avg_l3_amp || 0;
    // Estimate voltage from kVA and current; default 480V phase-neutral if unknown
    const vPhase = this.cbiSummary?.avg_voltage || 480;
    const avgI   = l1 || l2 || l3 ? (l1 + l2 + l3) / Math.max((l1 > 0 ? 1 : 0) + (l2 > 0 ? 1 : 0) + (l3 > 0 ? 1 : 0), 1) : 0;

    const mkPhase = (ph: string, i: number) => ({
      phase:   ph,
      voltage: vPhase,
      current: Math.round(i),
      kva:     Math.round(vPhase * i / 1000),
      imbalPct: avgI > 0 ? Math.abs(((i - avgI) / avgI) * 100) : 0,
    });

    return [
      mkPhase('A', l1),
      mkPhase('B', l2),
      mkPhase('C', l3),
    ];
  }

  get phaseAvg(): { voltage: number; current: number; kva: number; imbalPct: number } {
    const ps = this.phases;
    const n  = ps.length || 1;
    return {
      voltage:  Math.round(ps.reduce((a, p) => a + p.voltage,  0) / n),
      current:  Math.round(ps.reduce((a, p) => a + p.current,  0) / n),
      kva:      Math.round(ps.reduce((a, p) => a + p.kva,      0) / n),
      imbalPct: ps.reduce((a, p) => a + p.imbalPct, 0) / n,
    };
  }

  // ── Transformer nameplate from asset + detail ─────────────────────

  get nameplateId(): string { return this.selected?.asset_id || this.detail?.asset?.id || '—'; }
  get nameplateType(): string {
    return this.selected?.asset_type || this.detail?.asset?.type || 'Transformer';
  }
  get nameplateManufacturer(): string {
    return this.selected?.manufacturer || this.detail?.asset?.manufacturer || '—';
  }
  get nameplateModel(): string { return this.selected?.model || this.detail?.asset?.model || '—'; }
  get nameplateRating(): string { return this.ratedKva ? this.ratedKva + ' kVA' : '—'; }
  get nameplateVoltageIn(): string {
    return this.detail?.asset?.voltage_in || this.selected?.primary_voltage || '—';
  }
  get nameplateVoltageOut(): string {
    return this.detail?.asset?.voltage_out || this.selected?.secondary_voltage || '—';
  }
  get nameplateImpedance(): string { return this.selected?.impedance || '—'; }
  get nameplateSerial(): string { return this.selected?.serial_number || '—'; }
  get nameplateInstall(): Date | null {
    const d = this.selected?.install_date || this.selected?.installDate;
    return d ? new Date(d) : null;
  }
  get nameplateWarranty(): Date | null {
    const d = this.selected?.warranty_expiration || this.selected?.warrantyExpiration;
    return d ? new Date(d) : null;
  }

  // ── Chart helpers ──────────────────────────────────────────────────

  private _buildPath(vals: number[], W: number, H: number, maxVal: number): string {
    if (!vals.length) return '';
    const m = maxVal || Math.max(...vals) || 1;
    return vals.map((v, i) => {
      const x = (i / Math.max(vals.length - 1, 1)) * W;
      const y = H - (v / m) * H * 0.9;
      return (i === 0 ? 'M' : 'L') + ' ' + x.toFixed(1) + ' ' + y.toFixed(1);
    }).join(' ');
  }

  get trendChartMax(): number {
    const used  = this.capTrends.map((t: any) => t.used_capacity || 0);
    const total = this.capTrends.map((t: any) => (t.used_capacity || 0) + (t.hidden_capacity || 0));
    return Math.max(...used, ...total, this.ratedKva, 100);
  }

  /** Line: After SYNEREX (actual load) */
  get afterXecoPath(): string {
    const vals = this.capTrends.map((t: any) => t.used_capacity || 0);
    return this._buildPath(vals, this.CHART_W, this.CHART_H, this.trendChartMax);
  }

  /** Line: Before SYNEREX (load + hidden losses) */
  get beforeXecoPath(): string {
    const vals = this.capTrends.map((t: any) => (t.used_capacity || 0) + (t.hidden_capacity || 0));
    return this._buildPath(vals, this.CHART_W, this.CHART_H, this.trendChartMax);
  }

  /** Flat rated capacity line Y coordinate */
  get ratedCapacityY(): number {
    if (!this.ratedKva) return 10;
    return this.CHART_H - (this.ratedKva / this.trendChartMax) * this.CHART_H * 0.9;
  }

  /** Area fill under After SYNEREX */
  get afterXecoAreaPath(): string {
    if (!this.capTrends.length) return '';
    const line = this.afterXecoPath;
    const lastX = this.CHART_W;
    return line + ' L ' + lastX + ' ' + this.CHART_H + ' L 0 ' + this.CHART_H + ' Z';
  }

  /** X-axis labels (dates) */
  get trendXLabels(): Array<{ x: number; label: string }> {
    if (!this.capTrends.length) return [];
    const step = Math.max(1, Math.floor(this.capTrends.length / 6));
    return this.capTrends
      .filter((_: any, i: number) => i % step === 0)
      .map((t: any, i: number, arr: any[]) => ({
        x: (i / Math.max(arr.length - 1, 1)) * this.CHART_W,
        label: new Date(t.bucket_ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }));
  }

  /** Y-axis labels */
  get trendYLabels(): Array<{ y: number; label: string }> {
    const max = this.trendChartMax;
    return [0, 0.25, 0.5, 0.75, 1].map(f => ({
      y: this.CHART_H - f * this.CHART_H * 0.9,
      label: Math.round(max * f) + '',
    }));
  }

  /** Bar chart: monthly aggregated capacity recovery */
  get monthlyBars(): Array<{ x: number; height: number; label: string; val: number }> {
    if (!this.capTrends.length) return [];
    // Group by month
    const byMonth: { [key: string]: number[] } = {};
    this.capTrends.forEach((t: any) => {
      const d   = new Date(t.bucket_ts);
      const key = d.getFullYear() + '-' + (d.getMonth() + 1);
      if (!byMonth[key]) { byMonth[key] = []; }
      byMonth[key].push(t.recoverable_capacity || 0);
    });
    const months = Object.keys(byMonth).sort();
    if (!months.length) return [];
    const maxVal = Math.max(...months.map(m => {
      const a = byMonth[m];
      return a.reduce((s: number, v: number) => s + v, 0) / a.length;
    }), 1);
    const barW = this.BAR_W / months.length;
    return months.map((m, i) => {
      const arr = byMonth[m];
      const avg = arr.reduce((s: number, v: number) => s + v, 0) / arr.length;
      const h   = (avg / maxVal) * this.BAR_H * 0.85;
      const d   = new Date(m + '-01');
      return {
        x:      i * barW + barW * 0.1,
        height: h,
        label:  d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        val:    Math.round(avg),
      };
    });
  }

  get barWidth(): number {
    if (!this.monthlyBars.length) return 20;
    return (this.BAR_W / this.monthlyBars.length) * 0.8;
  }

  // ── Utility ────────────────────────────────────────────────────────

  utilizationColor(pct: number): string {
    if (pct >= 90) return '#f44336';
    if (pct >= 75) return '#ffd740';
    return '#00e676';
  }

  /** SVG donut stroke-dasharray for a gauge */
  donutDash(pct: number, r: number): string {
    const circ = 2 * Math.PI * r;
    return (pct / 100) * circ + ' ' + circ;
  }

  formatCurrency(n: number): string {
    if (!n) return '$0';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'K';
    return '$' + Math.round(n);
  }

  pqStatus(val: number, warn: number, good: number): string {
    if (val <= good) return 'good';
    if (val <= warn) return 'warning';
    return 'critical';
  }

  pfStatus(val: number): string {
    if (val >= 0.95) return 'good';
    if (val >= 0.90) return 'warning';
    return 'critical';
  }

  pqLabel(status: string): string {
    if (status === 'good')     return 'Good';
    if (status === 'warning')  return 'Warning';
    return 'Critical';
  }

  get selectedName(): string {
    return this.selected?.label || this.selected?.name || this.detail?.asset?.label || 'Main Transformer';
  }
}
