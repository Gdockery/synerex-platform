import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../shared/api/apiRequest.service';

@Component({
  selector: 'app-deployment-oneline',
  templateUrl: './deployment-oneline.component.html',
  styleUrls: ['./deployment-oneline.component.scss'],
})
export class DeploymentOneLineComponent implements OnInit {
  depId = 0;
  dep: any = null;
  documents: any[] = [];
  selectedDoc: any = null;
  loading = true;
  syncedAt = '';
  summary: any = {};
  devices: any[] = [];

  // Mock drawing documents
  drawingDocs = [
    { id: 1, name: 'Flex_Tijuana_OneLine_Rev2.pdf', date: 'May 10, 2025', current: true },
    { id: 2, name: 'Flex_Tijuana_OneLine_Rev1.pdf', date: 'Apr 20, 2025', current: false },
    { id: 3, name: 'Flex_Tijuana_SLD_Appendix.pdf', date: 'May 10, 2025', current: false },
  ];

  // Device legend counts
  deviceLegend = [
    { type: 'APF', count: 3 },
    { type: 'Meter', count: 1 },
    { type: 'Gateway', count: 1 },
    { type: 'CT', count: 20 },
    { type: 'Breaker', count: 12 },
    { type: 'Other', count: 2 },
  ];

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
        this.summary = this.dep.summary || {};
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/dep/deployments/${this.depId}/documents`).subscribe({
      next: (r: any) => {
        const docs = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        if (docs.length) { this.drawingDocs = docs; }
      },
      error: () => {}
    });
    this.api.get(`/api/dep/deployments/${this.depId}/devices`).subscribe({
      next: (r: any) => {
        this.devices = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        this._buildLegend();
      },
      error: () => {}
    });
  }

  private _buildLegend() {
    const counts: {[k: string]: number} = {};
    for (const d of this.devices) {
      const t = d.device_type || 'Other';
      counts[t] = (counts[t] || 0) + 1;
    }
    if (Object.keys(counts).length) {
      this.deviceLegend = Object.entries(counts).map(([type, count]) => ({ type, count }));
    }
  }

  get depName(): string { return (this.dep && this.dep.deployment_name) || '—'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get totalPanels(): number { return 12; }
  get panelsInstalled(): number { return (this.summary && this.summary.installed) || 8; }
  get devicesInstalled(): number { return (this.summary && this.summary.installed) || 0; }
  get totalDevices(): number { return (this.summary && this.summary.total_devices) || 0; }
  get openIssues(): number { return (this.summary && this.summary.open_issues) || 0; }
  get totalDrawings(): number { return this.drawingDocs.length; }
  get totalDeviceLegend(): number { return this.deviceLegend.reduce((a, b) => a + b.count, 0); }

  get currentDoc(): any { return this.drawingDocs.find(d => d.current) || this.drawingDocs[0] || null; }

  statusClass(s: string): string {
    if (!s) return 'dim';
    const sl = s.toLowerCase();
    if (sl === 'commissioned' || sl === 'approved' || sl === 'active') return 'green';
    if (sl === 'in progress' || sl === 'in_progress') return 'blue';
    if (sl === 'pending') return 'amber';
    if (sl === 'failed' || sl === 'rejected') return 'red';
    return 'dim';
  }

  goDevices() { this.router.navigate(['/ecbs/deployment', this.depId, 'devices']); }
  goEngineering() { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }
}
