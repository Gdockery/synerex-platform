import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-savings',
  templateUrl: './savings.component.html',
  styleUrls: ['./savings.component.scss'],
})
export class SavingsComponent implements OnInit {
  projectId: number;
  loading = true;

  intelligence: any  = null;
  roi: any           = null;
  payback: any       = null;
  utilityData: any   = null;
  cbiData: any       = null;
  trendsData: any[]  = [];
  waterfallData: any[]  = [];
  waterfallMeta: any    = null;
  baselineInfo: any  = null;

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
    this.api.get(`/api/savings/intelligence?project_id=${pid}`).subscribe({
      next: (r: any) => { this.intelligence = r?.latest || r; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.get(`/api/roi?project_id=${pid}`).subscribe({
      next: (r: any) => { this.roi = r?.data || r; },
      error: () => {},
    });
    this.api.get(`/api/payback?project_id=${pid}`).subscribe({
      next: (r: any) => { this.payback = r?.data || r; },
      error: () => {},
    });
    this.api.get(`/api/savings/waterfall?project_id=${pid}`).subscribe({
      next: (r: any) => { this.waterfallData = r?.data || []; this.waterfallMeta = r?.meta || null; },
      error: () => {},
    });
    this.api.get(`/api/savings/trends?project_id=${pid}&limit=500`).subscribe({
      next: (r: any) => { this.trendsData = r?.data || []; },
      error: () => {},
    });
    this.api.get(`/api/current-balance/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.cbiData = r; },
      error: () => {},
    });
    this.api.get(`/api/baseline/?project_id=${pid}&status=locked`).subscribe({
      next: (r: any) => {
        const list = Array.isArray(r) ? r : (r?.data || []);
        this.baselineInfo = list.find((b: any) => b.status === 'locked') || list[0] || null;
      },
      error: () => {},
    });
    this.api.get(`/api/utility/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.utilityData = r; },
      error: () => {},
    });
  }

  // ── KPI helpers ────────────────────────────────────────────────────────────

  get annualSavings(): number {
    return this.intelligence?.annual_savings_est ?? this.intelligence?.annual_savings ?? 0;
  }
  get recoveredKva(): number { return this.intelligence?.recoverable_kva ?? 0; }
  get energyReductionPct(): number { return this.intelligence?.energy_savings_pct ?? 0; }
  get demandReductionPct(): number { return this.intelligence?.demand_reduction_pct ?? 0; }
  get roiValue(): number { return this.roi?.roi ?? this.intelligence?.roi ?? 0; }
  get paybackValue(): number { return this.payback?.payback ?? this.intelligence?.payback ?? 0; }
  get co2Tonnes(): number { return Math.round(this.intelligence?.co2_reduction_tons ?? 0); }

  // ── Rate / cost ────────────────────────────────────────────────────────────

  get energyRate(): number { return this.intelligence?.energy_rate ?? 0; }
  get demandRate(): number { return this.intelligence?.demand_rate ?? 0; }

  get baselineAnnualCost(): number {
    const kwh = this.intelligence?.baseline_kwh_year ?? 0;
    const kw  = this.intelligence?.baseline_avg_kw   ?? 0;
    const e   = this.energyRate;
    const d   = this.demandRate;
    if (!kwh || !e) return 0;
    return Math.round(kwh * e + kw * d * 12);
  }
  get currentAnnualCost(): number {
    return Math.max(0, this.baselineAnnualCost - this.annualSavings);
  }
  get annualCostReductionPct(): number {
    if (!this.baselineAnnualCost) return 0;
    return Math.round(this.annualSavings / this.baselineAnnualCost * 100 * 10) / 10;
  }

  // ── Savings categories ─────────────────────────────────────────────────────

  get energySavings(): number { return this.intelligence?.energy_savings ?? 0; }
  get demandSavings(): number { return this.intelligence?.demand_savings ?? 0; }
  get pfSavings(): number     { return this.intelligence?.pf_savings     ?? 0; }
  get capacityValue(): number { return this.intelligence?.capacity_value  ?? 0; }
  get sustainValue(): number  { return this.intelligence?.sustainability_value ?? 0; }

  get totalSavingsForPct(): number {
    return this.energySavings + this.demandSavings + this.pfSavings + this.capacityValue + this.sustainValue || 1;
  }
  get energySavingsPct(): number  { return (this.energySavings  / this.totalSavingsForPct) * 100; }
  get demandSavingsPct(): number  { return (this.demandSavings  / this.totalSavingsForPct) * 100; }
  get pfSavingsPct(): number      { return (this.pfSavings      / this.totalSavingsForPct) * 100; }
  get capacityValuePct(): number  { return (this.capacityValue  / this.totalSavingsForPct) * 100; }
  get sustainValuePct(): number   { return (this.sustainValue   / this.totalSavingsForPct) * 100; }

  // ── Waterfall chart ────────────────────────────────────────────────────────
  // Returns bars: { label, value, cumBase, color, isTotal, isBaseline }
  get waterfallBars(): { label: string; value: number; cumBase: number; color: string; isTotal: boolean; isBaseline: boolean }[] {
    const baseline = this.baselineAnnualCost;
    if (!baseline) { return []; }

    // Use API data if available, otherwise compute from intelligence
    const categories: { label: string; value: number; color: string }[] = [];

    if (this.waterfallData.length) {
      this.waterfallData
        .filter(d => d.label !== 'Total Annual Savings' && d.value)
        .forEach(d => categories.push({ label: d.label, value: Number(d.value) || 0, color: d.color }));
    } else {
      if (this.demandSavings)  categories.push({ label: 'Demand Savings',       value: this.demandSavings,  color: 'demand'   });
      if (this.energySavings)  categories.push({ label: 'Energy Savings',        value: this.energySavings,  color: 'energy'   });
      if (this.pfSavings)      categories.push({ label: 'Power Factor Savings',  value: this.pfSavings,      color: 'pf'       });
      if (this.capacityValue)  categories.push({ label: 'Capacity Value',         value: this.capacityValue,  color: 'capacity' });
      if (this.sustainValue)   categories.push({ label: 'Sustainability Value',   value: this.sustainValue,   color: 'sustain'  });
    }

    const bars: any[] = [
      { label: 'Baseline Cost', value: baseline, cumBase: 0, color: 'baseline', isBaseline: true, isTotal: false },
    ];
    let runningTop = baseline;
    for (const cat of categories) {
      const v = Math.abs(cat.value);
      runningTop -= v;
      bars.push({ label: cat.label, value: v, cumBase: runningTop, color: cat.color, isBaseline: false, isTotal: false });
    }
    bars.push({ label: 'Current Cost', value: Math.max(0, runningTop), cumBase: 0, color: 'current', isBaseline: false, isTotal: true });
    return bars;
  }

  // SVG waterfall helpers — renders into 320×160 viewBox
  get wfMax(): number {
    const b = this.baselineAnnualCost;
    return b ? b * 1.05 : 1;
  }
  wfBarX(i: number, total: number): number { return 10 + i * (300 / total); }
  wfBarW(total: number): number { return Math.max(8, 300 / total - 4); }
  wfBarY(bar: any): number { return 155 - ((bar.cumBase + bar.value) / this.wfMax) * 145; }
  wfBarH(bar: any): number { return Math.max(2, (bar.value / this.wfMax) * 145); }
  wfBarFill(color: string): string {
    const m: any = {
      baseline: '#29b6f6', demand: '#00e676', energy: '#00e676',
      pf: '#00e676', capacity: '#00e676', sustain: '#4caf50', current: '#29b6f6',
    };
    return m[color] || '#00e676';
  }
  wfBarOpacity(color: string): string {
    return color === 'baseline' || color === 'current' ? '1' : '0.85';
  }

  // ── Cumulative savings trend chart ────────────────────────────────────────
  // Uses trendsData from API, or generates daily projection from annual_savings

  get cumulativeSeries(): { ts: number; value: number }[] {
    if (this.trendsData.length) {
      return this.trendsData
        .filter(d => d.cumulative_savings != null)
        .map(d => ({ ts: d.bucket_ts, value: Number(d.cumulative_savings) }));
    }
    // Fallback: project linearly from project installation date
    const annual = this.annualSavings;
    if (!annual) { return []; }
    const daily = annual / 365;
    const now = Date.now();
    const series: { ts: number; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const ts = now - i * 86400000;
      series.push({ ts, value: Math.round(daily * (30 - i)) });
    }
    return series;
  }

  // SVG polyline for cumulative chart — 400×120 viewBox
  get cumulativePolyline(): string {
    const pts = this.cumulativeSeries;
    if (pts.length < 2) { return ''; }
    const maxV = Math.max(...pts.map(p => p.value), 1);
    const w = 390; const h = 110;
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - (p.value / maxV) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }
  get cumulativeAreaPath(): string {
    const pts = this.cumulativeSeries;
    if (pts.length < 2) { return ''; }
    const maxV = Math.max(...pts.map(p => p.value), 1);
    const w = 390; const h = 110;
    const coords = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - (p.value / maxV) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M0,${h} L${coords.join(' L')} L${w},${h} Z`;
  }
  get cumulativeTotal(): number {
    const pts = this.cumulativeSeries;
    return pts.length ? pts[pts.length - 1].value : 0;
  }
  cumulativeXLabel(idx: number): string {
    const pts = this.cumulativeSeries;
    if (!pts.length) { return ''; }
    const step = Math.floor(pts.length / 6);
    const pt = pts[Math.min(idx * step, pts.length - 1)];
    if (!pt) { return ''; }
    const d = new Date(pt.ts);
    return (d.getMonth() + 1) + '/' + d.getFullYear().toString().slice(2);
  }

  // ── CBI gauges ─────────────────────────────────────────────────────────────

  get productivePct(): number { return this.cbiData?.productive_current_pct ?? 0; }
  get productiveBaseline(): number {
    const pf = this.intelligence?.baseline_avg_pf ?? 0;
    return pf ? Math.round(pf * 100 * 10) / 10 : 0;
  }
  get productiveCurrent(): number {
    const pf = this.intelligence?.current_avg_pf ?? 0;
    return pf ? Math.round(pf * 100 * 10) / 10 : (this.productivePct || 0);
  }
  get productiveImprovement(): number { return Math.round((this.productiveCurrent - this.productiveBaseline) * 10) / 10; }

  get harmonicPct(): number { return this.cbiData?.harmonic_current_pct ?? this.cbiData?.avg_thd ?? 0; }
  get harmonicBaseline(): number { return 0; } // no direct baseline for THD
  get harmonicCurrent(): number { return Math.round((this.harmonicPct || this.cbiData?.avg_thd || 0) * 10) / 10; }

  get imbalancePct(): number { return this.cbiData?.imbalance_pct ?? 0; }
  get imbalanceCurrent(): number { return Math.round((this.imbalancePct || 0) * 10) / 10; }

  // SVG arc gauge — semi-circle, 0→100%
  gaugeDash(valuePct: number, max = 100): string {
    const circ = 125.7; // π × r=40
    const fill = Math.min(Math.max(valuePct / max, 0), 1) * circ;
    return `${fill.toFixed(1)} ${circ}`;
  }
  gaugeColor(valuePct: number, higherIsBetter = true): string {
    const good = higherIsBetter ? valuePct >= 85 : valuePct <= 5;
    const ok   = higherIsBetter ? valuePct >= 70 : valuePct <= 15;
    if (good) return '#00e676';
    if (ok)   return '#ffd740';
    return '#f44336';
  }

  // ── Capacity Recovery ──────────────────────────────────────────────────────

  get installedKva(): number { return this.intelligence?.baseline_avg_kva ?? 0; }
  get baselineAvailKva(): number {
    const installed = this.installedKva;
    const used = this.intelligence?.baseline_avg_kw ?? 0;
    return installed - used || 0;
  }
  get currentAvailKva(): number {
    const installed = this.installedKva;
    const used = this.intelligence?.current_avg_kwa ?? this.intelligence?.current_avg_kva ?? 0;
    return Math.max(0, installed - used);
  }
  get deferredCapital(): number { return Math.round(this.recoveredKva * 65); }
  get utilizationPct(): number {
    if (!this.installedKva) { return 0; }
    return Math.min(100, Math.round((this.intelligence?.current_avg_kw ?? 0) / this.installedKva * 100));
  }

  // ── Financial Intelligence ─────────────────────────────────────────────────

  get savingsToday(): number    { return Math.round(this.annualSavings / 365); }
  get savingsThisMonth(): number{ return Math.round(this.annualSavings / 12); }
  get lifetimeSavings(): number {
    return this.roi?.lifetime_savings ?? this.intelligence?.lifetime_savings ?? 0;
  }
  get netPresentValue(): number { return this.roi?.npv ?? 0; }

  // ── Baseline Info (Locked) ─────────────────────────────────────────────────

  get baselineLocked(): boolean { return this.baselineInfo?.status === 'locked'; }
  get baselineCreatedDate(): string {
    if (!this.baselineInfo?.createdAt) { return '—'; }
    return new Date(this.baselineInfo.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  get baselinePeriod(): string {
    const b = this.baselineInfo;
    if (!b?.test_start || !b?.test_end) { return '—'; }
    return b.test_start + ' – ' + b.test_end;
  }
  get baselineNotes(): string { return this.baselineInfo?.notes || '—'; }

  // ── Formatting helpers ─────────────────────────────────────────────────────

  fmt(n: number, prefix = '$'): string {
    if (!n && n !== 0) { return '—'; }
    if (n === 0) { return prefix + '0'; }
    if (Math.abs(n) >= 1000000) { return prefix + (n / 1000000).toFixed(2) + 'M'; }
    if (Math.abs(n) >= 1000)    { return prefix + (n / 1000).toFixed(1) + 'K'; }
    return prefix + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  fmtPct(n: number | null, decimals = 1): string {
    if (n == null || n === 0) { return '—'; }
    return (n >= 0 ? '' : '') + n.toFixed(decimals) + '%';
  }
  fmtDelta(n: number, higherBetter = true): string {
    if (!n) { return '—'; }
    const sign = n > 0 ? (higherBetter ? '▲ ' : '▼ ') : (higherBetter ? '▼ ' : '▲ ');
    return sign + Math.abs(n).toFixed(1) + '%';
  }
}
