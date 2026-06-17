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
  loading = true;
  error: string = null;

  // KPI data
  annualSavings: any    = null;
  capacityData: any     = null;
  alarmSummary: any     = null;
  savingsData: any      = null;
  reportSummary: any    = null;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
  ) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.error = 'No project selected.'; this.loading = false; return; }
    this.projectId = p.id;
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const pid = this.projectId;

    // Alarm summary
    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.alarmSummary = r; },
      error: () => {}
    });

    // Capacity summary
    this.api.get(`/api/capacity/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.capacityData = r; },
      error: () => {}
    });

    // Savings intelligence
    this.api.get(`/api/savings/intelligence?project_id=${pid}`).subscribe({
      next: (r: any) => { this.savingsData = r?.latest || r; },
      error: () => {}
    });

    // Report summary
    this.api.get(`/api/reports/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.reportSummary = r; },
      error: () => {},
    });

    this.loading = false;
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

  get avgPowerFactor(): string {
    const v = this.savingsData?.current_avg_pf ?? this.savingsData?.current_power_factor;
    if (!v) return '—';
    return Number(v).toFixed(3);
  }

  get activeAlarms(): number {
    return this.alarmSummary?.active_alarms ?? 0;
  }

  get criticalAlarms(): number {
    return this.alarmSummary?.critical ?? 0;
  }
}
