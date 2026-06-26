import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-electrical',
  templateUrl: './deployment-electrical.component.html',
  styleUrls: ['./deployment-electrical.component.scss'],
})
export class DeploymentElectricalComponent implements OnInit {
  depId = 0;
  dep: any = null;
  assets: any[] = [];
  selectedAsset: any = null;
  loading = true;
  syncedAt = '';
  viewMode: 'network' | 'hierarchy' = 'network';

  // flat device list from summary
  devices: any[] = [];
  summary: any = {};

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
    this.api.get(`/api/dep/deployments/${this.depId}/devices`).subscribe({
      next: (r: any) => {
        this.devices = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        if (!this.selectedAsset && this.assets.length === 0) this._buildMockTree();
      },
      error: () => { this._buildMockTree(); }
    });
  }

  private _buildMockTree() {
    const devs = this.devices;
    const site = (this.dep && this.dep.site_info) || {};
    const voltage  = site.service_voltage || '480V';
    const utility  = site.utility || 'Utility Service';
    const transformer = site.transformer || 'Main Transformer';

    // Group devices by panel location to build hierarchy
    const byPanel: {[k: string]: any[]} = {};
    devs.forEach(d => {
      const panel = d.panel_location || d.location || 'Other';
      if (!byPanel[panel]) byPanel[panel] = [];
      byPanel[panel].push(d);
    });
    const panels = Object.keys(byPanel).map((panelName, i) => ({
      id: 'panel-' + i,
      type: 'Panel',
      name: panelName,
      voltage: voltage,
      rating: '—',
      status: 'operational',
      depth: 3,
      expanded: false,
      children: byPanel[panelName].slice(0, 5).map((d, j) => ({
        ...d, id: 'dev-' + i + '-' + j, type: d.device_type, name: d.device_id || d.device_name || d.id,
        depth: 4, children: [], expanded: false
      }))
    }));

    this.assets = [{
      id: 'util-1', type: 'Utility Service', name: utility, voltage: '—', status: 'active',
      expanded: true, depth: 0,
      children: [{
        id: 'tx-1', type: 'Transformer', name: transformer, voltage: voltage, kva: '—', status: 'active',
        depth: 1, expanded: true,
        children: [{
          id: 'sw-1', type: 'Switchgear', name: 'Main Switchgear', voltage: voltage, rating: '—', status: 'operational',
          depth: 2, expanded: true,
          children: panels.length ? panels : [{ id: 'no-panels', type: 'Panel', name: 'No panels configured', voltage: '', rating: '', status: 'pending', depth: 3, expanded: false, children: [] }]
        }]
      }]
    }];
  }

  get flatAssets(): any[] {
    const result: any[] = [];
    const walk = (items: any[]) => {
      for (const item of items) {
        result.push(item);
        if (item.expanded && item.children && item.children.length) {
          walk(item.children);
        }
      }
    };
    walk(this.assets);
    return result;
  }

  toggleExpand(asset: any, e: Event) {
    e.stopPropagation();
    asset.expanded = !asset.expanded;
  }

  selectAsset(asset: any) { this.selectedAsset = asset; }

  get depName(): string { return (this.dep && this.dep.deployment_name) || '—'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get totalDevices(): number { return (this.summary && this.summary.total_devices) || this.devices.length || 0; }
  get installedCount(): number { return (this.summary && this.summary.installed) || 0; }
  get commissionedCount(): number { return (this.summary && this.summary.commissioned) || 0; }
  get openIssues(): number { return (this.summary && this.summary.open_issues) || 0; }

  statusClass(s: string): string {
    if (!s) return 'dim';
    const sl = s.toLowerCase();
    if (sl === 'commissioned' || sl === 'active' || sl === 'operational' || sl === 'online') return 'green';
    if (sl === 'in progress' || sl === 'in_progress') return 'blue';
    if (sl === 'pending' || sl === 'not started' || sl === 'not_started') return 'amber';
    if (sl === 'failed' || sl === 'issue') return 'red';
    return 'dim';
  }

  typeIcon(type: string): string {
    if (!type) return 'fa-circle-o';
    const t = type.toLowerCase();
    if (t === 'utility service') return 'fa-bolt';
    if (t === 'transformer') return 'fa-exchange';
    if (t === 'switchgear') return 'fa-th-large';
    if (t === 'panel' || t === 'feeder') return 'fa-columns';
    if (t === 'apf') return 'fa-microchip';
    if (t === 'gateway') return 'fa-wifi';
    if (t === 'meter') return 'fa-tachometer';
    if (t === 'ct') return 'fa-retweet';
    return 'fa-circle-o';
  }

  goDevices()       { this.router.navigate(['/ecbs/deployment', this.depId, 'devices']); }
  goOneLine()       { this.router.navigate(['/ecbs/deployment', this.depId, 'one-line']); }
  goIssues()        { this.router.navigate(['/ecbs/deployment', this.depId, 'issues']); }
  goEngineering()   { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }
  goCommissioning() { this.router.navigate(['/ecbs/deployment', this.depId, 'commissioning']); }

  editAsset(asset?: any) {
    const a = asset || this.selectedAsset;
    if (!a) return;
    alert('Edit Asset: ' + (a.name || a.device_name || a.label || a.type) + '\n(Full edit panel would open here with location, breaker, and CT fields)');
  }

  addAsBuilt(asset?: any) {
    const a = asset || this.selectedAsset;
    const name = a ? (a.name || a.device_name || 'this asset') : 'the network';
    const note = prompt('Describe the as-built correction for ' + name + ':');
    if (!note) return;
    this.api.post('/api/dep/deployments/' + this.depId + '/as-built', { asset_id: a && a.id, note }).subscribe({
      next: () => alert('As-built correction saved.'),
      error: () => alert('Failed to save correction. Please try again.')
    });
  }

  openAddAsset() {
    // Navigate to devices screen where Add Device form is available
    this.router.navigate(['/ecbs/deployment', this.depId, 'devices']);
  }

  uploadDocForAsset(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('deployment_id', String(this.depId));
    if (this.selectedAsset && this.selectedAsset.id) fd.append('asset_id', String(this.selectedAsset.id));
    this.api.post('/api/dep/documents/upload', fd).subscribe({
      next: () => alert('Document uploaded successfully.'),
      error: () => alert('Upload failed.')
    });
  }

  uploadPhotoForAsset(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('deployment_id', String(this.depId));
    if (this.selectedAsset && this.selectedAsset.id) fd.append('device_name', String(this.selectedAsset.name || this.selectedAsset.device_name || ''));
    this.api.post('/api/dep/photos/upload', fd).subscribe({
      next: () => { alert('Photo uploaded.'); },
      error: () => alert('Upload failed.')
    });
  }

  exportNetwork() {
    window.open('/api/dep/deployments/' + this.depId + '/electrical-network/export', '_blank');
  }
}
