import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-closeout',
  templateUrl: './deployment-closeout.component.html',
  styleUrls: ['./deployment-closeout.component.scss'],
})
export class DeploymentCloseoutComponent implements OnInit {
  depId = 0;
  dep: any = null;
  requirements: any[] = [];
  packageContent: any[] = [];
  packageStatus: any = null;
  loading = true;
  syncedAt = '';
  generating = false;
  generatingZip = false;
  submitting = false;
  releasing = false;
  actionMsg = '';

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
        this._buildFromDep();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/closeout').subscribe({
      next: (r: any) => {
        const raw = r && r.response ? r.response : r;
        if (raw && raw.requirements) this.requirements = raw.requirements;
        if (raw && raw.package_content) this.packageContent = raw.package_content;
        if (raw && raw.package_status) this.packageStatus = raw.package_status;
      },
      error: () => {}
    });
  }

  private _buildFromDep() {
    // Build requirements from deployment summary if API doesn't provide them
    if (this.requirements.length) return;
    const s = (this.dep && this.dep.summary) || {};
    const total = s.total_devices || 0;
    const installed = s.installed || 0;
    const commissioned = s.commissioned || 0;
    const photos = s.photos_uploaded || 0;
    const issues = s.open_issues || 0;
    const documents = s.documents_count || 0;

    this.requirements = [
      { label: 'Installation Complete', desc: 'All devices installed and secured', progress: installed + '/' + total, status: installed >= total && total > 0 ? 'Complete' : 'In Progress' },
      { label: 'CT Verification Complete', desc: 'All CTs verified and documented', progress: installed + '/' + total, status: installed >= total && total > 0 ? 'Complete' : 'Pending' },
      { label: 'Photos Complete', desc: 'All required photos captured', progress: photos + ' photos', status: photos > 0 ? 'Complete' : 'Pending' },
      { label: 'Documents Complete', desc: 'All required documents uploaded', progress: documents + ' docs', status: documents > 0 ? 'Complete' : 'Pending' },
      { label: 'Commissioning Complete', desc: 'All devices commissioned and tested', progress: commissioned + '/' + total, status: commissioned >= total && total > 0 ? 'Complete' : 'In Progress' },
      { label: 'As-Built Drawings Complete', desc: 'One-line and panel drawings updated', progress: '', status: 'Pending' },
      { label: 'Customer Sign-Off', desc: 'Customer acceptance received', progress: '', status: this.dep && this.dep.customer_signed ? 'Complete' : 'Pending' },
      { label: 'Final Approval', desc: 'Engineering final approval required', progress: '', status: this.dep && this.dep.final_approved ? 'Complete' : 'In Progress' },
    ];
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
  get transformer(): string { return (this.dep && this.dep.site_info && this.dep.site_info.transformer) || '—'; }

  // ── KPI getters ──────────────────────────────────────────────────────────
  get s(): any { return (this.dep && this.dep.summary) || {}; }
  get closeoutPct(): number {
    if (!this.requirements.length) return 0;
    const done = this.requirements.filter(r => r.status === 'Complete').length;
    return Math.round(done / this.requirements.length * 100);
  }
  get devicesTotal(): number   { return this.s.total_devices || 0; }
  get devicesComplete(): number { return this.s.installed || this.devicesTotal; }
  get photosComplete(): number  { return this.s.photos_uploaded || 0; }
  get openIssues(): number      { return this.s.open_issues || 0; }
  get commissionedCount(): number { return this.s.commissioned || 0; }

  get statusLabel(): string {
    if (this.closeoutPct >= 100) return 'Ready For Approval';
    if (this.closeoutPct >= 80)  return 'Nearly Complete';
    if (this.closeoutPct >= 50)  return 'In Progress';
    return 'Incomplete';
  }

  get statusColor(): string {
    if (this.closeoutPct >= 80) return '#22c55e';
    if (this.closeoutPct >= 50) return '#3b82f6';
    return '#f59e0b';
  }

  // SVG donut
  private readonly _circ = 2 * Math.PI * 45;
  get donutOffset(): number { return this._circ * (1 - this.closeoutPct / 100); }

  // ── Requirement helpers ──────────────────────────────────────────────────
  reqStatusClass(status: string): string {
    if (status === 'Complete')    return 'co-r--green';
    if (status === 'In Progress') return 'co-r--blue';
    if (status === 'Blocked')     return 'co-r--red';
    return 'co-r--dim';
  }

  reqIcon(status: string): string {
    if (status === 'Complete')    return 'fa-check-circle';
    if (status === 'In Progress') return 'fa-clock-o';
    if (status === 'Blocked')     return 'fa-exclamation-circle';
    return 'fa-circle-o';
  }

  // ── Package content getters (from API or dep summary) ───────────────────
  get pkgContent(): any[] {
    if (this.packageContent.length) return this.packageContent;
    return [
      { label: 'Devices & Configurations', icon: 'fa-microchip',  files: this.devicesTotal, size: '2.1 MB',   desc: 'All device data and settings' },
      { label: 'Photos',                   icon: 'fa-camera',     files: this.photosComplete, size: '128 MB', desc: 'Installation and verification photos' },
      { label: 'Documents',                icon: 'fa-file-text-o',files: this.s.documents_count || 0, size: '68 MB', desc: 'Drawings, manuals, and reports' },
      { label: 'Commissioning Reports',    icon: 'fa-clipboard',  files: this.commissionedCount, size: '34 MB', desc: 'Test results and commissioning data' },
      { label: 'Issues & Resolutions',     icon: 'fa-exclamation-triangle', files: 0, size: '0 MB', desc: 'All issues and resolution records' },
      { label: 'Engineering Communications', icon: 'fa-comments', files: 0, size: '16 MB', desc: 'All support tickets and responses' },
      { label: 'As-Built Drawings',        icon: 'fa-pencil-square-o', files: 0, size: '22 MB', desc: 'Updated drawings and markups' },
      { label: 'Sign-Offs & Approvals',    icon: 'fa-check-square-o', files: 0, size: '2 MB',  desc: 'Customer and engineering approvals' },
    ];
  }

  get totalPackageSizeMB(): number {
    return this.pkgContent.reduce((acc, item) => {
      const mb = parseFloat((item.size || '0').replace(/[^0-9.]/g, ''));
      return acc + (isNaN(mb) ? 0 : mb);
    }, 0);
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  goTo(screen: string) { this.router.navigate(['/ecbs/deployment', this.depId, screen]); }
  goToRequirement(req: any) {
    const label = (req.label || '').toLowerCase();
    if (label.includes('installation') || label.includes('ct verif')) return this.goTo('devices');
    if (label.includes('photo'))     return this.goTo('photos');
    if (label.includes('document'))  return this.goTo('documents');
    if (label.includes('commission')) return this.goTo('commissioning');
    if (label.includes('drawing') || label.includes('built')) return this.goTo('one-line');
    if (label.includes('sign') || label.includes('approval') || label.includes('customer')) return this.goTo('engineering-support');
    this.goTo('issues');
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  generateReport() {
    this.generating = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/closeout/generate', { type: 'pdf' }).subscribe({
      next: (r: any) => {
        this.generating = false;
        const resp = r && r.response ? r.response : r;
        if (resp && resp.download_url) window.open(resp.download_url, '_blank');
        else this.actionMsg = 'PDF generated — check Documents screen.';
        setTimeout(() => this.actionMsg = '', 4000);
      },
      error: () => { this.generating = false; }
    });
  }

  generateZip() {
    this.generatingZip = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/closeout/generate', { type: 'zip' }).subscribe({
      next: (r: any) => {
        this.generatingZip = false;
        const resp = r && r.response ? r.response : r;
        if (resp && resp.download_url) window.open(resp.download_url, '_blank');
        else this.actionMsg = 'ZIP package queued — check Documents screen.';
        setTimeout(() => this.actionMsg = '', 4000);
      },
      error: () => { this.generatingZip = false; }
    });
  }

  submitForApproval() {
    if (this.submitting) return;
    this.submitting = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/closeout/submit', {}).subscribe({
      next: () => {
        this.submitting = false;
        this.actionMsg = 'Submitted for approval. Engineering team has been notified.';
        setTimeout(() => this.actionMsg = '', 5000);
        this.load();
      },
      error: () => { this.submitting = false; }
    });
  }

  downloadPackage() {
    window.open('/api/dep/deployments/' + this.depId + '/closeout/download', '_blank');
  }

  releaseToOps() {
    if (this.releasing) return;
    if (!confirm('Release this deployment to Operations? This marks it as complete and activated.')) return;
    this.releasing = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/closeout/release', {}).subscribe({
      next: () => {
        this.releasing = false;
        this.actionMsg = 'Deployment released to Operations successfully.';
        setTimeout(() => this.actionMsg = '', 5000);
        this.load();
      },
      error: () => { this.releasing = false; }
    });
  }
}
