import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  projectId: number;
  loading = true;
  reports: any[] = [];
  scheduledReports: any[] = [];
  generating = false;
  generateMsg = '';
  reportType = 'executive';
  format = 'excel';
  dateRange = '30d';

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadReports();
  }

  loadReports() {
    this.api.get(`/api/reports?project_id=${this.projectId}&limit=20`).subscribe({
      next: (r: any) => { this.reports = r?.reports || r || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/reports/scheduled?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.scheduledReports = r?.schedules || r || []; }, error: () => {}
    });
  }

  generateReport() {
    this.generating = true;
    this.api.post('/api/reports/generate', {
      project_id: this.projectId,
      report_type: this.reportType,
      format: this.format,
      date_range: this.dateRange,
    }).subscribe({
      next: () => { this.generating = false; this.generateMsg = 'Report queued — will appear in catalog when ready.'; setTimeout(() => { this.generateMsg = ''; }, 5000); this.loadReports(); },
      error: () => { this.generating = false; this.generateMsg = 'Failed to generate report.'; }
    });
  }

  addSampleSchedules() {
    this.scheduledReports = [
      { name: 'Weekly Executive Summary', frequency: 'Weekly (Monday)', format: 'pdf',   nextRun: 'Next Monday 07:00', recipients: 'management@client.com', enabled: true },
      { name: 'Monthly Savings Report',   frequency: 'Monthly (1st)',   format: 'excel', nextRun: '1st of next month',  recipients: 'finance@client.com',    enabled: true },
      { name: 'Daily Alarm Report',       frequency: 'Daily (06:00)',   format: 'pdf',   nextRun: 'Tomorrow 06:00',     recipients: 'ops@client.com',        enabled: false },
    ];
  }

  statusClass(s: string): string {
    if (s === 'complete' || s === 'completed') return 'badge-healthy';
    if (s === 'failed' || s === 'error') return 'badge-critical';
    if (s === 'processing' || s === 'generating') return 'badge-warning';
    return 'badge-offline';
  }
}
