import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  projectId: number;
  siteName = '';
  loading = true;

  alarmSummary: any  = null;
  capacityData: any  = null;
  savingsData: any   = null;
  cbiData: any       = null;
  reportSummary: any = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.siteName = p.name || '';
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const pid = this.projectId;

    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.alarmSummary = r; }, error: () => {}});
    this.api.get(`/api/capacity/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.capacityData = r; this.loading = false; }, error: () => { this.loading = false; }});
    this.api.get(`/api/savings/intelligence?project_id=${pid}`).subscribe({ next: (r: any) => { this.savingsData = r?.latest || r; }, error: () => {}});
    this.api.get(`/api/current-balance/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.cbiData = r; }, error: () => {}});
    this.api.get(`/api/reports/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.reportSummary = r; }, error: () => {}});
  }

  get annualSavingsDisplay(): string {
    const v = this.savingsData?.annual_savings_est ?? this.savingsData?.annual_savings;
    if (!v) return '—';
    return '$' + Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  get capacityRecovered(): string {
    const v = this.capacityData?.recovered_capacity_kva ?? this.capacityData?.recoverable_kva;
    if (!v) return '—';
    return Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' kVA';
  }

  get pfValue(): number { return this.savingsData?.current_avg_pf ?? this.savingsData?.current_power_factor ?? 0; }
  get avgPowerFactor(): string {
    if (!this.pfValue) return '—';
    return this.pfValue.toFixed(3);
  }

  get cbiValue(): number { return this.cbiData?.score ?? this.cbiData?.cbi_score ?? 0; }
  get cbiScoreDisplay(): string { return this.cbiValue ? this.cbiValue.toFixed(0) : '—'; }

  get activeAlarms(): number { return this.alarmSummary?.active_alarms ?? (this.alarmSummary?.critical ?? 0) + (this.alarmSummary?.high ?? 0) + (this.alarmSummary?.medium ?? 0); }
  get criticalAlarms(): number { return this.alarmSummary?.critical ?? 0; }

  get cbiBreakdown(): { label: string; pct: number; color: string }[] {
    if (!this.cbiData) return [];
    return [
      { label: 'Productive', pct: this.cbiData.productive_current_pct || 0, color: '#00e676' },
      { label: 'Reactive',   pct: this.cbiData.reactive_current_pct || 0,  color: '#29b6f6' },
      { label: 'Harmonic',   pct: this.cbiData.harmonic_current_pct || 0,  color: '#ce93d8' },
      { label: 'Imbalance',  pct: this.cbiData.imbalance_pct || 0,         color: '#ffd740' },
      { label: 'Neutral',    pct: this.cbiData.neutral_current_pct || 0,   color: '#f44336' },
    ];
  }
}
