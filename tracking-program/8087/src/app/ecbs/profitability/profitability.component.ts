import { Component, OnInit } from '@angular/core';

// Real data — Ochsner Ortho Lafayette (project 13)
// Client: Ochsner Health System
// Annual ECBS savings: $4,139 (EM&V verified)
// Monthly ECBS savings: $4,139 / 12 ≈ $345
// Revenue: $0 (no paid invoices)
// Project cost (contract value): $0 (not entered)
// Gross/Net margin: cannot compute without revenue and cost data
//
// ECBS Value Allocation (per spec):
//   allocatedJobs = ecbsSavings when job is active (100% until cost-split is configured)
//   operatingExpense = energy + demand savings component
//   deferredCapital = capacity value (deferred_capital_value from capacity_intelligence)
//     avg deferred_capital_value from DB: ~$4,500–$6,000/bucket → annualized ≈ ~$140K
//     but $0 project cost means ROI can't be computed
//
// Capacity recovery data (capacity_intelligence table, project 13):
//   avg recoverable_capacity: ~90 kVA (from DB rows)
//   avg deferred_capital_value: ~$5,000/15-min bucket, but this is per-bucket annualized
//   Installed capacity: 2,400 kVA (corrected transformer)

@Component({
  selector: 'ecbs-profitability',
  templateUrl: './profitability.component.html',
  styleUrls: ['./profitability.component.scss'],
})
export class ProfitabilityComponent implements OnInit {

  activeTab = 'executive';
  configureViewOpen = false;

  // KPIs: Revenue = $0 (no paid invoices). Margin = N/A. ECBS savings = real.
  kpis = [
    { label: 'TOTAL REVENUE (MTD)', value: '$0', change: 'No invoices paid', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'GROSS MARGIN (MTD)', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#29b6f6', icon: 'fa-percent' },
    { label: 'NET MARGIN (MTD)', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#ce93d8', icon: 'fa-percent' },
    { label: 'ECBS SAVINGS CONTRIBUTION™', value: '$345', change: 'EM&V verified ($4,139/yr)', dir: 'up', color: '#00e676', icon: 'fa-leaf' },
    { label: 'PROFIT IMPROVEMENT VS BASELINE', value: '—', change: 'Need revenue data', dir: 'neutral', color: '#ffd740', icon: 'fa-bar-chart' },
    { label: 'RETURN ON CAPITAL (LTM)', value: '—', change: 'Enter project cost for ROI', dir: 'neutral', color: '#ff7043', icon: 'fa-line-chart' },
  ];

  // One real customer. Revenue = $0 until invoices are paid.
  // ECBS savings = $345 MTD (real).
  customerData = [
    {
      rank: 1,
      name: 'Ochsner Health System',
      revenue: 0,        // $0 — no invoices paid
      grossMargin: 0,    // Gross margin = (revenue - cost) / revenue — requires revenue
      netMargin: 0,      // Net margin = net income / revenue — requires revenue
      ecbsSavings: 345,  // $345 MTD (real, EM&V verified)
      profitImprovement: 0, // Cannot compute without revenue
    },
  ];

  // One real site.
  siteData = [
    {
      rank: 1,
      name: 'Ochsner Ortho Lafayette',
      revenue: 0,        // $0 — no invoices paid
      netMargin: 0,
      ecbsSavings: 345,  // $345 MTD
      profitImprovement: 0,
    },
  ];

  // ECBS Value Creation breakdown (MTD):
  //   totalSavings = $345 (EM&V verified monthly)
  //   allocatedJobs: portion allocated to job cost savings. Set to $0 until project
  //     cost is entered and allocation is configured.
  //   operatingExpense: energy + demand savings = primary driver here = $345 MTD
  //   deferredCapital: capacity value recovery — calculated from DB but requires
  //     project cost to express as ROI. Shown as $0 until configured.
  //   profitImprovement: net margin uplift in dollars = $0 without revenue
  ecbsValue = {
    totalSavings: 345,
    allocatedJobs: 0,          // Enter project cost to allocate
    jobsPct: 0,
    operatingExpense: 345,     // 100% attributed to opex savings until split is configured
    opexPct: 100,
    deferredCapital: 0,        // Enter project cost to compute deferred capital ROI
    dcPct: 0,
    profitImprovement: 0,      // Cannot compute without revenue
  };

  // Capacity recovery (from capacity_intelligence table, project 13):
  //   avg recoverable_capacity ≈ 90 kVA (typical reading from live DB data)
  //   deferred capital value: requires project cost to compute
  capacityRecovery = {
    recovered: 90,              // kVA — avg recoverable capacity from DB
    deferredCapitalValue: 0,    // Enter project cost: recovered_kva / rated_kva × project_cost
    annualAvoidedDepreciation: 0, // Deferred capital value × depreciation rate
    impactOnNetProfit: 0,       // Requires revenue to express as profit impact
    roiOnCapacityRecovery: 0,   // ROI = deferred capital value / project cost × 100
  };

  // Trend chart: 7 weeks since install (Oct 5, 2025).
  // Revenue bars: all $0 (no invoices paid).
  // ECBS savings line: flat at ~$79/week ($345/month ÷ 4.33 weeks ≈ $80/week).
  // Margin lines: cannot render without revenue — shown as 0.
  trendDays = ['Oct 5', 'Oct 12', 'Oct 19', 'Oct 26', 'Nov 2', 'Nov 9', 'Nov 16'];
  revenueBars = [0, 0, 0, 0, 0, 0, 0];    // No revenue yet
  grossMarginLine = [0, 0, 0, 0, 0, 0, 0]; // Cannot compute
  netMarginLine   = [0, 0, 0, 0, 0, 0, 0]; // Cannot compute

  barH(v: number): number { return Math.round((v / 3) * 80); }
  barY(v: number): number { return 100 - this.barH(v); }
  lineY(v: number): number { return 100 - Math.round(((v - 10) / 30) * 80); }
  lineX(i: number): number { return 20 + i * 38; }

  ngOnInit() {}
}
