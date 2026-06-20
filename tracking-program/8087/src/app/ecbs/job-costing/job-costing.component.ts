import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-job-costing',
  templateUrl: './job-costing.component.html',
  styleUrls: ['./job-costing.component.scss'],
})
export class JobCostingComponent implements OnInit {

  activeTab = 'all';
  showAddModal = false;
  loading = true;
  projectId: number;
  projectName = '';

  // Raw API responses
  savingsData: any = null;
  roiData: any = null;

  // Job list — populated from real project. Manually-entered jobs added via modal.
  jobs: any[] = [];
  newJob = { name: '', customer: '', budget: null, startDate: '', endDate: '', notes: '' };
  selectedJob: any = null;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
  ) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';

    this.api.get(`/api/savings/intelligence?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        this.savingsData = r;
        this.loading = false;
        this._buildJobsFromProject(p);
      },
      error: () => { this.loading = false; this._buildJobsFromProject(p); },
    });
    this.api.get(`/api/roi?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.roiData = r?.data || r; this._buildJobsFromProject(p); },
      error: () => {},
    });
  }

  private _buildJobsFromProject(p: any) {
    if (this.jobs.length) { return; } // Already built
    const cost = this.projectCost;
    this.jobs = [{
      id: 'JOB-' + this.projectId + '-001',
      name: this.projectName + ' — ECBS Install & EM&V',
      customer: (p.client && typeof p.client === 'object') ? p.client.name : (p.client || 'Client'),
      budget: cost || 0,
      actual: 0,    // Actual costs — enter as incurred
      margin: 0,    // Gross margin = (budget − actual) / budget
      status: 'Active',
      startDate: p.startDate || '—',
      endDate: '—',
      notes: this.annualSavings
        ? ('EM&V verified. Annual savings: $' + Math.round(this.annualSavings).toLocaleString() + '/yr.')
        : '',
    }];
    if (!this.selectedJob) { this.selectedJob = this.jobs[0]; }
  }

  // ── Computed values from API ────────────────────────────────────────────────

  get annualSavings(): number { return this.savingsData?.annual_savings || 0; }
  get mtdSavings(): number   { return Math.round(this.annualSavings / 12); }
  get projectCost(): number  { return this.roiData?.project_cost || 0; }
  get roi(): number          { return this.roiData?.roi || 0; }
  get payback(): number      { return this.roiData?.payback || 0; }

  get kpis() {
    const cost = this.projectCost;
    return [
      { label: 'TOTAL JOBS', value: String(this.jobs.length), change: '', dir: 'neutral', color: '#29b6f6' },
      { label: 'CONTRACT VALUE', value: cost ? '$' + cost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—', change: cost ? 'From project record' : 'Not entered', dir: 'neutral', color: '#ce93d8' },
      { label: 'ROI', value: this.roi ? this.roi.toFixed(1) + '%' : '—', change: this.payback ? 'Payback ' + this.payback.toFixed(1) + ' yrs' : '', dir: this.roi > 0 ? 'up' : 'neutral', color: '#00e676' },
      { label: 'OVER-BUDGET JOBS', value: '0', change: '', dir: 'neutral', color: '#ef5350' },
      { label: 'ECBS SAVINGS (MTD)', value: this.mtdSavings ? '$' + this.mtdSavings.toLocaleString() : '—', change: 'EM&V verified', dir: this.mtdSavings > 0 ? 'up' : 'neutral', color: '#4caf50' },
      { label: 'ANNUAL SAVINGS', value: this.annualSavings ? '$' + Math.round(this.annualSavings).toLocaleString() : '—', change: '', dir: this.annualSavings > 0 ? 'up' : 'neutral', color: '#ffd740' },
    ];
  }

  get filteredJobs() {
    if (this.activeTab === 'all') { return this.jobs; }
    return this.jobs.filter(j => j.status.toLowerCase().replace(' ', '-') === this.activeTab);
  }

  statusColor(status: string): string {
    const m = { 'Active': '#29b6f6', 'Completed': '#00e676', 'In Progress': '#29b6f6', 'Over Budget': '#ef5350', 'Planned': '#ffd740' };
    return m[status] || '#546e7a';
  }

  budgetPct(job: any): number {
    if (!job.budget || !job.actual) { return 0; }
    return Math.min(100, Math.round((job.actual / job.budget) * 100));
  }

  marginDisplay(job: any): string {
    if (!job.budget || !job.actual) { return '—'; }
    const m = ((job.budget - job.actual) / job.budget) * 100;
    return m.toFixed(1) + '%';
  }

  selectJob(j: any) { this.selectedJob = j; }

  saveNewJob() {
    const num = this.jobs.length + 1;
    const padded = num < 10 ? '00' + num : num < 100 ? '0' + num : '' + num;
    const j = { ...this.newJob, id: 'JOB-' + this.projectId + '-' + padded, actual: 0, margin: 0, status: 'Planned', notes: '' };
    this.jobs.unshift(j as any);
    this.showAddModal = false;
    this.newJob = { name: '', customer: '', budget: null, startDate: '', endDate: '', notes: '' };
  }
}
