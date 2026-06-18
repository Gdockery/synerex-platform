import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-electrical-network',
  templateUrl: './electrical-network.component.html',
  styleUrls: ['./electrical-network.component.scss'],
})
export class ElectricalNetworkComponent implements OnInit {
  projectId: number;
  loading = true;
  nodes: any[] = [];
  selectedNode: any = null;
  networkSummary: any = null;
  cbi: any = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        const raw = r?.data || r?.assets || [];
        this.nodes = raw.map((a: any) => ({
          ...a,
          name:             a.label || a.name || a.asset_id,
          type:             (a.asset_type || a.type || 'transformer').toLowerCase(),
          capacity_kva:     a.rated_kva || a.capacity_kva || null,
          current_load_kva: a.used_kva  || a.current_load_kva || 0,
          recovered_kva:    a.recoverable_kva || a.recovered_kva || 0,
          utilization_pct:  a.utilization_pct || null,
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/capacity/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.networkSummary = r; }, error: () => {}
    });
    this.api.get(`/api/current-balance/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.cbi = r; if (this.networkSummary) { this.networkSummary.cbi_score = r?.score || r?.cbi_score; } },
      error: () => {}
    });
  }

  selectNode(n: any) { this.selectedNode = n; }

  barColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }

  nodeClass(type: string): string {
    switch (type) {
      case 'transformer': return 'en-node en-node-transformer';
      case 'switchgear': case 'mcc': return 'en-node en-node-switchgear';
      case 'panel': case 'feeder': return 'en-node en-node-panel';
      case 'load': case 'motor': return 'en-node en-node-load';
      case 'meter': return 'en-node en-node-meter';
      default: return 'en-node';
    }
  }

  nodeIcon(type: string): string {
    switch (type) {
      case 'transformer': return 'fa-plug';
      case 'switchgear': case 'mcc': return 'fa-th-large';
      case 'panel': return 'fa-tablet';
      case 'feeder': return 'fa-share-alt';
      case 'meter': return 'fa-flash';
      case 'load': case 'motor': return 'fa-cog';
      default: return 'fa-circle-o';
    }
  }

  nodeIconBg(type: string): string {
    switch (type) {
      case 'transformer': return 'rgba(41,182,246,0.12)';
      case 'switchgear': case 'mcc': return 'rgba(206,147,216,0.12)';
      case 'panel': case 'feeder': return 'rgba(255,215,64,0.12)';
      case 'meter': return 'rgba(41,182,246,0.12)';
      case 'load': case 'motor': return 'rgba(0,230,118,0.12)';
      default: return 'rgba(84,110,122,0.12)';
    }
  }

  nodeIconColor(type: string): string {
    switch (type) {
      case 'transformer': return '#29b6f6';
      case 'switchgear': case 'mcc': return '#ce93d8';
      case 'panel': case 'feeder': return '#ffd740';
      case 'meter': return '#29b6f6';
      case 'load': case 'motor': return '#00e676';
      default: return '#546e7a';
    }
  }

  get totalAssets(): number { return this.nodes.length; }
  get totalLoadKva(): number { return this.networkSummary?.current_load_kva || this.networkSummary?.used_capacity || 0; }

  get networkHealthScore(): number {
    const cbi = this.cbi?.score || this.cbi?.cbi_score || 0;
    const util = this.networkSummary?.utilization_pct || 0;
    if (!cbi && !util) return 0;
    if (cbi) return Math.round(cbi * 0.6 + (100 - Math.min(util, 100)) * 0.4);
    return Math.round(100 - Math.min(util, 100));
  }

  get healthColor(): string {
    const s = this.networkHealthScore;
    return s >= 90 ? '#00e676' : s >= 70 ? '#ffd740' : '#f44336';
  }
}
