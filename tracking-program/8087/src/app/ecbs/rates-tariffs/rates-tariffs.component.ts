import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ecbs-rates-tariffs',
  templateUrl: './rates-tariffs.component.html',
  styleUrls: ['./rates-tariffs.component.scss'],
})
export class RatesTariffsComponent implements OnInit {

  activeTab = 'utility-rates';
  showCreateModal = false;
  selectedRate: any = null;

  kpis = [
    { label: 'EFFECTIVE RATE (BLENDED)', value: '$0.128/kWh', change: '+4.2%', dir: 'up', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'DEMAND CHARGE', value: '$14.80/kW', change: '+2.1%', dir: 'up', color: '#29b6f6', icon: 'fa-bolt' },
    { label: 'ON-PEAK RATE', value: '$0.176/kWh', change: '+3.8%', dir: 'up', color: '#ffd740', icon: 'fa-sun-o' },
    { label: 'OFF-PEAK RATE', value: '$0.082/kWh', change: '-5.6%', dir: 'down', color: '#546e7a', icon: 'fa-moon-o' },
    { label: 'PF PENALTY THRESHOLD', value: '90%', change: 'No Change', dir: 'neutral', color: '#ff7043', icon: 'fa-tachometer' },
    { label: 'ENERGY COST FORECAST', value: '$678K', change: '+6.3%', dir: 'up', color: '#ce93d8', icon: 'fa-line-chart' },
  ];

  rateSchedules = [
    { id: 'GSD-TOU-2025', utility: 'Greenleaf SDG&E', site: 'Flex Tijuana', effective: 'Jan 1, 2025', type: 'TOU', blendedRate: 0.128, demandCharge: 14.80, status: 'Active', expiry: 'Dec 31, 2025', currency: 'USD', desc: 'General Service — TOU', tariff: 'General Service — TOU' },
    { id: 'GSD-TOU-NORTH', utility: 'Greenleaf SDG&E', site: 'Flex Juarez North', effective: 'Jan 1, 2025', type: 'TOU', blendedRate: 0.134, demandCharge: 15.20, status: 'Active', expiry: 'Dec 31, 2025', currency: 'USD', desc: 'General Service North', tariff: 'General Service — TOU' },
    { id: 'CFE-GDMTH-2025', utility: 'CFE', site: 'Flex Mexicali', effective: 'Feb 1, 2025', type: 'Demand', blendedRate: 0.098, demandCharge: 13.60, status: 'Active', expiry: 'Jan 31, 2026', currency: 'USD', desc: 'CFE Industrial demand rate', tariff: 'GDMTH' },
    { id: 'VEC-TOU-2025', utility: 'Valley Electric Coop', site: 'Flex Hermosillo', effective: 'Jan 1, 2025', type: 'TOU', blendedRate: 0.121, demandCharge: 13.40, status: 'Active', expiry: 'Dec 31, 2025', currency: 'USD', desc: 'Cooperative TOU schedule', tariff: 'General Service — TOU' },
    { id: 'SDG&E-GS-1', utility: 'Greenleaf SDG&E', site: 'Flex Guadalajara', effective: 'Jan 1, 2025', type: 'Flat', blendedRate: 0.109, demandCharge: 11.90, status: 'Active', expiry: 'Dec 31, 2025', currency: 'USD', desc: 'Flat rate schedule', tariff: 'General Service' },
    { id: 'CFE-GDMTH-OLD', utility: 'CFE', site: 'Flex Mexicali', effective: 'Jan 1, 2024', type: 'Demand', blendedRate: 0.112, demandCharge: 14.30, status: 'Expired', expiry: 'Jan 31, 2025', currency: 'USD', desc: 'Previous CFE demand rate', tariff: 'GDMTH' },
  ];

  touPeriods = [
    { period: 'Off-Peak', start: '12:00 AM', end: '6:00 AM', rate: 0.082, color: '#546e7a' },
    { period: 'Mid-Peak', start: '6:00 AM', end: '10:00 AM', rate: 0.132, color: '#ffd740' },
    { period: 'On-Peak', start: '10:00 AM', end: '6:00 PM', rate: 0.176, color: '#ef5350' },
    { period: 'Mid-Peak', start: '6:00 PM', end: '10:00 PM', rate: 0.132, color: '#ffd740' },
    { period: 'Off-Peak', start: '10:00 PM', end: '12:00 AM', rate: 0.082, color: '#546e7a' },
  ];

  rateDocuments = [
    { name: 'GSD-TOU-2025 Tariff Sheet', date: 'Jan 1, 2025', icon: 'fa-file-pdf-o' },
    { name: 'Rate Schedule Agreement', date: 'Dec 18, 2024', icon: 'fa-file-text-o' },
    { name: 'TOU Period Definitions', date: 'Jan 1, 2025', icon: 'fa-file-text-o' },
    { name: 'Demand Charge Rules', date: 'Jan 1, 2025', icon: 'fa-file-text-o' },
    { name: 'PF Penalty Calculation', date: 'Jan 1, 2025', icon: 'fa-calculator' },
  ];

  newRate = { id: '', utility: '', site: '', type: 'TOU', blendedRate: null, demandCharge: null, effective: '', expiry: '' };

  typeColor(t: string): string {
    return t === 'TOU' ? '#29b6f6' : t === 'Demand' ? '#ffd740' : '#00e676';
  }

  statusColor(s: string): string {
    return s === 'Active' ? '#00e676' : '#ef5350';
  }

  selectRate(r: any) { this.selectedRate = r; }

  saveRate() {
    this.rateSchedules.unshift({ ...this.newRate, status: 'Active', currency: 'USD', desc: '', tariff: '' } as any);
    this.showCreateModal = false;
    this.newRate = { id: '', utility: '', site: '', type: 'TOU', blendedRate: null, demandCharge: null, effective: '', expiry: '' };
  }

  ngOnInit() { this.selectedRate = this.rateSchedules[0]; }
}
