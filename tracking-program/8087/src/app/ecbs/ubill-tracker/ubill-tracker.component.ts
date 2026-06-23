import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-ubill-tracker',
  templateUrl: './ubill-tracker.component.html',
  styleUrls: ['./ubill-tracker.component.scss'],
})
export class UBillTrackerComponent implements OnInit {
  projectId: number;
  loading = true;

  // summary: GET /api/utility/summary — wrapped in data: {}
  // returns: total_cost_period, total_kwh_period, avg_demand_kw, vs_prior_period_pct,
  //          avg_energy_rate, avg_demand_rate, months_included, recent_bills
  summary: any     = null;
  // bills: GET /api/utility/bills — wrapped in data: []
  // bill fields: bill_month, energy_kwh, demand_kw, power_factor,
  //              energy_cost, demand_cost, taxes, fees, total_cost, is_paid
  bills: any[]     = [];
  savingsData: any = null;
  cbiData: any     = null;

  selectedBill: any = null;
  currentPage = 1;
  readonly pageSize = 5;
  timeRange = '12m';

  readonly CW = 580;
  readonly CH = 180;

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

    this.api.get('/api/utility/summary?project_id=' + pid + '&months=12').subscribe({
      next: function(r: any) { self.summary = (r && r.data) ? r.data : r; finish(); },
      error: function() { finish(); },
    });
    this.api.get('/api/utility/bills?project_id=' + pid + '&limit=60').subscribe({
      next: function(r: any) {
        self.bills = (r && r.data) ? r.data : (r || []);
        if (!self.selectedBill && self.bills.length) { self.selectedBill = self.bills[0]; }
        finish();
      },
      error: function() { finish(); },
    });
    this.api.get('/api/savings/intelligence?project_id=' + pid).subscribe({
      next: function(r: any) { self.savingsData = (r && r.latest) ? r.latest : r; finish(); },
      error: function() { finish(); },
    });
    this.api.get('/api/current-balance/summary?project_id=' + pid).subscribe({
      next: function(r: any) { self.cbiData = r; finish(); },
      error: function() { finish(); },
    });
  }

  selectBill(b: any) { this.selectedBill = b; }

  // ── Pagination ─────────────────────────────────────────────────────────────
  get totalPages(): number { return Math.ceil(this.bills.length / this.pageSize) || 1; }
  get pagedBills(): any[] {
    var start = (this.currentPage - 1) * this.pageSize;
    return this.bills.slice(start, start + this.pageSize);
  }
  get pageNumbers(): number[] {
    var pages: number[] = [];
    for (var i = 1; i <= Math.min(this.totalPages, 5); i++) { pages.push(i); }
    return pages;
  }

  // ── KPI values — mapped to actual API field names ─────────────────────────
  // summary.total_cost_period = sum of total_cost for months requested
  get currentMonthCost(): number { return (this.summary && this.summary.total_cost_period) || 0; }
  get currentMonthKwh(): number  { return (this.summary && this.summary.total_kwh_period)  || 0; }
  get peakDemandKw(): number     { return (this.summary && this.summary.avg_demand_kw)     || 0; }
  get avgPowerFactor(): number   { return (this.cbiData && this.cbiData.avg_pf) || 0; }
  get momVariancePct(): number   { return (this.summary && this.summary.vs_prior_period_pct) || 0; }
  get momKwhVariancePct(): number { return 0; }
  get momDemandVariancePct(): number { return 0; }

  get ytdSavings(): number     { return (this.savingsData && this.savingsData.ytd_savings) || 0; }
  get baselineCost(): number   { return (this.savingsData && this.savingsData.baseline_monthly_cost) || 0; }
  get costVsBaseline(): number {
    if (!this.baselineCost || !this.currentMonthCost) { return 0; }
    return ((this.currentMonthCost - this.baselineCost) / this.baselineCost) * 100;
  }
  get monthlySavings(): number {
    if (this.savingsData && this.savingsData.annual_savings) { return Math.round(this.savingsData.annual_savings / 12); }
    return 0;
  }

  // ── Bill breakdown — bills use separate taxes/fees fields ─────────────────
  get breakdownEnergy(): number  { return (this.selectedBill && this.selectedBill.energy_cost) || (this.summary && this.summary.avg_energy_rate && this.currentMonthKwh ? this.summary.avg_energy_rate * this.currentMonthKwh : 0); }
  get breakdownDemand(): number  { return (this.selectedBill && this.selectedBill.demand_cost)  || 0; }
  get breakdownTaxes(): number   {
    if (this.selectedBill) { return ((this.selectedBill.taxes || 0) + (this.selectedBill.fees || 0)); }
    return 0;
  }
  get breakdownPF(): number      { return 0; }
  get breakdownTotal(): number   { return (this.selectedBill && this.selectedBill.total_cost) || this.currentMonthCost || 1; }

  get energyPct(): number { return this.breakdownTotal ? Math.round(this.breakdownEnergy / this.breakdownTotal * 100) : 0; }
  get demandPct(): number { return this.breakdownTotal ? Math.round(this.breakdownDemand / this.breakdownTotal * 100) : 0; }
  get taxesPct(): number  { return this.breakdownTotal ? Math.round(this.breakdownTaxes  / this.breakdownTotal * 100) : 0; }
  get pfPct(): number     { return this.breakdownTotal ? Math.round(this.breakdownPF     / this.breakdownTotal * 100) : 0; }

  // ── Donut (r=50, circ=314.2) ───────────────────────────────────────────────
  readonly donutCirc = 314.2;

  get donutSegs(): { color: string; label: string; amt: number; pct: number; dash: number; offset: number }[] {
    var items = [
      { color: '#29b6f6', label: 'Energy Charges', amt: this.breakdownEnergy, pct: this.energyPct },
      { color: '#ffd740', label: 'Demand Charges', amt: this.breakdownDemand, pct: this.demandPct },
      { color: '#ff7043', label: 'Taxes & Fees',   amt: this.breakdownTaxes,  pct: this.taxesPct  },
      { color: '#ce93d8', label: 'PF Penalties',   amt: this.breakdownPF,     pct: this.pfPct     },
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

  // ── Cost drivers from savings intelligence ─────────────────────────────────
  get costDrivers(): { icon: string; color: string; label: string; desc: string; impact: number; type: string }[] {
    var drivers: { icon: string; color: string; label: string; desc: string; impact: number; type: string }[] = [];
    if (!this.savingsData) { return drivers; }
    var s = this.savingsData;
    if (s.demand_savings > 0) {
      var kw = Math.round(s.kw_reduction || 0);
      drivers.push({ icon: 'fa-bolt', color: '#00e676', label: 'Demand Reduction',
        desc: kw ? 'Reduced ' + kw + ' kW' : 'ECBS demand optimization',
        impact: Math.round(s.demand_savings / 12), type: 'savings' });
    }
    if (s.pf_savings > 0) {
      var pf = (this.cbiData && this.cbiData.avg_pf) ? this.cbiData.avg_pf : 0;
      drivers.push({ icon: 'fa-circle-o', color: '#00e676', label: 'Power Factor Improvement',
        desc: pf ? 'Improved to ' + pf.toFixed(2) : 'Reactive power correction',
        impact: Math.round(s.pf_savings / 12), type: 'savings' });
    }
    if (s.energy_savings > 0) {
      var kwh = Math.round((s.kw_reduction || 0) * 730);
      drivers.push({ icon: 'fa-flash', color: '#00e676', label: 'Energy Reduction',
        desc: kwh ? 'Reduced ' + kwh.toLocaleString() + ' kWh' : 'ECBS efficiency',
        impact: Math.round(s.energy_savings / 12), type: 'savings' });
    }
    return drivers;
  }

  // ── Trend chart data from bills list ───────────────────────────────────────
  get trendBills(): any[] { return this.bills.slice(0, 12).reverse(); }

  trendPolyline(field: string, W: number, H: number): string {
    var pts = this.trendBills;
    if (pts.length < 2) { return ''; }
    var vals = pts.map(function(b: any) { return b[field] || 0; });
    var maxV = Math.max.apply(Math, vals.concat([1]));
    return pts.map(function(b: any, i: number) {
      var x = (i / (pts.length - 1)) * (W - 40) + 20;
      var y = H - (b[field] || 0) / maxV * (H - 20) - 10;
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }

  get trendXLabels(): { x: number; label: string }[] {
    var pts = this.trendBills;
    if (!pts.length) { return []; }
    var step = Math.max(1, Math.floor(pts.length / 6));
    var CW = this.CW;
    var N = pts.length;
    return pts.map(function(b: any, i: number) {
      return { x: (i / Math.max(N - 1, 1)) * (CW - 40) + 20, label: b.bill_month || '' };
    }).filter(function(_: any, i: number) { return i % step === 0 || i === N - 1; });
  }

  get trendYMax(): number {
    var vals = this.trendBills.map(function(b: any) { return b.total_cost || 0; });
    return Math.max.apply(Math, vals.concat([1]));
  }
  get trendYLabels(): { y: number; label: string }[] {
    var max = this.trendYMax;
    var CH = this.CH;
    return [0, 0.25, 0.5, 0.75, 1].map(function(pct) {
      return { y: CH - pct * (CH - 20) - 10, label: '$' + Math.round(max * pct / 1000) + 'K' };
    });
  }

  // ── Baseline data ──────────────────────────────────────────────────────────
  get baselineId(): string    { return (this.savingsData && this.savingsData.baseline_id) || '—'; }
  get baselineMethod(): string { return (this.savingsData && this.savingsData.method) || 'Whole Facility (IPMVP Option C)'; }
  get baselineCreated(): string { return (this.savingsData && this.savingsData.created_at) || '—'; }
  get baselineUpdated(): string { return (this.savingsData && this.savingsData.updated_at) || '—'; }
  get baselineStatus(): string  { return (this.savingsData && this.savingsData.status) || 'LOCKED'; }

  // ── Utility account summary ────────────────────────────────────────────────
  get totalAccounts(): number    { return (this.summary && this.summary.total_utility_accounts) || 1; }
  get avgMonthlyCost(): number   { return (this.summary && this.summary.total_cost_period && this.summary.months_included) ? Math.round(this.summary.total_cost_period / this.summary.months_included) : 0; }
  get highestCostSite(): string  { return (this.summary && this.summary.highest_cost_site) || '—'; }
  get highestCostAmt(): number   { return (this.summary && this.summary.highest_cost_amt)  || this.currentMonthCost; }
  get lowestCostSite(): string   { return (this.summary && this.summary.lowest_cost_site)  || '—'; }
  get lowestCostAmt(): number    { return (this.summary && this.summary.lowest_cost_amt)   || 0; }
  get annualSpendYtd(): number   { return (this.summary && this.summary.total_cost_period) || 0; }
  get forecastedAnnual(): number { return (this.summary && this.summary.forecasted_annual) || 0; }

  // ── Bill display ─────────────────────────────────────────────────────────
  billTaxesTotal(b: any): number { return b ? ((b.taxes || 0) + (b.fees || 0)) : 0; }
  billStatus(b: any): string { return b ? (b.is_paid ? 'Paid' : 'Pending') : '—'; }

  // ── Formatting ─────────────────────────────────────────────────────────────
  fmt(n: number): string {
    if (!n) { return '$0'; }
    if (n >= 1000000) { return '$' + (n / 1000000).toFixed(2) + 'M'; }
    if (n >= 1000)    { return '$' + Math.round(n / 1000) + 'K'; }
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  fmtNum(n: number): string {
    if (!n) { return '0'; }
    if (n >= 1000000) { return (n / 1000000).toFixed(2) + 'M'; }
    if (n >= 1000)    { return Math.round(n / 1000) + 'K'; }
    return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  pctSign(n: number): string { return (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }
  statusColor(s: string): string {
    if (s === 'Paid') { return '#00e676'; }
    if (s === 'Pending') { return '#ffd740'; }
    if (s === 'Overdue') { return '#ef5350'; }
    return '#546e7a';
  }
}
