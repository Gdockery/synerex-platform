import { Component, OnInit } from '@angular/core';

// Real data — Ochsner Ortho Lafayette (project 13)
// One active project. Contract value (totalCost) not entered — all cost fields show $0.
// ECBS savings: $4,139/year = $345/month.
// Start date: Oct 5, 2025. Install confirmed.

@Component({
  selector: 'ecbs-job-costing',
  templateUrl: './job-costing.component.html',
  styleUrls: ['./job-costing.component.scss'],
})
export class JobCostingComponent implements OnInit {

  activeTab = 'all';
  showAddModal = false;

  // KPIs: totalCost = $0 until contract value is entered.
  // Margin = gross profit / revenue — cannot compute without both values.
  // ECBS cost savings = $345 MTD (real, EM&V verified).
  kpis = [
    { label: 'TOTAL JOBS', value: '1', change: '1 active project', dir: 'neutral', color: '#29b6f6' },
    { label: 'TOTAL CONTRACT VALUE', value: '$0', change: 'Enter contract value', dir: 'neutral', color: '#ce93d8' },
    { label: 'GROSS MARGIN', value: '—', change: 'Enter project cost', dir: 'neutral', color: '#00e676' },
    { label: 'OVER-BUDGET JOBS', value: '0', change: '', dir: 'neutral', color: '#ef5350' },
    { label: 'AVG COST PER JOB', value: '$0', change: 'Enter contract value', dir: 'neutral', color: '#ffd740' },
    { label: 'ECBS COST SAVINGS (MTD)', value: '$345', change: 'EM&V verified', dir: 'up', color: '#4caf50' },
  ];

  // One real job — Ochsner Ortho Lafayette.
  // Budget = contract value (not entered). Actual = costs incurred (not entered).
  // ROI: deferred capital value / project cost — requires project cost to be entered.
  jobs = [
    {
      id: 'JOB-2025-001',
      name: 'Ochsner Ortho Lafayette — ECBS Install & EM&V',
      customer: 'Ochsner Health System',
      budget: 0,        // Enter contract value
      actual: 0,        // Enter costs incurred
      margin: 0,        // Gross margin = (budget - actual) / budget × 100
      status: 'Active',
      startDate: 'Oct 5, 2025',
      endDate: '—',
      notes: 'EM&V verified. Annual savings: $4,139. Project cost not yet entered.',
    },
  ];

  newJob = { name: '', customer: '', budget: null, startDate: '', endDate: '', notes: '' };
  selectedJob: any = null;

  get filteredJobs() {
    if (this.activeTab === 'all') { return this.jobs; }
    return this.jobs.filter(j => j.status.toLowerCase().replace(' ', '-') === this.activeTab);
  }

  statusColor(status: string): string {
    const m = {
      'Active': '#29b6f6',
      'Completed': '#00e676',
      'In Progress': '#29b6f6',
      'Over Budget': '#ef5350',
      'Planned': '#ffd740',
    };
    return m[status] || '#546e7a';
  }

  // budgetPct: actual spend as % of budget. Returns 0 when either is not entered.
  budgetPct(job: any): number {
    if (!job.budget || !job.actual) { return 0; }
    return Math.min(100, Math.round((job.actual / job.budget) * 100));
  }

  // marginDisplay: shows computed margin or "—" when cost not entered.
  marginDisplay(job: any): string {
    if (!job.budget) { return '—'; }
    if (!job.actual) { return '—'; }
    return job.margin.toFixed(1) + '%';
  }

  selectJob(j: any) { this.selectedJob = j; }

  saveNewJob() {
    const num = this.jobs.length + 1;
    const padded = num < 10 ? '00' + num : num < 100 ? '0' + num : '' + num;
    const j = { ...this.newJob, id: 'JOB-2025-' + padded, actual: 0, margin: 0, status: 'Planned', notes: '' };
    this.jobs.unshift(j as any);
    this.showAddModal = false;
    this.newJob = { name: '', customer: '', budget: null, startDate: '', endDate: '', notes: '' };
  }

  ngOnInit() { this.selectedJob = this.jobs[0]; }
}
