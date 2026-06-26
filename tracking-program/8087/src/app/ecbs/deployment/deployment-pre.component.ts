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

  // Issue creation modal state
  showIssueModal = false;
  newIssueTitle = '';
  newIssueDesc = '';
  newIssuePriority = 'Medium';
  savingIssue = false;

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

  // ─── Derived getters ───────────────────────────────────────────────────────

  get depName(): string { return (this.dep && this.dep.deployment_name) || '—'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get sections(): any[] {
    if (this.readiness && this.readiness.sections) return this.readiness.sections;
    return this._defaultSections();
  }

  get readinessScore(): number {
    if (this.readiness && this.readiness.score != null) return this.readiness.score;
    const sects = this.sections;
    if (!sects.length) return 0;
    let total = 0, done = 0;
    for (const s of sects) {
      for (const item of (s.items || [])) {
        total++;
        if (item.status === 'ok') done++;
      }
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

  /** True when the Start button should be enabled: score=100 OR approved override */
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

  sectionScore(s: any): number {
    const items = s.items || [];
    if (!items.length) return 0;
    const done = items.filter((i: any) => i.status === 'ok').length;
    return Math.round(done / items.length * 100);
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

  // ─── Start Deployment ──────────────────────────────────────────────────────

  startDeployment() {
    if (!this.canStart) return;
    this.api.post(`/api/dep/deployments/${this.depId}/start`, {}).subscribe({
      next: () => { this.router.navigate(['/ecbs/deployment', this.depId]); },
      error: () => { this.router.navigate(['/ecbs/deployment', this.depId]); }
    });
  }

  // ─── Issue Modal ──────────────────────────────────────────────────────────

  openIssueModal() {
    this.newIssueTitle = '';
    this.newIssueDesc = '';
    this.newIssuePriority = 'Medium';
    this.showIssueModal = true;
  }

  closeIssueModal() {
    if (this.savingIssue) return;
    this.showIssueModal = false;
  }

  submitIssue() {
    if (!this.newIssueTitle.trim() || this.savingIssue) return;
    this.savingIssue = true;
    this.api.post(`/api/dep/deployments/${this.depId}/issues`, {
      title: this.newIssueTitle.trim(),
      description: this.newIssueDesc.trim(),
      priority: this.newIssuePriority,
      impact_level: 'Documentation Only',
    }).subscribe({
      next: () => {
        this.savingIssue = false;
        this.showIssueModal = false;
        this.load();
      },
      error: () => { this.savingIssue = false; }
    });
  }

  // ─── Navigation helpers ───────────────────────────────────────────────────

  goToDocuments() { this.router.navigate(['/ecbs/deployment', this.depId, 'documents']); }
  goToOneLine()   { this.router.navigate(['/ecbs/deployment', this.depId, 'one-line']); }
  goToNetwork()   { this.router.navigate(['/ecbs/deployment', this.depId, 'network']); }

  // ─── Default sections (used while readiness API loads) ────────────────────

  private _defaultSections(): any[] {
    const site = this.dep && this.dep.site_info;
    const mats = this.materials;

    const matItems = mats.length > 0 ? mats.map((m: any) => {
      const exp = m.expected_qty || 0;
      const deliv = m.delivered_qty || 0;
      let status = 'in_progress';
      if (exp > 0 && deliv >= exp) status = 'ok';
      else if (!deliv) status = 'missing';
      return {
        label: m.item_label || m.item_type || 'Item',
        value: exp ? `${deliv}/${exp}` : '—',
        status,
      };
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
          { label: 'Site Contact Confirmed', value: site && site.contact_name ? site.contact_name : '—', status: site && site.contact_name ? 'ok' : 'in_progress' },
          { label: 'Badge / Access Requirements', value: '—', status: 'in_progress' },
          { label: 'Parking / Staging', value: '—', status: 'in_progress' },
          { label: 'Escort Required', value: '—', status: 'in_progress' },
          { label: 'Security Check-In', value: '—', status: 'in_progress' },
        ]
      },
      {
        num: 5, title: 'Shutdown Verification', icon: 'fa-power-off',
        items: [
          { label: 'Shutdown Required', value: '—', status: 'in_progress' },
          { label: 'Shutdown Approval Status', value: '—', status: 'in_progress' },
          { label: 'Approved Window', value: '—', status: 'in_progress' },
          { label: 'Approval Document', value: '—', status: 'in_progress' },
        ]
      },
      {
        num: 6, title: 'Tool Verification', icon: 'fa-wrench',
        items: [
          { label: 'Torque Wrench', value: '—', status: 'in_progress' },
          { label: 'Multimeter', value: '—', status: 'in_progress' },
          { label: 'Label Printer', value: '—', status: 'in_progress' },
          { label: 'Network Tester', value: '—', status: 'in_progress' },
          { label: 'Hand Tools', value: '—', status: 'in_progress' },
        ]
      },
      {
        num: 7, title: 'Safety Verification', icon: 'fa-shield',
        items: [
          { label: 'Arc Flash Study', value: '—', status: 'in_progress' },
          { label: 'PPE Available', value: '—', status: 'in_progress' },
          { label: 'Lockout / Tagout Equipment', value: '—', status: 'in_progress' },
          { label: 'Safety Training', value: '—', status: 'in_progress' },
        ]
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
