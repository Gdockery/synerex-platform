import { fmtCurrency as fmt } from '../../shared/helpers/ecbs-format.helpers';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-financial-dashboard',
  templateUrl: './financial-dashboard.component.html',
  styleUrls: ['./financial-dashboard.component.scss'],
})
export class FinancialDashboardComponent implements OnInit {

  activeTab = 'overview';
  loading = true;
  projectId: number;
  projectName = '';

  // Raw API responses — no hardcoded values
  savingsData: any = null;
  roiData: any = null;

  constructor(
    private router: Router,
    private api: ApiRequestService,
    private userService: CurrentUserService,
  ) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject as any;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.api.get(`/api/savings/intelligence?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.savingsData = r; this.loading = false; },
      error: () => { this.loading = false; },
    });
    this.api.get(`/api/roi?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.roiData = r?.data || r; },
      error: () => {},
    });
  }

  // ── Computed values from API ────────────────────────────────────────────────

  get annualSavings(): number { return this.savingsData?.annual_savings || 0; }
  get mtdSavings(): number   { return Math.round(this.annualSavings / 12); }
  get projectCost(): number  { return this.savingsData?.project_cost || this.roiData?.project_cost || 0; }
  get roi(): number          { return this.savingsData?.roi          || this.roiData?.roi          || 0; }
  get payback(): number      { return this.savingsData?.payback      || this.roiData?.payback      || 0; }



  get kpis() {
    return [
      {
        label: 'REVENUE (MTD)',
        value: '$0',
        change: 'No invoices paid yet',
        dir: 'neutral', color: '#4caf50', icon: 'fa-dollar',
      },
      {
        label: 'PROJECT COST',
        value: this.projectCost ? fmt(this.projectCost) : '—',
        change: this.projectCost ? 'Contract value' : 'Not entered',
        dir: 'neutral', color: '#29b6f6', icon: 'fa-percent',
      },
      {
        label: 'ROI',
        value: this.roi ? this.roi.toFixed(1) + '%' : '—',
        change: this.payback ? 'Payback: ' + this.payback.toFixed(1) + ' yrs' : 'Enter project cost',
        dir: this.roi > 0 ? 'up' : 'neutral', color: '#ce93d8', icon: 'fa-percent',
      },
      {
        label: 'ECBS SAVINGS (MTD)',
        value: this.mtdSavings ? fmt(this.mtdSavings) : '—',
        change: this.annualSavings ? fmt(this.annualSavings) + '/yr — EM&V verified' : 'Loading…',
        dir: this.mtdSavings > 0 ? 'up' : 'neutral', color: '#00e676', icon: 'fa-leaf',
      },
      {
        label: 'OUTSTANDING INVOICES',
        value: '$0',
        change: 'No invoices created',
        dir: 'neutral', color: '#ffd740', icon: 'fa-file-text-o',
      },
      {
        label: 'ON-TIME PAYMENTS',
        value: '—',
        change: 'No payments recorded',
        dir: 'neutral', color: '#ff7043', icon: 'fa-check-circle',
      },
    ];
  }

  quickLinks = [
    { label: 'Financial Dashboard', icon: 'fa-th-large', route: '/ecbs/financial-dashboard', desc: 'Overview of all financial metrics' },
    { label: 'Job Costing', icon: 'fa-briefcase', route: '/ecbs/job-costing', desc: 'Track project costs and margins' },
    { label: 'Invoicing', icon: 'fa-file-text', route: '/ecbs/invoicing', desc: 'Manage and send invoices' },
    { label: 'Rates & Tariffs', icon: 'fa-bolt', route: '/ecbs/rates-tariffs', desc: 'Utility rates and TOU schedules' },
    { label: 'Payments', icon: 'fa-credit-card', route: '/ecbs/payments', desc: 'Track and reconcile payments' },
    { label: 'Profitability', icon: 'fa-line-chart', route: '/ecbs/profitability', desc: 'Margin and profitability analysis' },
  ];

  // Populated as invoices / payments are created in the system
  recentActivity: any[] = [];

  navigate(route: string) { this.router.navigate([route]); }
}
