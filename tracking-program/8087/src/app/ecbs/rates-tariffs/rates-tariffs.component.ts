import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-rates-tariffs',
  templateUrl: './rates-tariffs.component.html',
  styleUrls: ['./rates-tariffs.component.scss'],
})
export class RatesTariffsComponent implements OnInit {

  activeTab = 'utility-rates';
  showCreateModal = false;
  selectedRate: any = null;
  loading = true;
  projectId: number;

  // Raw API response — rates come from savings_intelligence
  savingsData: any = null;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
  ) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;

    this.api.get(`/api/savings/intelligence?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        this.savingsData = r;
        this.loading = false;
        // Update the active rate schedule with live rate data
        this._updateRateSchedule();
      },
      error: () => { this.loading = false; },
    });
  }

  // ── Computed rate values from API ───────────────────────────────────────────

  // energy_rate and demand_rate are stored in savings_intelligence from the engine
  get energyRate(): number { return this.savingsData?.energy_rate || 0; }
  get demandRate(): number { return this.savingsData?.demand_rate || 0; }

  private fmt(n: number, decimals = 4): string {
    if (!n) return '—';
    return '$' + n.toFixed(decimals);
  }

  get kpis() {
    return [
      { label: 'ENERGY RATE (BLENDED)', value: this.energyRate ? '$' + this.energyRate.toFixed(4) + '/kWh' : '—', change: 'From project utility bill', dir: 'neutral', color: '#4caf50', icon: 'fa-dollar' },
      { label: 'DEMAND CHARGE', value: this.demandRate ? '$' + this.demandRate.toFixed(2) + '/kW' : '—', change: 'From EM&V analysis', dir: 'neutral', color: '#29b6f6', icon: 'fa-bolt' },
      { label: 'ON-PEAK RATE', value: '—', change: 'TOU not configured', dir: 'neutral', color: '#ffd740', icon: 'fa-sun-o' },
      { label: 'OFF-PEAK RATE', value: '—', change: 'TOU not configured', dir: 'neutral', color: '#546e7a', icon: 'fa-moon-o' },
      { label: 'PF PENALTY THRESHOLD', value: '90%', change: 'Standard Entergy Louisiana', dir: 'neutral', color: '#ff7043', icon: 'fa-tachometer' },
      { label: 'ANNUAL ENERGY COST (EST)', value: '—', change: 'Import utility bills to calculate', dir: 'neutral', color: '#ce93d8', icon: 'fa-line-chart' },
    ];
  }

  // One real rate schedule entry — amounts live-updated from API
  rateSchedules: any[] = [
    {
      id: 'ENLA-LGS-D',
      utility: 'Entergy Louisiana',
      site: '',          // Filled from selectedProject on load
      effective: '—',
      type: 'Demand',
      blendedRate: 0,    // Filled from API
      demandCharge: 0,   // Filled from API
      status: 'Active',
      expiry: '—',
      currency: 'USD',
      desc: 'Large General Service — Demand (LGS-D)',
      tariff: 'LGS-D',
    },
  ];

  private _updateRateSchedule() {
    const p = this.userService.user?.selectedProject;
    if (this.rateSchedules.length) {
      this.rateSchedules[0].blendedRate = this.energyRate;
      this.rateSchedules[0].demandCharge = this.demandRate;
      this.rateSchedules[0].site = p ? p.name : '';
      this.rateSchedules[0].effective = p && p.startDate ? p.startDate : '—';
    }
    if (!this.selectedRate) { this.selectedRate = this.rateSchedules[0]; }
  }

  // TOU periods not yet configured for this site
  touPeriods: any[] = [];

  // Rate documents — uploaded by user when available
  rateDocuments: any[] = [];

  newRate = {
    id: '',
    utility: 'Entergy Louisiana',
    site: '',
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
    const p = this.userService.user?.selectedProject;
    this.rateSchedules.unshift({
      ...this.newRate,
      site: p ? p.name : '',
      status: 'Active',
      currency: 'USD',
      desc: '',
      tariff: '',
    } as any);
    this.showCreateModal = false;
    this.newRate = { id: '', utility: 'Entergy Louisiana', site: '', type: 'Demand', blendedRate: null, demandCharge: null, effective: '', expiry: '' };
    this.selectedRate = this.rateSchedules[0];
  }
}
