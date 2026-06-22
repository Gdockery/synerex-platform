import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

interface ReportRow {
  id: number;
  name: string;
  category: string;
  description: string;
  format: string;
  status: string;
  generated_at: number;
}

interface ScheduleRow {
  id: number;
  name: string;
  category: string;
  format: string;
  frequency: string;
  next_run_at: number;
  last_run_at: number;
  is_active: boolean;
  notify_emails: string;
}

interface CategoryCard {
  key: string;
  label: string;
  description: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'ecbs-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  projectId: number;
  loading = true;
  summaryLoading = true;
  activeTab = 'all';

  reports: ReportRow[] = [];
  scheduledReports: ScheduleRow[] = [];
  recentlyGenerated: ReportRow[] = [];

  totalGenerated  = 0;
  totalScheduled  = 0;
  totalDownloaded = 0;
  totalViews      = 0;

  categoryCards: CategoryCard[] = [
    { key: 'executive_summary',    label: 'Executive Summary',      description: 'High-level overview of performance, savings, and impact.',                  icon: 'fa-bar-chart',  count: 0 },
    { key: 'capacity_performance', label: 'Capacity & Performance', description: 'Capacity recovered, utilization, load profile, and performance analytics.', icon: 'fa-tachometer', count: 0 },
    { key: 'power_quality',        label: 'Power Quality',          description: 'Power quality metrics, trends, and compliance summary.',                     icon: 'fa-bolt',       count: 0 },
    { key: 'savings_financials',   label: 'Savings & Financials',   description: 'Energy savings, cost avoidance, ROI, and financial impact.',                 icon: 'fa-dollar',     count: 0 },
    { key: 'environmental_impact', label: 'Environmental Impact',   description: 'Carbon reduction, sustainability metrics, and environmental impact.',        icon: 'fa-leaf',       count: 0 },
    { key: 'alarms_events',        label: 'Alerts & Events',        description: 'Alarm summaries, event logs, and issue reports.',                            icon: 'fa-bell',       count: 0 },
  ];

  filterCategory = '';
  filterFormat   = '';
  searchQuery    = '';
  currentPage    = 1;
  pageSize       = 10;
  totalReports   = 0;

  readonly categoryLabels: {[k: string]: string} = {
    executive_summary:    'Executive Summary',
    capacity_performance: 'Capacity & Performance',
    power_quality:        'Power Quality',
    savings_financials:   'Savings & Financials',
    environmental_impact: 'Environmental Impact',
    alarms_events:        'Alerts & Events',
    custom:               'Custom Report',
  };

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user && this.userService.user.selectedProject;
    if (!p) { this.loading = false; this.summaryLoading = false; return; }
    this.projectId = p.id;
    this.loadSummary();
    this.loadReports();
    this.loadSchedules();
  }

  loadSummary() {
    this.summaryLoading = true;
    this.api.get('/api/reports/summary?project_id=' + this.projectId).subscribe({
      next: (r: any) => {
        this.totalGenerated  = r.total_reports     || 0;
        this.totalScheduled  = r.scheduled_reports || 0;
        this.totalDownloaded = r.downloads_total   || 0;
        this.totalViews      = r.views_total       || 0;
        this.recentlyGenerated = r.recently_generated || [];
        const byCategory = r.by_category || {};
        this.categoryCards.forEach(c => { c.count = byCategory[c.key] || 0; });
        this.summaryLoading = false;
      },
      error: () => { this.summaryLoading = false; }
    });
  }

  loadReports() {
    this.loading = true;
    let url = '/api/reports?project_id=' + this.projectId +
              '&limit=' + this.pageSize +
              '&offset=' + ((this.currentPage - 1) * this.pageSize);
    if (this.filterCategory) { url += '&category=' + this.filterCategory; }
    if (this.filterFormat)   { url += '&format='   + this.filterFormat; }
    if (this.activeTab === 'custom') { url += '&category=custom'; }
    this.api.get(url).subscribe({
      next: (r: any) => {
        this.reports = r.reports || (Array.isArray(r) ? r : []);
        this.totalReports = r.total || this.reports.length;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadSchedules() {
    this.api.get('/api/report-schedules?project_id=' + this.projectId).subscribe({
      next: (r: any) => {
        this.scheduledReports = Array.isArray(r) ? r : (r.schedules || []);
      },
      error: () => {}
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    if (tab !== 'scheduled') { this.loadReports(); }
  }

  selectCategory(key: string) {
    this.filterCategory = (this.filterCategory === key) ? '' : key;
    this.currentPage = 1;
    this.loadReports();
  }

  applyFilters() { this.currentPage = 1; this.loadReports(); }

  clearFilters() {
    this.filterCategory = '';
    this.filterFormat   = '';
    this.searchQuery    = '';
    this.currentPage    = 1;
    this.loadReports();
  }

  get visibleReports(): ReportRow[] {
    if (!this.searchQuery) { return this.reports; }
    const q = this.searchQuery.toLowerCase();
    return this.reports.filter(r =>
      ((r.name || '').toLowerCase().indexOf(q) !== -1) ||
      ((r.category || '').toLowerCase().indexOf(q) !== -1) ||
      ((r.description || '').toLowerCase().indexOf(q) !== -1)
    );
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalReports / this.pageSize)); }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end   = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) { pages.push(i); }
    return pages;
  }

  goPage(n: number) {
    if (n < 1 || n > this.totalPages) { return; }
    this.currentPage = n;
    this.loadReports();
  }

  downloadReport(report: ReportRow) {
    const base = ((window as any)['BOOTSTRAP_DATA'] || {})['apiBasePath'] || '';
    window.open(base + '/api/reports/' + report.id + '/download', '_blank');
  }

  formatLabel(f: string): string {
    const m: {[k: string]: string} = { pdf: 'PDF', excel: 'Excel', csv: 'CSV', json: 'JSON' };
    return m[f] || (f || '').toUpperCase();
  }

  formatDate(ms: number): string {
    if (!ms) { return '—'; }
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  nextRunLabel(ms: number): string {
    if (!ms) { return '—'; }
    const d = new Date(ms);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  statusClass(s: string): string {
    if (s === 'complete' || s === 'completed')  { return 'status-complete'; }
    if (s === 'failed'   || s === 'error')      { return 'status-failed'; }
    if (s === 'running'  || s === 'generating') { return 'status-running'; }
    return 'status-pending';
  }

  formatIcon(f: string): string {
    const m: {[k: string]: string} = { pdf: 'fa-file-pdf-o', excel: 'fa-file-excel-o', csv: 'fa-file-text-o', json: 'fa-file-code-o' };
    return m[f] || 'fa-file-o';
  }

  get activeScheduleCount(): number {
    return this.scheduledReports.filter(s => s.is_active).length;
  }

  frequencyLabel(f: string): string {
    const m: {[k: string]: string} = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual' };
    return m[f] || f || '—';
  }

  categoryLabel(key: string): string {
    return this.categoryLabels[key] || key;
  }
}
