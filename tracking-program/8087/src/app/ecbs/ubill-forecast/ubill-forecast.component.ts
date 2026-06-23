import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-ubill-forecast',
  templateUrl: './ubill-forecast.component.html',
  styleUrls: ['./ubill-forecast.component.scss'],
})
export class UBillForecastComponent implements OnInit {
  projectId: number;
  loading = true;

  // forecasts: GET /api/utility/forecast — returns data: [] of monthly forecast objects
  // each: forecast_month, forecast_total_cost, forecast_energy_kwh, forecast_demand_kw,
  //       forecast_energy_cost, forecast_demand_cost, forecast_taxes, forecast_fees,
  //       budget_total_cost, variance_vs_budget, variance_pct, confidence
  forecastRows: any[]  = [];
  summary: any         = null;  // GET /api/utility/summary — data: {}
  savings: any         = null;  // GET /api/savings/intelligence
  cbiData: any         = null;

  readonly CW = 580;
  readonly CH = 200;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    var p = this.userService.user && this.userService.user.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    var pid = this.projectId;
    var done = 0;
    var self = this;
    var finish = function() { done++; if (done >= 4) { self.loading = false; } };

    this.api.get('/api/utility/forecast?project_id=' + pid + '&months_ahead=12').subscribe({
      next: function(r: any) {
        self.forecastRows = (r && r.data && Array.isArray(r.data)) ? r.data : [];
        finish();
      },
      error: function() { finish(); },
    });
    this.api.get('/api/utility/summary?project_id=' + pid + '&months=12').subscribe({
      next: function(r: any) { self.summary = (r && r.data) ? r.data : r; finish(); },
      error: function() { finish(); },
    });
    this.api.get('/api/savings/intelligence?project_id=' + pid).subscribe({
      next: function(r: any) { self.savings = (r && r.latest) ? r.latest : r; finish(); },
      error: function() { finish(); },
    });
    this.api.get('/api/current-balance/summary?project_id=' + pid).subscribe({
      next: function(r: any) { self.cbiData = r; finish(); },
      error: function() { finish(); },
    });
  }

  // The next month's forecast is the first row
  get nextForecast(): any { return this.forecastRows.length ? this.forecastRows[0] : null; }

  // ── KPI Values ─────────────────────────────────────────────────────────────
  get forecastedCost(): number {
    return (this.nextForecast && this.nextForecast.forecast_total_cost) || 0;
  }
  get forecastedKwh(): number {
    return (this.nextForecast && this.nextForecast.forecast_energy_kwh) || 0;
  }
  get forecastedDemand(): number {
    return (this.nextForecast && this.nextForecast.forecast_demand_kw) || 0;
  }
  get forecastedDays(): number {
    // Estimate from month
    return 31;
  }
  get forecastVsBudget(): number {
    return (this.nextForecast && this.nextForecast.variance_vs_budget) || 0;
  }
  get forecastAccuracyYtd(): number {
    return 0; // Not in API — placeholder for future ML accuracy tracking
  }
  get forecastVsActualPct(): number {
    var actual = (this.summary && this.summary.total_cost_period && this.summary.months_included)
      ? this.summary.total_cost_period / this.summary.months_included : 0;
    if (!actual || !this.forecastedCost) { return 0; }
    return ((this.forecastedCost - actual) / actual) * 100;
  }
  get forecastAccuracyVsLastMonth(): number { return 0; }

  // ── Config display ─────────────────────────────────────────────────────────
  get forecastName(): string  { return (this.nextForecast && this.nextForecast.forecast_month) ? this.nextForecast.forecast_month + ' Forecast' : '—'; }
  get forecastSite(): string  { var p = this.userService.user && this.userService.user.selectedProject; return p && p.name ? p.name.toString() : '—'; }
  get forecastUtility(): string { return (this.summary && this.summary.utility_provider) || '—'; }
  get forecastPeriod(): string  { return this.nextForecast ? this.nextForecast.forecast_month : '—'; }
  get forecastModel(): string   { return 'Hybrid (Regression + ML)'; }
  get baselineId(): string      { return (this.savings && this.savings.baseline_id) || '—'; }
  get weatherSource(): string   { return 'NOAA (10-Day)'; }

  // ── Forecast summary panel ─────────────────────────────────────────────────
  get baselineCost(): number   { return (this.savings && this.savings.baseline_monthly_cost) || 0; }
  get forecastVariance(): number { return this.forecastedCost - this.baselineCost; }
  get forecastVariancePct(): number {
    return this.baselineCost ? ((this.forecastedCost - this.baselineCost) / this.baselineCost) * 100 : 0;
  }
  get confidenceLevel(): number { return (this.nextForecast && this.nextForecast.confidence) || 0; }
  get weatherImpact(): number   { return 0; }
  get rateImpact(): number      { return 0; }

  // ── Monthly forecast table ─────────────────────────────────────────────────
  get monthlyRows(): any[] { return this.forecastRows; }

  rowVsBaseline(r: any): number {
    return this.baselineCost ? (r.forecast_total_cost - this.baselineCost) : (r.variance_vs_budget || 0);
  }
  rowVsBaselinePct(r: any): number {
    return this.baselineCost ? ((r.forecast_total_cost - this.baselineCost) / this.baselineCost * 100) : (r.variance_pct || 0);
  }

  // ── Key drivers (from savings intelligence) ────────────────────────────────
  get forecastDrivers(): { icon: string; color: string; label: string; desc: string; impact: number }[] {
    var drivers: { icon: string; color: string; label: string; desc: string; impact: number }[] = [];
    if (!this.savings) { return drivers; }
    var s = this.savings;
    if (s.demand_savings > 0) {
      drivers.push({ icon: 'fa-bolt', color: '#00e676', label: 'Demand Reduction',
        desc: 'ECBS demand optimization', impact: -Math.round(s.demand_savings / 12) });
    }
    if (s.pf_savings > 0) {
      drivers.push({ icon: 'fa-circle-o', color: '#00e676', label: 'Power Factor Improvement',
        desc: 'Reactive power correction', impact: -Math.round(s.pf_savings / 12) });
    }
    if (s.energy_savings > 0) {
      drivers.push({ icon: 'fa-flash', color: '#00e676', label: 'Energy Reduction',
        desc: 'ECBS efficiency gains', impact: -Math.round(s.energy_savings / 12) });
    }
    return drivers;
  }

  // ── Cost breakdown (from first forecast row) ───────────────────────────────
  get brkEnergy(): number { return (this.nextForecast && this.nextForecast.forecast_energy_cost) || 0; }
  get brkDemand(): number { return (this.nextForecast && this.nextForecast.forecast_demand_cost) || 0; }
  get brkTaxes(): number  { return this.nextForecast ? ((this.nextForecast.forecast_taxes || 0) + (this.nextForecast.forecast_fees || 0)) : 0; }
  get brkPF(): number     { return 0; }
  get brkTotal(): number  { return this.forecastedCost || 1; }
  get brkEnergyPct(): number { return Math.round(this.brkEnergy / this.brkTotal * 100); }
  get brkDemandPct(): number { return Math.round(this.brkDemand / this.brkTotal * 100); }
  get brkTaxesPct(): number  { return Math.round(this.brkTaxes  / this.brkTotal * 100); }
  get brkPFPct(): number     { return 0; }

  readonly donutCirc = 314.2;

  get donutSegs(): { color: string; label: string; amt: number; pct: number; dash: number; offset: number }[] {
    var items = [
      { color: '#29b6f6', label: 'Energy Charges', amt: this.brkEnergy, pct: this.brkEnergyPct },
      { color: '#ffd740', label: 'Demand Charges', amt: this.brkDemand, pct: this.brkDemandPct },
      { color: '#ff7043', label: 'Taxes & Fees',   amt: this.brkTaxes,  pct: this.brkTaxesPct  },
      { color: '#ce93d8', label: 'PF Penalties',   amt: this.brkPF,     pct: this.brkPFPct     },
    ];
    var offset = 0;
    var circ = this.donutCirc;
    return items.map(function(s) {
      var dash = (s.pct / 100) * circ;
      var seg = { color: s.color, label: s.label, amt: s.amt, pct: s.pct, dash: dash, offset: -(offset / 100) * circ };
      offset += s.pct;
      return seg;
    });
  }

  // ── Chart: combine actual bills (from summary.recent_bills) + forecast rows ──
  get chartMonths(): any[] {
    var result: any[] = [];
    // Actuals from summary recent_bills
    var recent = (this.summary && this.summary.recent_bills) ? this.summary.recent_bills : [];
    for (var i = recent.length - 1; i >= 0; i--) {
      var b = recent[i];
      result.push({
        label: b.bill_month || '',
        actual_cost: b.total_cost || 0,
        forecast_cost: null,
        baseline_cost: this.baselineCost,
      });
    }
    // Forecast months ahead
    for (var j = 0; j < this.forecastRows.length; j++) {
      var f = this.forecastRows[j];
      result.push({
        label: f.forecast_month || '',
        actual_cost: null,
        forecast_cost: f.forecast_total_cost || 0,
        baseline_cost: this.baselineCost,
      });
    }
    return result;
  }

  trendPolyActual(W: number, H: number): string {
    var pts = this.chartMonths.filter(function(m: any) { return m.actual_cost != null; });
    if (pts.length < 2) { return ''; }
    var max = this.chartYMax;
    var N = this.chartMonths.length;
    var result: string[] = [];
    for (var i = 0; i < pts.length; i++) {
      var idx = this.chartMonths.indexOf(pts[i]);
      var x = (idx / Math.max(N - 1, 1)) * (W - 40) + 20;
      var y = H - (pts[i].actual_cost || 0) / max * (H - 20) - 10;
      result.push(x.toFixed(1) + ',' + y.toFixed(1));
    }
    return result.join(' ');
  }

  trendPolyForecast(W: number, H: number): string {
    var pts = this.chartMonths.filter(function(m: any) { return m.forecast_cost != null; });
    if (pts.length < 2) { return ''; }
    var max = this.chartYMax;
    var N = this.chartMonths.length;
    var result: string[] = [];
    for (var i = 0; i < pts.length; i++) {
      var idx = this.chartMonths.indexOf(pts[i]);
      var x = (idx / Math.max(N - 1, 1)) * (W - 40) + 20;
      var y = H - (pts[i].forecast_cost || 0) / max * (H - 20) - 10;
      result.push(x.toFixed(1) + ',' + y.toFixed(1));
    }
    return result.join(' ');
  }

  trendPolyBaseline(W: number, H: number): string {
    var pts = this.chartMonths;
    if (pts.length < 2 || !this.baselineCost) { return ''; }
    var max = this.chartYMax;
    var N = pts.length;
    var y = H - this.baselineCost / max * (H - 20) - 10;
    return '20,' + y.toFixed(1) + ' ' + (W - 20) + ',' + y.toFixed(1);
  }

  get chartYMax(): number {
    var vals = this.chartMonths.map(function(m: any) {
      return Math.max(m.actual_cost || 0, m.forecast_cost || 0, m.baseline_cost || 0);
    });
    return Math.max.apply(Math, vals.concat([1]));
  }
  get chartYLabels(): { y: number; label: string }[] {
    var max = this.chartYMax;
    var CH = this.CH;
    return [0, 0.25, 0.5, 0.75, 1].map(function(pct) {
      return { y: CH - pct * (CH - 20) - 10, label: '$' + Math.round(max * pct / 1000) + 'K' };
    });
  }
  get chartXLabels(): { x: number; label: string }[] {
    var N = this.chartMonths.length;
    var CW = this.CW;
    var step = Math.max(1, Math.floor(N / 8));
    return this.chartMonths.map(function(m: any, i: number) {
      return { x: (i / Math.max(N - 1, 1)) * (CW - 40) + 20, label: m.label || '' };
    }).filter(function(_: any, i: number) { return i % step === 0 || i === N - 1; });
  }

  // ── Formatting ─────────────────────────────────────────────────────────────
  fmtNum(n: number): string {
    if (!n) { return '0'; }
    if (n >= 1000000) { return (n / 1000000).toFixed(2) + 'M'; }
    if (n >= 1000)    { return Math.round(n / 1000) + 'K'; }
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  fmt(n: number): string { return '$' + this.fmtNum(n); }
  pctSign(n: number): string { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }
  rowVarianceColor(vs: number): string { return vs < 0 ? '#00e676' : vs > 0 ? '#ef5350' : '#546e7a'; }
}
