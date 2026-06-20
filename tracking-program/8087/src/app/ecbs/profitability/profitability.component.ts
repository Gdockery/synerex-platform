import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ecbs-profitability',
  templateUrl: './profitability.component.html',
  styleUrls: ['./profitability.component.scss'],
})
export class ProfitabilityComponent implements OnInit {

  activeTab = 'executive';
  configureViewOpen = false;

  kpis = [
    { label: 'TOTAL REVENUE (MTD)', value: '$14.20M', change: '+18.6%', dir: 'up', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'GROSS MARGIN (MTD)', value: '31.4%', change: '+3.8%', dir: 'up', color: '#29b6f6', icon: 'fa-percent' },
    { label: 'NET MARGIN (MTD)', value: '16.2%', change: '+2.1%', dir: 'up', color: '#ce93d8', icon: 'fa-percent' },
    { label: 'ECBS SAVINGS CONTRIBUTION™', value: '$182,440', change: '+22.7%', dir: 'up', color: '#00e676', icon: 'fa-leaf' },
    { label: 'PROFIT IMPROVEMENT VS BASELINE', value: '23.4%', change: '+4.6% vs Baseline', dir: 'up', color: '#ffd740', icon: 'fa-bar-chart' },
    { label: 'RETURN ON CAPITAL (LTM)', value: '28.7%', change: '+3.9%', dir: 'up', color: '#ff7043', icon: 'fa-line-chart' },
  ];

  customerData = [
    { rank: 1, name: 'Flex', revenue: 4280000, grossMargin: 33.6, netMargin: 17.8, ecbsSavings: 54820, profitImprovement: 25.1 },
    { rank: 2, name: 'Tesla', revenue: 3210000, grossMargin: 30.1, netMargin: 15.2, ecbsSavings: 38640, profitImprovement: 24.2 },
    { rank: 3, name: 'Apple', revenue: 2450000, grossMargin: 32.8, netMargin: 17.1, ecbsSavings: 31220, profitImprovement: 24.2 },
    { rank: 4, name: 'Medtronic', revenue: 1280000, grossMargin: 28.3, netMargin: 13.5, ecbsSavings: 22140, profitImprovement: 19.6 },
    { rank: 5, name: 'Bosch', revenue: 980000, grossMargin: 27.6, netMargin: 12.1, ecbsSavings: 15210, profitImprovement: 17.3 },
    { rank: 6, name: 'Samsung', revenue: 760000, grossMargin: 25.9, netMargin: 11.5, ecbsSavings: 10680, profitImprovement: 15.9 },
    { rank: 7, name: 'Nike', revenue: 540000, grossMargin: 24.2, netMargin: 10.3, ecbsSavings: 9730, profitImprovement: 14.7 },
    { rank: 8, name: 'Other', revenue: 720000, grossMargin: 26.4, netMargin: 11.9, ecbsSavings: 0, profitImprovement: 16.5 },
  ];

  siteData = [
    { rank: 1, name: 'Flex Tijuana', revenue: 6120000, netMargin: 17.1, ecbsSavings: 78450, profitImprovement: 24.6 },
    { rank: 2, name: 'Flex Juarez North', revenue: 2890000, netMargin: 15.8, ecbsSavings: 39220, profitImprovement: 22.3 },
    { rank: 3, name: 'Flex Juarez South', revenue: 1980000, netMargin: 16.2, ecbsSavings: 27310, profitImprovement: 20.8 },
    { rank: 4, name: 'Flex Hermosillo', revenue: 1760000, netMargin: 15.1, ecbsSavings: 23540, profitImprovement: 21.1 },
    { rank: 5, name: 'Flex Guadalajara', revenue: 1080000, netMargin: 13.2, ecbsSavings: 13920, profitImprovement: 18.9 },
    { rank: 6, name: 'Flex Mexicali', revenue: 480000, netMargin: 12.4, ecbsSavings: 5980, profitImprovement: 17.2 },
  ];

  ecbsValue = {
    totalSavings: 182440,
    allocatedJobs: 134620,
    jobsPct: 73.8,
    operatingExpense: 32910,
    opexPct: 18.0,
    deferredCapital: 14910,
    dcPct: 8.2,
    profitImprovement: 42440,
  };

  capacityRecovery = {
    recovered: 380,
    deferredCapitalValue: 190000,
    annualAvoidedDepreciation: 28500,
    impactOnNetProfit: 18900,
    roiOnCapacityRecovery: 4.8,
  };

  trendDays = ['May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17', 'May 18'];
  revenueBars = [1.1, 1.4, 1.6, 1.9, 2.1, 2.5, 2.6];
  grossMarginLine = [30, 31, 30.5, 31.5, 32, 31.8, 31.4];
  netMarginLine = [14, 15, 14.5, 15.5, 16, 16.2, 16.2];

  barH(v: number): number { return Math.round((v / 3) * 80); }
  barY(v: number): number { return 100 - this.barH(v); }
  lineY(v: number): number { return 100 - Math.round(((v - 10) / 30) * 80); }
  lineX(i: number): number { return 20 + i * 38; }

  ngOnInit() {}
}
