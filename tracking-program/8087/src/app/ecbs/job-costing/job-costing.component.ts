import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ecbs-job-costing',
  templateUrl: './job-costing.component.html',
  styleUrls: ['./job-costing.component.scss'],
})
export class JobCostingComponent implements OnInit {

  activeTab = 'all';
  showAddModal = false;

  kpis = [
    { label: 'TOTAL JOBS (MTD)', value: '24', change: '+3', dir: 'up', color: '#29b6f6' },
    { label: 'TOTAL COST (MTD)', value: '$2.41M', change: '+8.2%', dir: 'up', color: '#ce93d8' },
    { label: 'GROSS MARGIN', value: '31.4%', change: '+1.8%', dir: 'up', color: '#00e676' },
    { label: 'OVER-BUDGET JOBS', value: '2', change: '-1', dir: 'down', color: '#ef5350' },
    { label: 'AVG COST PER JOB', value: '$100.5K', change: '+4.1%', dir: 'up', color: '#ffd740' },
    { label: 'ECBS COST SAVINGS', value: '$32,910', change: '+22.7%', dir: 'up', color: '#4caf50' },
  ];

  jobs = [
    { id: 'JOB-2025-001', name: 'Ochsner Ortho Lafayette — ECBS Install', customer: 'Ochsner Health', budget: 250000, actual: 241500, margin: 28.3, status: 'Completed', startDate: 'Jan 15, 2025', endDate: 'Mar 22, 2025' },
    { id: 'JOB-2025-002', name: 'Flex Tijuana — Power Filter Upgrade', customer: 'Flex Ltd.', budget: 180000, actual: 175200, margin: 33.1, status: 'Completed', startDate: 'Feb 1, 2025', endDate: 'Apr 5, 2025' },
    { id: 'JOB-2025-003', name: 'Tesla Inc. — Capacity Expansion Phase 1', customer: 'Tesla Inc.', budget: 320000, actual: 298700, margin: 30.4, status: 'In Progress', startDate: 'Mar 10, 2025', endDate: 'Jul 30, 2025' },
    { id: 'JOB-2025-004', name: 'Medtronic — Annual EM&V Verification', customer: 'Medtronic', budget: 85000, actual: 91200, margin: 18.7, status: 'Over Budget', startDate: 'Apr 1, 2025', endDate: 'Jun 15, 2025' },
    { id: 'JOB-2025-005', name: 'Apple Inc. — New Site Deployment', customer: 'Apple Inc.', budget: 420000, actual: 385000, margin: 35.2, status: 'In Progress', startDate: 'May 1, 2025', endDate: 'Sep 30, 2025' },
    { id: 'JOB-2025-006', name: 'Bosch — Digital Twin Scan', customer: 'Bosch', budget: 45000, actual: 42800, margin: 24.6, status: 'Completed', startDate: 'May 15, 2025', endDate: 'Jun 10, 2025' },
    { id: 'JOB-2025-007', name: 'Samsung — EM&V Baseline Study', customer: 'Samsung', budget: 68000, actual: 64300, margin: 26.1, status: 'Completed', startDate: 'Jun 1, 2025', endDate: 'Jun 18, 2025' },
    { id: 'JOB-2025-008', name: 'Nike — Site Assessment', customer: 'Nike', budget: 92000, actual: 0, margin: 0, status: 'Planned', startDate: 'Jul 1, 2025', endDate: 'Aug 15, 2025' },
  ];

  newJob = { name: '', customer: '', budget: null, startDate: '', endDate: '', notes: '' };
  selectedJob: any = null;

  get filteredJobs() {
    if (this.activeTab === 'all') { return this.jobs; }
    return this.jobs.filter(j => j.status.toLowerCase().replace(' ', '-') === this.activeTab);
  }

  statusColor(status: string): string {
    const m = { 'Completed': '#00e676', 'In Progress': '#29b6f6', 'Over Budget': '#ef5350', 'Planned': '#ffd740' };
    return m[status] || '#546e7a';
  }

  budgetPct(job: any): number {
    if (!job.budget || !job.actual) { return 0; }
    return Math.min(100, Math.round((job.actual / job.budget) * 100));
  }

  selectJob(j: any) { this.selectedJob = j; }

  saveNewJob() {
    const j = { ...this.newJob, id: 'JOB-2025-' + String(this.jobs.length + 1).padStart(3, '0'), actual: 0, margin: 0, status: 'Planned' };
    this.jobs.unshift(j as any);
    this.showAddModal = false;
    this.newJob = { name: '', customer: '', budget: null, startDate: '', endDate: '', notes: '' };
  }

  ngOnInit() { this.selectedJob = this.jobs[0]; }
}
