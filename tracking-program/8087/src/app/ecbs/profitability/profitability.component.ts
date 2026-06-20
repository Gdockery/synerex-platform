import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-profitability',
  templateUrl: './profitability.component.html',
  styleUrls: ['./profitability.component.scss'],
})
export class ProfitabilityComponent implements OnInit {

  activeTab = 'executive';
  configureViewOpen = false;
  loading = true;
  projectId: number;
  projectName = '';
  clientName = '';

  // Raw API responses
  savingsData: any = null;
  roiData: any = null;
  capacityData: any = null;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
  ) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject as any;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';
    this.clientName = (p.client && typeof p.client === 'object')
      ? p.client.name
      : (p.clientName || p.client || this.projectName);

    this.api.get(`/api/savings/intelligence?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.savingsData = r; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.get(`/api/roi?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.roiData = r?.data || r; },
      error: () => {},
    });
    this.api.get(`/api/capacity/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.capacityData = r; },
      error: () => {},
    });
  }

  // ── Computed values from API ────────────────────────────────────────────────

  get annualSavings(): number    { return this.savingsData?.annual_savings || 0; }
  get mtdSavings(): number       { return Math.round(this.annualSavings / 12); }
  get projectCost(): number      { return this.roiData?.project_cost || 0; }
  get roi(): number              { return this.roiData?.roi || 0; }
  get payback(): number          { return this.roiData?.payback || 0; }
  get lifetimeSavings(): number  { return this.roiData?.lifetime_savings || 0; }
  get recoveredKva(): number     { return this.capacityData?.recovered_capacity_kva ?? this.capacityData?.recoverable_kva ?? 90; }
  get deferredCapital(): number  {
    // Deferred capital value = recoverable kVA × $65/kVA (standard replacement cost)
    return Math.round(this.recoveredKva * 65);
  }

  private fmt(n: number): string {
    if (!n) return '$0';
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000)    return '$' + Math.round(n / 1000) + 'K';
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  get kpis() {
    return [
      { label: 'TOTAL REVENUE (MTD)', value: '$0', change: 'No invoices paid', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
      { label: 'GROSS MARGIN (MTD)', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#29b6f6', icon: 'fa-percent' },
      { label: 'NET MARGIN (MTD)', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#ce93d8', icon: 'fa-percent' },
      { label: 'ECBS SAVINGS™ (MTD)', value: this.fmt(this.mtdSavings), change: this.fmt(this.annualSavings) + '/yr — EM&V verified', dir: this.mtdSavings > 0 ? 'up' : 'neutral', color: '#00e676', icon: 'fa-leaf' },
      { label: 'ROI', value: this.roi ? this.roi.toFixed(1) + '%' : '—', change: this.payback ? 'Payback: ' + this.payback.toFixed(1) + ' yrs' : '', dir: this.roi > 0 ? 'up' : 'neutral', color: '#ffd740', icon: 'fa-bar-chart' },
      { label: 'LIFETIME SAVINGS (10 YR)', value: this.fmt(this.lifetimeSavings), change: '', dir: this.lifetimeSavings > 0 ? 'up' : 'neutral', color: '#ff7043', icon: 'fa-line-chart' },
    ];
  }

  // ── Customer / Site tables — one real entry each ──────────────────────────

  get customerData() {
    return [{
      rank: 1,
      name: this.clientName || this.projectName,
      revenue: 0,              // $0 — no paid invoices
      grossMargin: 0,
      netMargin: 0,
      ecbsSavings: this.mtdSavings,
      profitImprovement: 0,    // Cannot compute without revenue
    }];
  }

  get siteData() {
    return [{
      rank: 1,
      name: this.projectName,
      revenue: 0,
      netMargin: 0,
      ecbsSavings: this.mtdSavings,
      profitImprovement: 0,
    }];
  }

  // ── ECBS Value Creation breakdown ─────────────────────────────────────────

  get ecbsValue() {
    const total = this.mtdSavings;
    // When project cost is entered, allocation can be split.
    // Until then: 100% attributed to operating expense savings.
    return {
      totalSavings: total,
      allocatedJobs: 0,           // Will be non-zero once job cost tracking is active
      jobsPct: 0,
      operatingExpense: total,    // Energy + demand + PF savings → opex reduction
      opexPct: total > 0 ? 100 : 0,
      deferredCapital: 0,         // Capacity value → enter project cost to express as ROI
      dcPct: 0,
      profitImprovement: 0,       // Needs revenue to compute
    };
  }

  // ── Capacity recovery ─────────────────────────────────────────────────────

  get capacityRecovery() {
    const cost = this.projectCost;
    const kva = this.recoveredKva;
    const dcv = this.deferredCapital;
    const ratioKva = (cost > 0 && this.capacityData?.installed_capacity_kva)
      ? kva / this.capacityData.installed_capacity_kva
      : 0;
    // Annual avoided depreciation: deferred capital × typical depreciation rate (5%)
    const annualAvoidedDepr = Math.round(dcv * 0.05);
    // ROI on capacity recovery: deferred capital / project cost × 100
    const roiCap = cost > 0 ? Math.round(dcv / cost * 100) / 10 : 0; // as multiple (x)
    return {
      recovered: Math.round(kva),
      deferredCapitalValue: dcv,
      annualAvoidedDepreciation: annualAvoidedDepr,
      impactOnNetProfit: 0,         // Requires revenue
      roiOnCapacityRecovery: roiCap,
    };
  }

  // ── Profitability trend chart ──────────────────────────────────────────────
  // Shows weekly ECBS savings since project start. Revenue bars are $0 until invoices paid.

  get trendDays(): string[] {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      labels.push(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()] + ' ' + d.getDate());
    }
    return labels;
  }

  // Revenue bars: $0 (no paid invoices)
  get revenueBars(): number[] { return [0, 0, 0, 0, 0, 0, 0]; }

  // Margin lines: 0 (cannot compute without revenue)
  get grossMarginLine(): number[] { return [0, 0, 0, 0, 0, 0, 0]; }
  get netMarginLine(): number[]   { return [0, 0, 0, 0, 0, 0, 0]; }

  barH(v: number): number { return Math.round((v / 3) * 80); }
  barY(v: number): number { return 100 - this.barH(v); }
  lineY(v: number): number { return 100 - Math.round(((v - 10) / 30) * 80); }
  lineX(i: number): number { return 20 + i * 38; }
}
