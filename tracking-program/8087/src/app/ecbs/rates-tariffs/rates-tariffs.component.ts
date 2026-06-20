import { Component, OnInit } from '@angular/core';

// Real data — Ochsner Ortho Lafayette (project 13)
// Utility: Entergy Louisiana (ENLA)
// Tariff: LGS-D (Large General Service — Demand) — standard for this class of load
// Energy rate: $0.07764/kWh (from project.kwhRate)
// Demand charge: $14.50/kW (from savings_intelligence.demand_rate)
// PF: baseline avg 0.9465 — above 90% penalty threshold
// Location: Lafayette, LA  |  Voltage: 480V (transformer secondary)
// TOU schedule: not yet configured — contact Entergy for current TOU periods
// Fuel adjustment: included in the $0.07764 blended rate (not broken out separately yet)

@Component({
  selector: 'ecbs-rates-tariffs',
  templateUrl: './rates-tariffs.component.html',
  styleUrls: ['./rates-tariffs.component.scss'],
})
export class RatesTariffsComponent implements OnInit {

  activeTab = 'utility-rates';
  showCreateModal = false;
  selectedRate: any = null;

  // Real KPIs from DB / EM&V analysis.
  // Blended rate = $0.07764/kWh (from project record).
  // Demand charge = $14.50/kW (from savings engine).
  // Energy cost forecast = baseline kW × demand_rate × 12 + baseline kWh × kwh_rate
  //   ≈ 1192.4 kW × $14.50 × 12 + (1192.4 × 8760 × 0.55) kWh × $0.07764
  //   ≈ $207,479 demand + $273,800 energy ≈ ~$481K/year
  //   NOTE: exact forecast depends on metered data; using $0 until utility bills are imported.
  kpis = [
    { label: 'ENERGY RATE (BLENDED)', value: '$0.0776/kWh', change: 'From utility bill scan', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
    { label: 'DEMAND CHARGE', value: '$14.50/kW', change: 'From EM&V analysis', dir: 'neutral', color: '#29b6f6', icon: 'fa-bolt' },
    { label: 'ON-PEAK RATE', value: '—', change: 'TOU not configured', dir: 'neutral', color: '#ffd740', icon: 'fa-sun-o' },
    { label: 'OFF-PEAK RATE', value: '—', change: 'TOU not configured', dir: 'neutral', color: '#546e7a', icon: 'fa-moon-o' },
    { label: 'PF PENALTY THRESHOLD', value: '90%', change: 'Baseline PF: 0.9465 (above threshold)', dir: 'neutral', color: '#ff7043', icon: 'fa-tachometer' },
    { label: 'ANNUAL ENERGY COST (EST)', value: '—', change: 'Import utility bills to calculate', dir: 'neutral', color: '#ce93d8', icon: 'fa-line-chart' },
  ];

  // One real rate schedule entry for Ochsner / Entergy Louisiana.
  // TOU breakdown not yet available — add via "Create Rate" when Entergy bill is available.
  rateSchedules = [
    {
      id: 'ENLA-LGS-D-2025',
      utility: 'Entergy Louisiana',
      site: 'Ochsner Ortho Lafayette',
      effective: 'Oct 5, 2025',
      type: 'Demand',
      blendedRate: 0.07764,
      demandCharge: 14.50,
      status: 'Active',
      expiry: '—',
      currency: 'USD',
      desc: 'Large General Service — Demand (LGS-D)',
      tariff: 'LGS-D',
    },
  ];

  // TOU periods not yet configured. Entergy Louisiana LGS-D is primarily a demand-based
  // tariff; TOU periods vary by season and must be pulled from the utility bill.
  touPeriods: any[] = [];

  // Rate documents: upload tariff sheets here when available.
  rateDocuments: any[] = [];

  newRate = {
    id: '',
    utility: 'Entergy Louisiana',
    site: 'Ochsner Ortho Lafayette',
    type: 'Demand',
    blendedRate: null,
    demandCharge: null,
    effective: '',
    expiry: '',
  };

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
    this.newRate = {
      id: '',
      utility: 'Entergy Louisiana',
      site: 'Ochsner Ortho Lafayette',
      type: 'Demand',
      blendedRate: null,
      demandCharge: null,
      effective: '',
      expiry: '',
    };
  }

  ngOnInit() {
    this.selectedRate = this.rateSchedules.length > 0 ? this.rateSchedules[0] : null;
  }
}
