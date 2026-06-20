import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Real data — Ochsner Ortho Lafayette (project 13)
// Annual ECBS savings: $4,139 (EM&V verified, Apr on vs May off)
// Monthly ECBS savings: $4,139 / 12 = $345
// Project cost: not entered (totalCost = 0)
// Invoices: none issued yet
// Payments: none received

@Component({
  selector: 'ecbs-financial-dashboard',
  templateUrl: './financial-dashboard.component.html',
  styleUrls: ['./financial-dashboard.component.scss'],
})
export class FinancialDashboardComponent implements OnInit {

  activeTab = 'overview';

  // Real KPIs — all financial values are $0 until invoices and payments are entered.
  // ECBS savings is the one real number derived from EM&V analysis.
  kpis = [
    { label: 'REVENUE (MTD)', value: '$0', change: 'No invoices issued', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'GROSS MARGIN (MTD)', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#29b6f6', icon: 'fa-percent' },
    { label: 'NET MARGIN (MTD)', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#ce93d8', icon: 'fa-percent' },
    { label: 'ECBS SAVINGS (MTD)', value: '$345', change: 'EM&V verified', dir: 'up', color: '#00e676', icon: 'fa-leaf' },
    { label: 'OUTSTANDING INVOICES', value: '$0', change: 'No invoices created', dir: 'neutral', color: '#ffd740', icon: 'fa-file-text-o' },
    { label: 'ON-TIME PAYMENTS', value: '—', change: 'No payments recorded', dir: 'neutral', color: '#ff7043', icon: 'fa-check-circle' },
  ];

  quickLinks = [
    { label: 'Financial Dashboard', icon: 'fa-th-large', route: '/ecbs/financial-dashboard', desc: 'Overview of all financial metrics' },
    { label: 'Job Costing', icon: 'fa-briefcase', route: '/ecbs/job-costing', desc: 'Track project costs and margins' },
    { label: 'Invoicing', icon: 'fa-file-text', route: '/ecbs/invoicing', desc: 'Manage and send invoices' },
    { label: 'Rates & Tariffs', icon: 'fa-bolt', route: '/ecbs/rates-tariffs', desc: 'Utility rates and TOU schedules' },
    { label: 'Payments', icon: 'fa-credit-card', route: '/ecbs/payments', desc: 'Track and reconcile payments' },
    { label: 'Profitability', icon: 'fa-line-chart', route: '/ecbs/profitability', desc: 'Margin and profitability analysis' },
  ];

  // No activity yet — will populate as invoices, payments, and jobs are entered
  recentActivity: any[] = [];

  constructor(private router: Router) {}
  ngOnInit() {}

  navigate(route: string) { this.router.navigate([route]); }
}
