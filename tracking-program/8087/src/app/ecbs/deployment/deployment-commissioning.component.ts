import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-commissioning',
  templateUrl: './deployment-commissioning.component.html',
  styleUrls: ['./deployment-commissioning.component.scss'],
})
export class DeploymentCommissioningComponent implements OnInit {
  depId = 0;
  dep: any = null;
  devices: any[] = [];
  commData: any[] = [];   // commissioning records per device
  selected: any = null;  // selected device queue entry
  loading = true;
  syncedAt = '';

  // filters
  filterStatus = '';
  filterType = '';
  pageSize = 10;
  page = 1;

  // commissioning notes
  notes: string[] = [];

  // action states
  generatingReport = false;
  reportMsg = '';
  showHistoryPanel = false;
  showManualResultModal = false;
  manualResult: any = { label: '', value: '', notes: '' };
  savingManual = false;

  readonly WORKFLOW_STEPS = [
    { num: 1, label: 'Pre-Checks',       desc: 'Verify installation and CT orientation' },
    { num: 2, label: 'Power-Up',         desc: 'Energize device and confirm status' },
    { num: 3, label: 'Communications',   desc: 'Verify connectivity to gateway/network' },
    { num: 4, label: 'Functional Tests', desc: 'Run performance and protection tests' },
    { num: 5, label: 'Data Validation',  desc: 'Validate readings and parameters' },
    { num: 6, label: 'Finalize',         desc: 'Complete, save report, and close' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe((p: any) => {
      this.depId = +p['id'];
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }, error: () => {}
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/devices').subscribe({
      next: (r: any) => {
        const raw = r && r.response ? r.response : r;
        this.devices = Array.isArray(raw) ? raw : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/commissioning').subscribe({
      next: (r: any) => {
        const raw = r && r.response ? r.response : r;
        this.commData = Array.isArray(raw) ? raw : [];
      },
      error: () => {}
    });
  }

  // ── Header data ──────────────────────────────────────────────────────────
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }
  get voltage(): string { return (this.dep && this.dep.site_info && this.dep.site_info.service_voltage) || '—'; }

  // ── KPI data ─────────────────────────────────────────────────────────────
  get queueItems(): any[] {
    // Merge device list with commissioning records
    return this.devices.map(d => {
      const commArr = this.commData.filter((c: any) => c.device_id === d.id);
      const comm = commArr.length ? commArr[0] : {};
      return { ...d, ...comm, _device: d };
    });
  }

  get commissionedCount(): number { return this.queueItems.filter(d => this.commStatus(d) === 'Commissioned').length; }
  get inProgressCount(): number  { return this.queueItems.filter(d => this.commStatus(d) === 'In Progress').length; }
  get pendingCount(): number     { return this.queueItems.filter(d => this.commStatus(d) === 'Pending').length; }
  get failedCount(): number      { return this.queueItems.filter(d => this.commStatus(d) === 'Failed').length; }
  get total(): number            { return this.queueItems.length; }

  get commissionedPct(): number  { return this.total ? Math.round(this.commissionedCount / this.total * 100) : 0; }
  get inProgressPct(): number    { return this.total ? Math.round(this.inProgressCount / this.total * 100) : 0; }
  get pendingPct(): number       { return this.total ? Math.round(this.pendingCount / this.total * 100) : 0; }
  get failedPct(): number        { return this.total ? Math.round(this.failedCount / this.total * 100) : 0; }
  get readinessPct(): number     { return this.total ? Math.round((this.commissionedCount + this.inProgressCount * 0.5) / this.total * 100) : 0; }

  // SVG donut for readiness
  private readonly _circ = 2 * Math.PI * 45;
  get readinessOffset(): number { return this._circ * (1 - this.readinessPct / 100); }

  // ── Queue filtering ──────────────────────────────────────────────────────
  get filtered(): any[] {
    return this.queueItems.filter(d => {
      if (this.filterStatus && this.commStatus(d) !== this.filterStatus) return false;
      if (this.filterType && (d.device_type || '').toLowerCase() !== this.filterType.toLowerCase()) return false;
      return true;
    });
  }

  get paged(): any[] {
    const s = (this.page - 1) * this.pageSize;
    return this.filtered.slice(s, s + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }

  // ── Helpers ──────────────────────────────────────────────────────────────
  commStatus(d: any): string {
    if (d.commissioning_status) return d.commissioning_status;
    const s = (d.status || '').toLowerCase();
    if (s === 'commissioned') return 'Commissioned';
    if (s === 'in progress')  return 'In Progress';
    if (s === 'failed')       return 'Failed';
    return 'Pending';
  }

  commProgress(d: any): number {
    if (d.commissioning_progress !== undefined) return d.commissioning_progress;
    const s = this.commStatus(d);
    if (s === 'Commissioned') return 100;
    if (s === 'In Progress')  return 50;
    if (s === 'Failed')       return 25;
    return 0;
  }

  statusClass(s: string): string {
    const sl = (s || '').toLowerCase();
    if (sl === 'commissioned') return 'cm-s--green';
    if (sl === 'in progress')  return 'cm-s--blue';
    if (sl === 'pending')      return 'cm-s--amber';
    if (sl === 'failed')       return 'cm-s--red';
    return 'cm-s--dim';
  }

  healthClass(h: string): string {
    if ((h || '').toLowerCase() === 'good') return 'cm-h--green';
    if ((h || '').toLowerCase() === 'warn') return 'cm-h--amber';
    return 'cm-h--red';
  }

  workflowStepStatus(step: number): string {
    if (!this.selected) return 'pending';
    const prog = this.commProgress(this.selected);
    const stepPct = (step / 6) * 100;
    if (prog >= stepPct) return 'done';
    if (prog >= stepPct - 16.7) return 'active';
    return 'pending';
  }

  deviceTypes(): string[] {
    const types: {[k:string]:boolean} = {};
    this.devices.forEach(d => { if (d.device_type) types[d.device_type] = true; });
    return Object.keys(types);
  }

  select(d: any) { this.selected = d; }

  markCommissioned() {
    if (!this.selected) return;
    this.api.post('/api/dep/devices/' + this.selected.id + '/commission', {}).subscribe({
      next: (r: any) => {
        this.selected.status = 'Commissioned';
        this.selected.commissioning_status = 'Commissioned';
        this.selected.commissioning_progress = 100;
      },
      error: () => {}
    });
  }

  // ── KPI filter ───────────────────────────────────────────────────────────
  filterByKpi(status: string) {
    this.filterStatus = this.filterStatus === status ? '' : status;
    this.page = 1;
  }

  // ── Row actions ──────────────────────────────────────────────────────────
  viewDevice(d: any, e: Event) {
    e.stopPropagation();
    this.select(d);
  }

  resumeCommissioning(d: any, e: Event) {
    e.stopPropagation();
    this.select(d);
    // Scroll action panel into view after selection
    setTimeout(() => {
      const panel = document.querySelector('.cm-selected-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  downloadReport(d: any, e: Event) {
    e.stopPropagation();
    window.open('/api/dep/devices/' + d.id + '/commissioning-report', '_blank');
  }

  goPhotos(e: Event) {
    e.stopPropagation();
    this.router.navigate(['/ecbs/deployment', this.depId, 'photos']);
  }

  goElectrical(e: Event) {
    e.stopPropagation();
    this.router.navigate(['/ecbs/deployment', this.depId, 'electrical-network']);
  }

  goEngineering(e: Event) {
    e.stopPropagation();
    this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']);
  }

  // ── Workflow step navigation ──────────────────────────────────────────────
  clickChecklistStep(step: any) {
    const label = (step.label || '').toLowerCase();
    if (label.includes('communication')) {
      this.router.navigate(['/ecbs/deployment', this.depId, 'electrical-network']);
    } else if (label.includes('pre-check') || label.includes('functional')) {
      this.router.navigate(['/ecbs/deployment', this.depId, 'devices']);
    }
    // Other steps stay on commissioning page and scroll to step
  }

  // ── Action buttons ────────────────────────────────────────────────────────
  runNextStep() {
    if (!this.selected) return;
    const prog = this.commProgress(this.selected);
    const nextStep = Math.floor(prog / 16.67) + 1;
    this.api.post('/api/dep/devices/' + this.selected.id + '/commissioning-step', { step: nextStep }).subscribe({
      next: (r: any) => {
        const resp = r && r.response ? r.response : r;
        if (resp && resp.progress !== undefined) {
          this.selected.commissioning_progress = resp.progress;
          this.selected.commissioning_status = resp.status || this.selected.commissioning_status;
        }
        this.load();
      },
      error: () => {}
    });
  }

  viewTestHistory() {
    this.showHistoryPanel = !this.showHistoryPanel;
  }

  openManualResult() {
    this.showManualResultModal = true;
    this.manualResult = { label: '', value: '', notes: '' };
  }

  saveManualResult() {
    if (!this.selected || !this.manualResult.label) return;
    this.savingManual = true;
    this.api.post('/api/dep/devices/' + this.selected.id + '/commissioning-result', this.manualResult).subscribe({
      next: () => {
        this.savingManual = false;
        this.showManualResultModal = false;
        this.load();
      },
      error: () => { this.savingManual = false; }
    });
  }

  uploadTestResultsFile(event: any) {
    if (!this.selected) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('device_id', String(this.selected.id));
    form.append('type', 'test_result');
    this.api.post('/api/dep/photos/upload', form).subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }

  generateCommissioningReport() {
    if (!this.selected) return;
    this.generatingReport = true;
    this.api.post('/api/dep/devices/' + this.selected.id + '/commissioning-report', {}).subscribe({
      next: (r: any) => {
        this.generatingReport = false;
        const resp = r && r.response ? r.response : r;
        if (resp && resp.download_url) window.open(resp.download_url, '_blank');
        else { this.reportMsg = 'Report generated — check Documents.'; setTimeout(() => this.reportMsg = '', 4000); }
      },
      error: () => { this.generatingReport = false; }
    });
  }

  get canCommission(): boolean {
    if (!this.selected) return false;
    return this.commProgress(this.selected) >= 80;
  }
}
