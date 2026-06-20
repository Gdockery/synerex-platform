import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ecbs-financial-dashboard',
  templateUrl: './financial-dashboard.component.html',
  styleUrls: ['./financial-dashboard.component.scss'],
})
export class FinancialDashboardComponent implements OnInit {

  activeTab = 'overview';

  kpis = [
    { label: 'REVENUE (MTD)', value: '$14.2M', change: '+18.6%', dir: 'up', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'GROSS MARGIN (MTD)', value: '31.4%', change: '+3.8%', dir: 'up', color: '#29b6f6', icon: 'fa-percent' },
    { label: 'NET MARGIN (MTD)', value: '16.2%', change: '+2.1%', dir: 'up', color: '#ce93d8', icon: 'fa-percent' },
    { label: 'ECBS SAVINGS (MTD)', value: '$182,440', change: '+22.7%', dir: 'up', color: '#00e676', icon: 'fa-leaf' },
    { label: 'OUTSTANDING INVOICES', value: '$1.24M', change: '-12.6%', dir: 'down', color: '#ffd740', icon: 'fa-file-text-o' },
    { label: 'ON-TIME PAYMENTS', value: '92.4%', change: '+6.1%', dir: 'up', color: '#ff7043', icon: 'fa-check-circle' },
  ];

  quickLinks = [
    { label: 'Financial Dashboard', icon: 'fa-th-large', route: '/ecbs/financial-dashboard', desc: 'Overview of all financial metrics' },
    { label: 'Job Costing', icon: 'fa-briefcase', route: '/ecbs/job-costing', desc: 'Track project costs and margins' },
    { label: 'Invoicing', icon: 'fa-file-text', route: '/ecbs/invoicing', desc: 'Manage and send invoices' },
    { label: 'Rates & Tariffs', icon: 'fa-bolt', route: '/ecbs/rates-tariffs', desc: 'Utility rates and TOU schedules' },
    { label: 'Payments', icon: 'fa-credit-card', route: '/ecbs/payments', desc: 'Track and reconcile payments' },
    { label: 'Profitability', icon: 'fa-line-chart', route: '/ecbs/profitability', desc: 'Margin and profitability analysis' },
  ];

  recentActivity = [
    { type: 'payment', label: 'Payment received — Flex Ltd.', amount: '$184,500', date: 'Jun 19', badge: 'Matched', badgeColor: '#00e676' },
    { type: 'invoice', label: 'Invoice INV-1042 sent — Flex Ltd.', amount: '$184,500', date: 'Jun 18', badge: 'Sent', badgeColor: '#29b6f6' },
    { type: 'payment', label: 'Payment received — Tesla Inc.', amount: '$162,300', date: 'Jun 17', badge: 'Matched', badgeColor: '#00e676' },
    { type: 'invoice', label: 'Invoice INV-1041 sent — Tesla Inc.', amount: '$162,300', date: 'Jun 16', badge: 'Sent', badgeColor: '#29b6f6' },
    { type: 'alert', label: 'Rate schedule GSD-TOU-2025 active', amount: '$0.128/kWh', date: 'Jun 15', badge: 'Active', badgeColor: '#00e676' },
    { type: 'payment', label: 'Payment partially matched — Bosch', amount: '$86,200', date: 'Jun 15', badge: 'Partial', badgeColor: '#ffd740' },
  ];

  constructor(private router: Router) {}
  ngOnInit() {}

  navigate(route: string) { this.router.navigate([route]); }
}
