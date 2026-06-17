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
  generating = false;
  reportType = 'executive';
  format = 'excel';

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
  }

  generateReport() {
    this.generating = true;
    this.api.post('/api/reports/generate', {
      project_id: this.projectId,
      report_type: this.reportType,
      format: this.format,
    }).subscribe({
      next: () => { this.generating = false; this.loadReports(); },
      error: () => { this.generating = false; }
    });
  }

  statusClass(s: string): string {
    if (s === 'complete' || s === 'completed') return 'badge-healthy';
    if (s === 'failed' || s === 'error') return 'badge-critical';
    if (s === 'pending' || s === 'generating') return 'badge-warning';
    return 'badge-offline';
  }
}
