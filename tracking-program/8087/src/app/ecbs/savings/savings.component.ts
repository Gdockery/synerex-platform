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
  roiData: any       = null;
  waterfallData: any[] = [];
  trendsData: any[]    = [];

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
    let done = 0;
    const finish = () => { done++; if (done === 4) this.loading = false; };

    this.api.get(`/api/savings/intelligence?project_id=${pid}`).subscribe({
      next: (r: any) => { this.intelligence = r?.latest || r; finish(); },
      error: () => finish(),
    });
    this.api.get(`/api/roi?project_id=${pid}`).subscribe({
      next: (r: any) => { this.roiData = r?.data || r; finish(); },
      error: () => finish(),
    });
    this.api.get(`/api/savings/waterfall?project_id=${pid}`).subscribe({
      next: (r: any) => { this.waterfallData = r?.data || []; finish(); },
      error: () => finish(),
    });
    this.api.get(`/api/savings/trends?project_id=${pid}&limit=1000`).subscribe({
      next: (r: any) => { this.trendsData = r?.data || []; finish(); },
      error: () => finish(),
    });
  }

  // ── Primary KPI values ─────────────────────────────────────────────────────

  get annualSavings(): number {
    return this.intelligence?.annual_savings_est ?? this.intelligence?.annual_savings ?? 0;
  }
  get energySavings(): number  { return this.intelligence?.energy_savings  ?? 0; }
  get demandSavings(): number  { return this.intelligence?.demand_savings   ?? 0; }
  get pfSavings(): number      { return this.intelligence?.pf_savings       ?? 0; }
  get capacityValue(): number  { return this.intelligence?.capacity_value   ?? 0; }
  get sustainValue(): number   { return this.intelligence?.sustainability_value ?? 0; }
  get projectCost(): number    { return this.roiData?.project_cost ?? this.intelligence?.project_cost ?? 0; }
  get roiPct(): number         { return this.roiData?.roi ?? this.intelligence?.roi ?? 0; }
  get paybackYears(): number   { return this.roiData?.payback ?? this.intelligence?.payback ?? 0; }
  get lifetimeSavings(): number{ return this.roiData?.lifetime_savings ?? this.intelligence?.lifetime_savings ?? 0; }
  get co2Tonnes(): number      { return Math.round(this.intelligence?.co2_reduction_tons ?? 0); }
  get recoveredKva(): number   { return this.intelligence?.recoverable_kva ?? 0; }
  get kwReduction(): number    { return this.intelligence?.kw_reduction ?? 0; }
  get energyRate(): number     { return this.intelligence?.energy_rate ?? 0; }
  get demandRate(): number     { return this.intelligence?.demand_rate ?? 0; }

  // ── Spec KPI cards ─────────────────────────────────────────────────────────

  // Utility Cost Reduction = energy + demand + pf savings combined
  get utilityCostReduction(): number { return this.energySavings + this.demandSavings + this.pfSavings; }
  // Infrastructure deferral = capacity value
  get infrastructureDeferral(): number { return this.capacityValue; }
  // Payback in months (human readable)
  get paybackMonths(): number { return Math.round(this.paybackYears * 12 * 10) / 10; }
  get paybackDisplay(): string {
    if (!this.paybackYears) return '—';
    if (this.paybackMonths < 24) return this.paybackMonths.toFixed(1) + ' Mo';
    return this.paybackYears.toFixed(1) + ' Yr';
  }

  // ── Donut chart: Savings breakdown ────────────────────────────────────────

  get savingsTotal(): number {
    return this.demandSavings + this.energySavings + this.pfSavings + this.capacityValue + this.sustainValue || 1;
  }
  get demandPct(): number  { return (this.demandSavings  / this.savingsTotal) * 100; }
  get energyPct(): number  { return (this.energySavings  / this.savingsTotal) * 100; }
  get pfPct(): number      { return (this.pfSavings       / this.savingsTotal) * 100; }
  get capacityPct(): number{ return (this.capacityValue   / this.savingsTotal) * 100; }
  get sustainPct(): number { return (this.sustainValue    / this.savingsTotal) * 100; }

  // Donut segments: each returns {color, dash, offset, label, value, pct}
  get donutSegments(): { color: string; label: string; value: number; pct: number; dash: number; offset: number }[] {
    const r = 54; const circ = 2 * Math.PI * r;
    const cats = [
      { label: 'Demand Charge Reduction',  color: '#00e676', value: this.demandSavings,  pct: this.demandPct  },
      { label: 'Energy Cost Reduction',    color: '#29b6f6', value: this.energySavings,  pct: this.energyPct  },
      { label: 'Power Factor Improvement', color: '#ffd740', value: this.pfSavings,      pct: this.pfPct      },
      { label: 'Infrastructure Deferral',  color: '#ab47bc', value: this.capacityValue,  pct: this.capacityPct},
      { label: 'Sustainability Value',     color: '#4caf50', value: this.sustainValue,   pct: this.sustainPct },
    ].filter(c => c.value > 0);
    let cumPct = 0;
    return cats.map(c => {
      const dash   = (c.pct / 100) * circ;
      const offset = circ - (cumPct / 100) * circ;
      cumPct += c.pct;
      return { ...c, dash, offset };
    });
  }

  // ── Cumulative savings chart ───────────────────────────────────────────────

  get cumulativeSeries(): { ts: number; value: number }[] {
    if (this.trendsData.length) {
      return this.trendsData
        .filter(d => d.cumulative_savings != null)
        .map(d => ({ ts: d.bucket_ts, value: Number(d.cumulative_savings) }));
    }
    // Fallback: linear projection from today
    const annual = this.annualSavings;
    if (!annual) return [];
    const now = Date.now();
    const series: { ts: number; value: number }[] = [];
    for (let i = 30; i >= 0; i--) {
      series.push({ ts: now - i * 86400000, value: Math.round((annual / 365) * (30 - i)) });
    }
    return series;
  }

  get cumulativePolyline(): string {
    const pts = this.cumulativeSeries;
    if (pts.length < 2) return '';
    const maxV = Math.max(...pts.map(p => p.value), 1);
    const W = 390; const H = 110;
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - (p.value / maxV) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  get cumulativeAreaPath(): string {
    const pts = this.cumulativeSeries;
    if (pts.length < 2) return '';
    const maxV = Math.max(...pts.map(p => p.value), 1);
    const W = 390; const H = 110;
    const coords = pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - (p.value / maxV) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M0,${H} L${coords.join(' L')} L${W},${H} Z`;
  }

  get cumulativeTotal(): number {
    const pts = this.cumulativeSeries;
    return pts.length ? pts[pts.length - 1].value : 0;
  }
  get cumulativeXLabels(): { x: number; label: string }[] {
    const pts = this.cumulativeSeries;
    if (!pts.length) return [];
    const W = 390; const n = pts.length;
    const step = Math.max(1, Math.floor(n / 6));
    return pts
      .filter((_, i) => i % step === 0)
      .slice(0, 7)
      .map((p, j) => {
        const origIdx = Math.min(j * step, n - 1);
        const x = (origIdx / Math.max(n - 1, 1)) * W;
        const d = new Date(p.ts);
        return { x, label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }) };
      });
  }
  get cumulativeYLabels(): { y: number; label: string }[] {
    const pts = this.cumulativeSeries;
    const H = 110;
    const maxV = pts.length ? Math.max(...pts.map(p => p.value), 1) : 1;
    return [0, 0.25, 0.5, 0.75, 1].map(frac => ({
      y: H - frac * H,
      label: this._fmtK(maxV * frac),
    }));
  }

  // ── Monthly trend (stacked bars) ───────────────────────────────────────────

  get monthlyTrend(): { label: string; demand: number; energy: number; pf: number; total: number }[] {
    const frac = 15.0 / 60 / 24 / 30; // 15-min slice as fraction of a month
    const byMonth: Record<string, any> = {};
    for (const row of this.trendsData) {
      const d = new Date(row.bucket_ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!byMonth[key]) byMonth[key] = { label, demand: 0, energy: 0, pf: 0, sort: key };
      byMonth[key].demand += (row.demand_savings  || 0) * frac;
      byMonth[key].energy += (row.energy_savings  || 0) * frac;
      byMonth[key].pf     += (row.pf_savings      || 0) * frac;
    }
    return Object.values(byMonth)
      .sort((a, b) => a.sort.localeCompare(b.sort))
      .slice(-12)
      .map(m => ({ ...m, total: m.demand + m.energy + m.pf }));
  }

  // SVG bar chart for monthly trend
  readonly MT_W = 380; readonly MT_H = 120;

  get monthlyBarData(): { label: string; x: number; bw: number; demandH: number; energyH: number; pfH: number; demandY: number; energyY: number; pfY: number; total: number }[] {
    const months = this.monthlyTrend;
    if (!months.length) return [];
    const maxTotal = Math.max(...months.map(m => m.total), 1);
    const bw = Math.max(8, (this.MT_W / months.length) - 4);
    return months.map((m, i) => {
      const x = i * (this.MT_W / months.length) + 2;
      const demandH = (m.demand / maxTotal) * this.MT_H;
      const energyH = (m.energy / maxTotal) * this.MT_H;
      const pfH     = (m.pf     / maxTotal) * this.MT_H;
      return {
        label: m.label, x, bw,
        demandH, energyH, pfH,
        demandY: this.MT_H - demandH,
        energyY: this.MT_H - demandH - energyH,
        pfY:     this.MT_H - demandH - energyH - pfH,
        total:   m.total,
      };
    });
  }
  get monthlyMaxLabel(): string { return this._fmtK(Math.max(...this.monthlyTrend.map(m => m.total), 1)); }

  // ── Demand charge reduction table ──────────────────────────────────────────

  get demandImpactRows(): { month: string; beforeKw: number; afterKw: number; reductionKw: number; savings: number }[] {
    const baseKw    = this.intelligence?.baseline_avg_kw ?? 0;
    const currKw    = this.intelligence?.current_avg_kw  ?? 0;
    const kwRed     = this.kwReduction || (baseKw - currKw);
    const dRate     = this.demandRate;
    const months    = this.monthlyTrend;

    if (!months.length && baseKw) {
      // No trend data — show one summary row from intelligence scalars
      return [{ month: 'Avg / Total', beforeKw: Math.round(baseKw), afterKw: Math.round(currKw),
        reductionKw: Math.round(kwRed), savings: this.demandSavings }];
    }
    return months.map(m => ({
      month:       m.label,
      beforeKw:    Math.round(baseKw),
      afterKw:     Math.round(currKw),
      reductionKw: Math.round(kwRed),
      savings:     Math.round(m.demand),
    })).slice(-6); // last 6 months
  }
  get demandImpactTotal(): number { return this.demandSavings; }

  // ── Utility Bill Comparison chart ──────────────────────────────────────────

  get utilityComparisonMonths(): { label: string; before: number; after: number; saved: number }[] {
    // Monthly utility cost: energy portion + demand portion
    const eRate = this.energyRate;
    const dRate = this.demandRate;
    const bKwh  = (this.intelligence?.baseline_kwh_year  ?? 0) / 12;
    const cKwh  = (this.intelligence?.current_kwh_year   ?? 0) / 12;
    const bKw   = this.intelligence?.baseline_avg_kw ?? 0;
    const cKw   = this.intelligence?.current_avg_kw  ?? 0;

    const beforeMonthly = bKwh * eRate + bKw * dRate;
    const afterMonthly  = cKwh * eRate + cKw * dRate;
    const savedMonthly  = beforeMonthly - afterMonthly;

    const months = this.monthlyTrend;
    if (!months.length) {
      if (!beforeMonthly) return [];
      // Show last 6 months based on today
      return Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - 5 + i);
        return { label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
          before: Math.round(beforeMonthly), after: Math.round(afterMonthly), saved: Math.round(savedMonthly) };
      });
    }
    return months.slice(-6).map(m => ({
      label:  m.label,
      before: Math.round(beforeMonthly),
      after:  Math.max(0, Math.round(afterMonthly)),
      saved:  Math.round(m.total),
    }));
  }

  get ucMaxValue(): number {
    return Math.max(...this.utilityComparisonMonths.map(m => m.before), 1);
  }

  // SVG bar dims for utility comparison
  ucBarH(val: number): number { return Math.max(2, (val / (this.ucMaxValue || 1)) * 100); }
  ucBarY(val: number): number { return 100 - this.ucBarH(val); }

  // ── 5-Year projection ──────────────────────────────────────────────────────

  get fiveYearSavings(): number   { return Math.round(this.annualSavings * 5); }
  get fiveYearNetBenefit(): number{ return Math.max(0, this.fiveYearSavings - this.projectCost); }
  get fiveYearROI(): number       { return this.projectCost ? Math.round(this.fiveYearSavings / this.projectCost * 100) : 0; }
  get tenYearSavings(): number    { return Math.round(this.annualSavings * 10); }
  get npv(): number               { return Math.round(this.fiveYearNetBenefit * 0.87); } // simple NPV approximation at 8% discount

  // ── Non-Energy Financial Benefits ──────────────────────────────────────────

  get nonEnergyBenefits(): { label: string; description: string; value: number }[] {
    const out: { label: string; description: string; value: number }[] = [];
    if (this.capacityValue > 0) {
      out.push({ label: 'Infrastructure Upgrade Deferral', description: 'Avoided capital expenditure', value: this.capacityValue });
    }
    if (this.recoveredKva > 0) {
      out.push({ label: 'Increased Production Capacity', description: 'Ability to add more equipment', value: Math.round(this.recoveredKva * 65) });
    }
    if (this.pfSavings > 0) {
      out.push({ label: 'Reduced Maintenance', description: 'Lower thermal stress on equipment', value: Math.round(this.pfSavings * 5) });
    }
    if (this.sustainValue > 0) {
      out.push({ label: 'Extended Equipment Life', description: 'Reduced wear and tear', value: this.sustainValue });
    }
    return out;
  }
  get totalNonEnergyBenefits(): number {
    return this.nonEnergyBenefits.reduce((sum, b) => sum + b.value, 0);
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────

  private _fmtK(n: number): string {
    if (!n) return '$0';
    if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1000)    return '$' + Math.round(n / 1000) + 'K';
    return '$' + Math.round(n).toLocaleString();
  }

  fmt(n: number, prefix = '$', decimals = 0): string {
    if (n == null || isNaN(n)) return '—';
    if (n === 0) return prefix + '0';
    if (Math.abs(n) >= 1000000) return prefix + (n / 1000000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1000)    return prefix + (n / 1000).toFixed(1) + 'K';
    return prefix + n.toLocaleString(undefined, { maximumFractionDigits: decimals });
  }

  fmtFull(n: number): string {
    if (!n) return '$0';
    return '$' + Math.round(n).toLocaleString();
  }

  fmtPct(n: number): string {
    if (n == null || isNaN(n) || n === 0) return '—';
    return n.toFixed(1) + '%';
  }

  get hasData(): boolean {
    return !!(this.annualSavings || this.demandSavings || this.energySavings);
  }
}
