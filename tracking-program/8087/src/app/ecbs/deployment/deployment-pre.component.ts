import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-pre',
  templateUrl: './deployment-pre.component.html',
  styleUrls: ['./deployment-pre.component.scss'],
})
export class DeploymentPreComponent implements OnInit {
  depId = 0;
  dep: any = null;
  readiness: any = null;
  materials: any[] = [];
  loading = true;
  syncedAt = '';

  // ─── Issue modal ───────────────────────────────────────────────────────────
  showIssueModal = false;
  newIssueTitle = '';
  newIssueDesc = '';
  newIssuePriority = 'Medium';
  savingIssue = false;

  // ─── Tool checklist modal ──────────────────────────────────────────────────
  showToolModal = false;
  toolChecks: {[key: string]: boolean} = {
    'Torque Wrench': false, 'Multimeter': false,
    'Label Printer': false, 'Network Tester': false, 'Hand Tools': false,
  };
  savingTools = false;

  // ─── Site access modal ─────────────────────────────────────────────────────
  showAccessModal = false;
  accessChecks: {[key: string]: boolean} = {
    'Site Contact Confirmed': false, 'Badge / Access Requirements Met': false,
    'Parking / Staging Confirmed': false, 'Escort Arranged (if required)': false,
    'Security Check-In Process Known': false,
  };
  accessNotes = '';
  savingAccess = false;

  // ─── Site info modal (read-only) ───────────────────────────────────────────
  showSiteModal = false;

  // ─── Shutdown modal (read-only) ────────────────────────────────────────────
  showShutdownModal = false;
  shutdownDetails: any = null;

  // ─── Safety modal ──────────────────────────────────────────────────────────
  showSafetyModal = false;
  safetyChecks: {[key: string]: boolean} = {
    'Arc Flash Study Reviewed': false, 'PPE Available on Truck': false,
    'Lockout / Tagout Equipment Ready': false, 'Safety Training Completed': false,
  };
  savingSafety = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe(p => {
      this.depId = +p['id'];
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get(`/api/dep/deployments/${this.depId}`).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.loading = false;
        // Restore saved checklist state from deployment record
        this._restoreChecks();
        // Load shutdown details
        this._loadShutdowns();
      },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/dep/deployments/${this.depId}/readiness`).subscribe({
      next: (r: any) => { this.readiness = r && r.response ? r.response : r; },
      error: () => {}
    });
    this.api.get(`/api/dep/deployments/${this.depId}/materials`).subscribe({
      next: (r: any) => { this.materials = (r && r.response) ? r.response : []; },
      error: () => {}
    });
  }

  private _restoreChecks() {
    if (!this.dep) return;
    try {
      const saved = this.dep.pre_deployment_checks
        ? (typeof this.dep.pre_deployment_checks === 'string'
            ? JSON.parse(this.dep.pre_deployment_checks)
            : this.dep.pre_deployment_checks)
        : {};
      if (saved.tool_checks) Object.assign(this.toolChecks, saved.tool_checks);
      if (saved.access_checks) Object.assign(this.accessChecks, saved.access_checks);
      if (saved.access_notes) this.accessNotes = saved.access_notes;
      if (saved.safety_checks) Object.assign(this.safetyChecks, saved.safety_checks);
    } catch (e) {}
  }

  private _loadShutdowns() {
    this.api.get(`/api/dep/deployments/${this.depId}/shutdowns`).subscribe({
      next: (r: any) => {
        const list = (r && r.response) ? r.response : [];
        this.shutdownDetails = list.length ? list[0] : null;
      },
      error: () => {}
    });
  }

  private _saveChecks() {
    const payload = {
      pre_deployment_checks: JSON.stringify({
        tool_checks: this.toolChecks,
        access_checks: this.accessChecks,
        access_notes: this.accessNotes,
        safety_checks: this.safetyChecks,
      }),
    };
    this.api.patch(`/api/dep/deployments/${this.depId}`, payload).subscribe({ error: () => {} });
  }

  // ─── Derived getters ───────────────────────────────────────────────────────

  get depName(): string { return (this.dep && this.dep.deployment_name) || '—'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }
  get siteInfo(): any { return (this.dep && this.dep.site_info) || null; }

  get sections(): any[] {
    if (this.readiness && this.readiness.sections) return this._mergeSavedChecks(this.readiness.sections);
    return this._defaultSections();
  }

  private _mergeSavedChecks(sections: any[]): any[] {
    return sections.map((s: any) => {
      if (s.num === 6) {
        return { ...s, items: s.items.map((item: any) => ({
          ...item, status: this.toolChecks[item.label] ? 'ok' : item.status
        }))};
      }
      if (s.num === 4) {
        return { ...s, items: s.items.map((item: any) => {
          const key = Object.keys(this.accessChecks).find(k => k.startsWith(item.label.split(' / ')[0]));
          return { ...item, status: (key && this.accessChecks[key]) ? 'ok' : item.status };
        })};
      }
      if (s.num === 7) {
        return { ...s, items: s.items.map((item: any) => {
          const key = Object.keys(this.safetyChecks).find(k => k.startsWith(item.label));
          return { ...item, status: (key && this.safetyChecks[key]) ? 'ok' : item.status };
        })};
      }
      return s;
    });
  }

  get readinessScore(): number {
    if (this.readiness && this.readiness.score != null) return this.readiness.score;
    const sects = this.sections;
    if (!sects.length) return 0;
    let total = 0, done = 0;
    for (const s of sects) {
      for (const item of (s.items || [])) { total++; if (item.status === 'ok') done++; }
    }
    return total ? Math.round(done / total * 100) : 0;
  }

  get readinessLabel(): string {
    const s = this.readinessScore;
    if (s >= 100) return 'READY TO DEPLOY';
    if (s >= 70) return 'ALMOST READY';
    return 'NOT READY';
  }

  get readinessClass(): string {
    const s = this.readinessScore;
    if (s >= 100) return 'ready';
    if (s >= 70) return 'partial';
    return 'not-ready';
  }

  get canStart(): boolean {
    if (this.readiness && this.readiness.override_approved) return true;
    return this.readinessScore >= 100;
  }

  get totalItems(): number { return this.sections.reduce((a: number, s: any) => a + (s.items || []).length, 0); }
  get completeItems(): number { return this.sections.reduce((a: number, s: any) => a + (s.items || []).filter((i: any) => i.status === 'ok').length, 0); }
  get missingItems(): number { return this.sections.reduce((a: number, s: any) => a + (s.items || []).filter((i: any) => i.status === 'missing').length, 0); }
  get inProgressItems(): number { return this.sections.reduce((a: number, s: any) => a + (s.items || []).filter((i: any) => i.status === 'in_progress').length, 0); }
  get blockedItems(): number { return this.sections.reduce((a: number, s: any) => a + (s.items || []).filter((i: any) => i.status === 'blocked').length, 0); }

  get readinessIssues(): any[] {
    const issues: any[] = [];
    for (const s of this.sections) {
      for (const item of (s.items || [])) {
        if (item.status === 'missing' || item.status === 'blocked' || item.status === 'in_progress') {
          issues.push({ ...item, section: s.title });
        }
      }
    }
    return issues.slice(0, 5);
  }

  get toolCheckCount(): number { return Object.keys(this.toolChecks).filter(k => (this.toolChecks as any)[k]).length; }
  get toolTotal(): number { return Object.keys(this.toolChecks).length; }
  get accessCheckCount(): number { return Object.keys(this.accessChecks).filter(k => (this.accessChecks as any)[k]).length; }
  get accessTotal(): number { return Object.keys(this.accessChecks).length; }
  get safetyCheckCount(): number { return Object.keys(this.safetyChecks).filter(k => (this.safetyChecks as any)[k]).length; }
  get safetyTotal(): number { return Object.keys(this.safetyChecks).length; }

  sectionScore(s: any): number {
    const items = s.items || [];
    if (!items.length) return 0;
    return Math.round(items.filter((i: any) => i.status === 'ok').length / items.length * 100);
  }

  itemIcon(status: string): string {
    if (status === 'ok') return 'fa fa-check-circle';
    if (status === 'in_progress') return 'fa fa-clock-o';
    if (status === 'blocked') return 'fa fa-times-circle';
    return 'fa fa-exclamation-circle';
  }
  itemClass(status: string): string {
    if (status === 'ok') return 'ok';
    if (status === 'in_progress') return 'in-progress';
    if (status === 'blocked') return 'blocked';
    return 'missing';
  }
  issueClass(status: string): string { return this.itemClass(status); }

  toolCheckKeys(): string[] { return Object.keys(this.toolChecks); }
  accessCheckKeys(): string[] { return Object.keys(this.accessChecks); }
  safetyCheckKeys(): string[] { return Object.keys(this.safetyChecks); }

  // ─── Start Deployment ──────────────────────────────────────────────────────

  startDeployment() {
    if (!this.canStart) return;
    this.api.post(`/api/dep/deployments/${this.depId}/start`, {}).subscribe({
      next: () => { this.router.navigate(['/ecbs/deployment', this.depId]); },
      error: () => { this.router.navigate(['/ecbs/deployment', this.depId]); }
    });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  goToDocuments()   { this.router.navigate(['/ecbs/deployment', this.depId, 'documents']); }
  goToOneLine()     { this.router.navigate(['/ecbs/deployment', this.depId, 'one-line']); }
  goToNetwork()     { this.router.navigate(['/ecbs/deployment', this.depId, 'electrical-network']); }
  goToMaterials()   { this.router.navigate(['/ecbs/deployment', this.depId, 'materials']); }
  goToIssues()      { this.router.navigate(['/ecbs/deployment', this.depId, 'issues']); }
  goToEngSupport()  { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }

  // ─── Print Readiness Report ────────────────────────────────────────────────

  printReport() { window.print(); }

  scrollToChecklist() {
    const el = document.querySelector('.dp-steps') || document.querySelector('.dp-kpi-strip');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  uploadReadinessDoc(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('deployment_id', String(this.depId));
    fd.append('category', 'approval');
    this.api.post('/api/dep/documents/upload', fd).subscribe({
      next: () => alert('Document uploaded successfully and added to Deployment Documents.'),
      error: () => alert('Upload failed. Please try again.')
    });
  }

  // ─── Issue Modal ──────────────────────────────────────────────────────────

  openIssueModal() {
    this.newIssueTitle = ''; this.newIssueDesc = ''; this.newIssuePriority = 'Medium';
    this.showIssueModal = true;
  }
  closeIssueModal() { if (!this.savingIssue) this.showIssueModal = false; }
  submitIssue() {
    if (!this.newIssueTitle.trim() || this.savingIssue) return;
    this.savingIssue = true;
    this.api.post(`/api/dep/deployments/${this.depId}/issues`, {
      title: this.newIssueTitle.trim(),
      description: this.newIssueDesc.trim(),
      priority: this.newIssuePriority,
      impact_level: 'Documentation Only',
    }).subscribe({
      next: () => { this.savingIssue = false; this.showIssueModal = false; this.load(); },
      error: () => { this.savingIssue = false; }
    });
  }

  // ─── Tool Checklist Modal ─────────────────────────────────────────────────

  openToolModal() { this.showToolModal = true; }
  closeToolModal() { if (!this.savingTools) this.showToolModal = false; }
  saveToolChecklist() {
    this.savingTools = true;
    this._saveChecks();
    setTimeout(() => { this.savingTools = false; this.showToolModal = false; this.load(); }, 800);
  }
  markAllTools(val: boolean) { Object.keys(this.toolChecks).forEach(k => this.toolChecks[k] = val); }

  // ─── Site Access Modal ─────────────────────────────────────────────────────

  openAccessModal() { this.showAccessModal = true; }
  closeAccessModal() { if (!this.savingAccess) this.showAccessModal = false; }
  saveAccessChecklist() {
    this.savingAccess = true;
    this._saveChecks();
    setTimeout(() => { this.savingAccess = false; this.showAccessModal = false; this.load(); }, 800);
  }

  // ─── Site Info Modal ──────────────────────────────────────────────────────

  openSiteModal() { this.showSiteModal = true; }
  closeSiteModal() { this.showSiteModal = false; }

  // ─── Shutdown Modal ───────────────────────────────────────────────────────

  openShutdownModal() { this.showShutdownModal = true; }
  closeShutdownModal() { this.showShutdownModal = false; }

  // ─── Safety Modal ─────────────────────────────────────────────────────────

  openSafetyModal() { this.showSafetyModal = true; }
  closeSafetyModal() { if (!this.savingSafety) this.showSafetyModal = false; }
  saveSafetyChecklist() {
    this.savingSafety = true;
    this._saveChecks();
    setTimeout(() => { this.savingSafety = false; this.showSafetyModal = false; this.load(); }, 800);
  }

  // ─── Default sections ─────────────────────────────────────────────────────

  private _defaultSections(): any[] {
    const site = this.dep && this.dep.site_info;
    const mats = this.materials;
    const matItems = mats.length > 0 ? mats.map((m: any) => {
      const exp = m.expected_qty || 0; const deliv = m.delivered_qty || 0;
      let status = 'in_progress';
      if (exp > 0 && deliv >= exp) status = 'ok';
      else if (!deliv) status = 'missing';
      return { label: m.item_label || m.item_type || 'Item', value: exp ? `${deliv}/${exp}` : '—', status };
    }) : [
      { label: 'APFs Loaded', value: '—', status: 'in_progress' },
      { label: 'Meters Loaded', value: '—', status: 'in_progress' },
      { label: 'Gateways Loaded', value: '—', status: 'in_progress' },
      { label: 'CTs Loaded', value: '—', status: 'missing' },
      { label: 'Breakers Loaded', value: '—', status: 'in_progress' },
      { label: 'Labels & Markers', value: '—', status: 'ok' },
    ];

    return [
      {
        num: 1, title: 'Site Information', icon: 'fa-map-marker',
        items: [
          { label: 'Site Name', value: site ? site.name : '—', status: site ? 'ok' : 'missing' },
          { label: 'Address', value: site ? `${site.address}, ${site.city} ${site.state}` : '—', status: site ? 'ok' : 'missing' },
          { label: 'Utility', value: site ? site.utility : '—', status: site ? 'ok' : 'missing' },
          { label: 'Service Voltage', value: site ? (site.service_voltage || site.voltage || '—') : '—', status: site && (site.service_voltage || site.voltage) ? 'ok' : 'missing' },
        ]
      },
      {
        num: 2, title: 'Deployment Package Review', icon: 'fa-folder-open',
        items: [
          { label: 'One-Line Drawing Reviewed', status: 'ok' },
          { label: 'Electrical Network Reviewed', status: 'ok' },
          { label: 'Panel Schedules Reviewed', status: 'ok' },
          { label: 'Installation Scope Reviewed', status: 'ok' },
          { label: 'Device Locations Reviewed', status: 'ok' },
        ]
      },
      { num: 3, title: 'Material Verification', icon: 'fa-cubes', items: matItems },
      {
        num: 4, title: 'Site Access Verification', icon: 'fa-id-badge',
        items: [
          { label: 'Site Contact Confirmed', value: site && site.contact_name ? site.contact_name : '—', status: this.accessChecks['Site Contact Confirmed'] ? 'ok' : (site && site.contact_name ? 'ok' : 'in_progress') },
          { label: 'Badge / Access Requirements', value: '—', status: this.accessChecks['Badge / Access Requirements Met'] ? 'ok' : 'in_progress' },
          { label: 'Parking / Staging', value: '—', status: this.accessChecks['Parking / Staging Confirmed'] ? 'ok' : 'in_progress' },
          { label: 'Escort Required', value: '—', status: this.accessChecks['Escort Arranged (if required)'] ? 'ok' : 'in_progress' },
          { label: 'Security Check-In', value: '—', status: this.accessChecks['Security Check-In Process Known'] ? 'ok' : 'in_progress' },
        ]
      },
      {
        num: 5, title: 'Shutdown Verification', icon: 'fa-power-off',
        items: [
          { label: 'Shutdown Required', value: this.shutdownDetails ? (this.shutdownDetails.shutdown_required ? 'Yes' : 'No') : '—', status: this.shutdownDetails ? 'ok' : 'in_progress' },
          { label: 'Shutdown Approval Status', value: this.shutdownDetails ? (this.shutdownDetails.status || '—') : '—', status: this.shutdownDetails && this.shutdownDetails.status === 'Approved' ? 'ok' : 'in_progress' },
          { label: 'Approved Window', value: this.shutdownDetails && this.shutdownDetails.window_start ? `${this.shutdownDetails.window_start} – ${this.shutdownDetails.window_end}` : '—', status: this.shutdownDetails && this.shutdownDetails.window_start ? 'ok' : 'missing' },
          { label: 'Approval Document', value: this.shutdownDetails && this.shutdownDetails.approval_doc ? 'Attached' : '—', status: this.shutdownDetails && this.shutdownDetails.approval_doc ? 'ok' : 'missing' },
        ]
      },
      {
        num: 6, title: 'Tool Verification', icon: 'fa-wrench',
        items: Object.keys(this.toolChecks).map(k => ({ label: k, status: this.toolChecks[k] ? 'ok' : 'in_progress' }))
      },
      {
        num: 7, title: 'Safety Verification', icon: 'fa-shield',
        items: Object.keys(this.safetyChecks).map(k => ({ label: k, status: this.safetyChecks[k] ? 'ok' : 'in_progress' }))
      },
      {
        num: 8, title: 'Required Documents', icon: 'fa-file-text-o',
        items: [
          { label: 'One-Line Drawing', value: 'Attached', status: 'ok' },
          { label: 'Panel Schedules', value: 'Attached', status: 'ok' },
          { label: 'Device List', value: 'Attached', status: 'ok' },
          { label: 'Shutdown Approval', value: 'Attached', status: 'ok' },
          { label: 'Site Map', value: 'Attached', status: 'ok' },
          { label: 'Arc Flash Study', value: 'Missing', status: 'missing' },
        ]
      },
    ];
  }
}
