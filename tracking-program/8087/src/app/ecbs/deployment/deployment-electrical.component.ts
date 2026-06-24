import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../shared/api/apiRequest.service';

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
    const apfs = devs.filter(d => d.device_type === 'APF');
    const gws  = devs.filter(d => d.device_type === 'Gateway');
    const mts  = devs.filter(d => d.device_type === 'Meter');

    this.assets = [
      {
        id: 'util-1', type: 'Utility Service', name: 'Utility Service', voltage: '13.8 kV', status: 'active',
        expanded: true, depth: 0,
        children: [{
          id: 'tx-1', type: 'Transformer', name: 'Main Transformer', voltage: '13.8 kV / 480V', kva: '2500 kVA', status: 'active',
          depth: 1, expanded: true,
          children: [{
            id: 'sw-1', type: 'Switchgear', name: 'Main Switchgear (MSB-1)', voltage: '480V', rating: '2500 A', status: 'operational',
            depth: 2, expanded: true,
            children: [
              { id: 'pa', type: 'Panel', name: 'Feeder A (Panel PA)', voltage: '480V', rating: '400 A', status: 'operational', depth: 3, expanded: false,
                children: apfs.slice(0,2).map((d, i) => ({ ...d, id: `pa-d${i}`, type: d.device_type, name: d.device_name, depth: 4, children: [], expanded: false }))
              },
              { id: 'pb', type: 'Panel', name: 'Feeder B (Panel PB)', voltage: '480V', rating: '400 A', status: 'operational', depth: 3, expanded: false,
                children: apfs.slice(2,4).map((d, i) => ({ ...d, id: `pb-d${i}`, type: d.device_type, name: d.device_name, depth: 4, children: [], expanded: false }))
              },
              { id: 'pc', type: 'Panel', name: 'Feeder C (Panel PC)', voltage: '480V', rating: '400 A', status: 'operational', depth: 3, expanded: false,
                children: mts.slice(0,1).map((d, i) => ({ ...d, id: `pc-d${i}`, type: d.device_type, name: d.device_name, depth: 4, children: [], expanded: false }))
              },
              { id: 'pd', type: 'Panel', name: 'Feeder D (Panel PD)', voltage: '480V', rating: '400 A', status: 'operational', depth: 3, expanded: false,
                children: [
                  ...(gws.slice(0,1).map((d, i) => ({ ...d, id: `pd-gw${i}`, type: d.device_type, name: d.device_name, depth: 4, children: [], expanded: false }))),
                  ...apfs.slice(4,6).map((d, i) => ({ ...d, id: `pd-d${i}`, type: d.device_type, name: d.device_name, depth: 4, children: [], expanded: false })),
                ]
              },
            ]
          }]
        }]
      }
    ];
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

  goDevices() { this.router.navigate(['/ecbs/deployment', this.depId, 'devices']); }
  goOneLine() { this.router.navigate(['/ecbs/deployment', this.depId, 'one-line']); }
}
