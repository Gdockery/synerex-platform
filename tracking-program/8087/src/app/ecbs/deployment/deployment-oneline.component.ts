import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

// ── Same interfaces & layout engine as digital-twin.component.ts ─────────────

export interface TwinNode {
  dbId: number;
  id: string;
  type: string;
  label: string;
  rated_kva?: number;
  amp_rating?: number;
  voltage_in?: number;
  voltage_out?: number;
  used_kva?: number;
  utilization_pct?: number;
  status?: string;
  bus_id?: string;
  drawing_ref?: string;
  notes?: string;
  extra?: any;
}

export interface TwinSvgNode extends TwinNode {
  x: number;
  y: number;
  badges: TwinNode[];
}

@Component({
  selector: 'app-deployment-oneline',
  templateUrl: './deployment-oneline.component.html',
  styleUrls: ['./deployment-oneline.component.scss'],
})
export class DeploymentOneLineComponent implements OnInit {
  depId = 0;
  dep: any = null;
  loading = true;
  twinLoading = true;
  syncedAt = '';
  summary: any = {};

  // Digital twin data (same tables as main platform)
  twinNodes: TwinNode[] = [];
  relationships: any[] = [];
  twinConfigured = false;

  // Deployment devices (for legend)
  devices: any[] = [];
  deviceLegend: { type: string; count: number }[] = [];

  // Drawing documents
  drawingDocs: any[] = [];

  // Node click
  selectedNode: TwinNode | null = null;

  // Exposed for template — ECBS badges on bus bar
  _busBadges: TwinNode[] = [];

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
    this.twinLoading = true;
    this.api.get(`/api/dep/deployments/${this.depId}`).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.summary = this.dep.summary || {};
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.loading = false;
        // Load twin using the deployment's project_id
        const pid = this.dep.project_id || (this.dep.project_info && this.dep.project_info.id);
        if (pid) { this._loadTwin(pid); } else { this.twinLoading = false; }
      },
      error: () => { this.loading = false; this.twinLoading = false; }
    });

    this.api.get(`/api/dep/deployments/${this.depId}/devices`).subscribe({
      next: (r: any) => {
        this.devices = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        this._buildLegend();
      },
      error: () => {}
    });

    this.api.get(`/api/dep/deployments/${this.depId}/documents`).subscribe({
      next: (r: any) => {
        this.drawingDocs = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
      },
      error: () => {}
    });
  }

  private _loadTwin(projectId: number) {
    this.api.get(`/api/digital-twin/?project_id=${projectId}`).subscribe({
      next: (r: any) => {
        const twins: any[] = r && r.data ? r.data : [];
        if (twins.length > 0) {
          this._loadTwinSnapshot(twins[0].id);
        } else {
          // Fall back to capacity assets
          this.api.get(`/api/capacity/assets?project_id=${projectId}`).subscribe({
            next: (r2: any) => {
              const raw: any[] = r2 && r2.data ? r2.data : (r2 && r2.assets ? r2.assets : []);
              this.twinNodes = raw.map(a => this._mapAsset(a));
              this.twinConfigured = this.twinNodes.length > 0;
              this.twinLoading = false;
            },
            error: () => { this.twinLoading = false; }
          });
        }
      },
      error: () => { this.twinLoading = false; }
    });
  }

  private _loadTwinSnapshot(twinId: number) {
    this.api.get(`/api/digital-twin/${twinId}`).subscribe({
      next: (r: any) => {
        const snap = r && r.data && r.data.snapshot ? r.data.snapshot : {};
        const assets: any[] = snap.assets || [];
        this.relationships = snap.relationships || [];
        this.twinNodes = assets.map(a => this._mapAsset(a));
        this.twinConfigured = this.twinNodes.length > 0;
        this.twinLoading = false;
      },
      error: () => { this.twinLoading = false; }
    });
  }

  _mapAsset(a: any): TwinNode {
    let extra = a.extra;
    if (typeof extra === 'string') { try { extra = JSON.parse(extra); } catch (e) { extra = {}; } }
    return {
      dbId:            a.id,
      id:              a.asset_uid || String(a.id),
      type:            a.asset_type || a.type || 'unknown',
      label:           a.name || a.label || a.asset_uid || 'Asset',
      rated_kva:       a.kva_rating || a.rated_kva || null,
      amp_rating:      a.amp_rating || null,
      voltage_in:      a.voltage_primary || a.voltage_in || null,
      voltage_out:     a.voltage_secondary || a.voltage_out || null,
      used_kva:        a.used_kva || 0,
      utilization_pct: a.utilization_pct || null,
      status:          a.status || 'active',
      bus_id:          a.bus_id || null,
      drawing_ref:     a.drawing_ref || null,
      notes:           a.notes || null,
      extra:           extra || null,
    };
  }

  // ── Relationship helpers (same as digital-twin.component.ts) ─────────────

  private get _nodeByDbId(): {[id: number]: TwinNode} {
    const m: {[id: number]: TwinNode} = {};
    this.twinNodes.forEach(n => { m[n.dbId] = n; });
    return m;
  }

  private _feedsChildren(parentDbId: number): number[] {
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'feeds')
      .map(r => r.child_asset_id);
  }

  private _containsChildren(parentDbId: number): TwinNode[] {
    const byId = this._nodeByDbId;
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'contains')
      .map(r => byId[r.child_asset_id])
      .filter(n => !!n);
  }

  // ── SVG layout tree (same algorithm as digital-twin.component.ts) ─────────

  get svgNodes(): TwinSvgNode[] {
    if (!this.twinNodes.length) return [];

    const byId = this._nodeByDbId;
    const placed: {[dbId: number]: boolean} = {};
    const result: TwinSvgNode[] = [];

    const mkNode = (n: TwinNode, x: number, y: number, badges?: TwinNode[]): TwinSvgNode => {
      placed[n.dbId] = true;
      return Object.assign({}, n, { x: x, y: y, badges: badges || [] });
    };

    const utility = this.twinNodes.filter(n => n.type === 'utility_service')[0] || null;
    const xfmr    = this.twinNodes.filter(n => n.type === 'transformer')[0] || null;
    const swg     = this.twinNodes.filter(n => n.type === 'switchgear')[0] || null;
    const gen     = this.twinNodes.filter(n => n.type === 'generator')[0] || null;
    const ats     = this.twinNodes.filter(n => n.type === 'ats')[0] || null;

    if (utility) result.push(mkNode(utility, 390, 44));
    if (xfmr)    result.push(mkNode(xfmr, 390, 115, []));

    const swgBadges = swg ? this._containsChildren(swg.dbId) : [];
    if (swg) placed[swg.dbId] = true;

    if (gen) result.push(mkNode(gen, 685, 220));
    if (ats) result.push(mkNode(ats, 685, 295));

    const genAtsIds = [gen && gen.dbId, ats && ats.dbId].filter(function(x) { return !!x; });
    const swgChildIds = swg ? this._feedsChildren(swg.dbId) : [];
    const childNodes = swgChildIds.map(function(id) { return byId[id]; })
      .filter(function(n) { return n && genAtsIds.indexOf(n.dbId) < 0; });

    const circuits = childNodes.filter(function(n) { return n.type === 'circuit'; });
    const panels   = childNodes.filter(function(n) { return n.type === 'panel'; });

    const row1Count = circuits.length;
    const row1Start = 60, row1End = 620;
    const row1Step  = row1Count > 1 ? (row1End - row1Start) / (row1Count - 1) : 0;
    const self = this;
    circuits.forEach(function(n, i) {
      const badges = self._containsChildren(n.dbId);
      result.push(mkNode(n, row1Start + i * row1Step, 248, badges));
    });

    const row2Count = panels.length;
    const row2Start = row1Start + 30, row2End = row1End - 30;
    const row2Step  = row2Count > 1 ? (row2End - row2Start) / (row2Count - 1) : 0;
    panels.forEach(function(n, i) {
      result.push(mkNode(n, row2Start + i * row2Step, 350, []));
    });

    this._busBadges = swgBadges;
    return result;
  }

  // ── Node click ───────────────────────────────────────────────────────────

  selectNode(n: TwinNode) { this.selectedNode = n; }
  closeNode() { this.selectedNode = null; }

  // ── SVG helpers ──────────────────────────────────────────────────────────

  shortLabel(label: string, max: number): string {
    if (!label) return '';
    return label.length > max ? label.substring(0, max - 1) + '\u2026' : label;
  }

  // ── Derived getters ──────────────────────────────────────────────────────

  get depName(): string { return (this.dep && this.dep.deployment_name) || '\u2014'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '\u2014'; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '\u2014';
  }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || ''; }

  get devicesInstalled(): number { return (this.summary && this.summary.installed) || 0; }
  get totalDevices(): number { return (this.summary && this.summary.total_devices) || 0; }
  get openIssues(): number { return (this.summary && this.summary.open_issues) || 0; }
  get totalDrawings(): number { return this.drawingDocs.length; }
  get totalDeviceLegend(): number { return this.deviceLegend.reduce(function(a, b) { return a + b.count; }, 0); }
  get currentDoc(): any { return this.drawingDocs.filter(function(d) { return d.current; })[0] || this.drawingDocs[0] || null; }

  // Total panels = circuit + panel type nodes in the twin
  get totalPanels(): number {
    return this.twinNodes.filter(function(n) {
      return n.type === 'circuit' || n.type === 'panel' || n.type === 'switchgear';
    }).length;
  }

  // Transformer label from twin
  get transformerLabel(): string {
    const x = this.twinNodes.filter(function(n) { return n.type === 'transformer'; })[0];
    if (!x) return '';
    const parts: string[] = [];
    if (x.label) parts.push(x.label);
    if (x.rated_kva) parts.push(x.rated_kva + ' kVA');
    if (x.voltage_in) parts.push(x.voltage_in + 'V');
    if (x.voltage_out) parts.push(x.voltage_out + 'V');
    return parts.join(' \u2022 ');
  }

  get twinStatus(): string {
    if (!this.twinNodes.length) return 'Not Configured';
    const hasSub = this.twinNodes.filter(function(n) {
      const t = n.type.toLowerCase();
      return t === 'panel' || t === 'switchgear' || t === 'circuit';
    }).length > 0;
    return hasSub ? 'Active' : 'Draft';
  }

  private _buildLegend() {
    const counts: {[k: string]: number} = {};
    for (const d of this.devices) {
      const t = d.device_type || 'Other';
      counts[t] = (counts[t] || 0) + 1;
    }
    if (Object.keys(counts).length) {
      this.deviceLegend = Object.keys(counts).map(function(type) { return { type: type, count: counts[type] }; });
    }
  }

  statusClass(s: string): string {
    if (!s) return 'dim';
    const sl = s.toLowerCase();
    if (sl === 'commissioned' || sl === 'approved' || sl === 'active') return 'green';
    if (sl === 'in progress' || sl === 'in_progress') return 'blue';
    if (sl === 'pending') return 'amber';
    if (sl === 'failed' || sl === 'rejected') return 'red';
    return 'dim';
  }

  goDevices()      { this.router.navigate(['/ecbs/deployment', this.depId, 'devices']); }
  goEngineering()  { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }
  goDocuments()    { this.router.navigate(['/ecbs/deployment', this.depId, 'documents']); }
  goIssues()       { this.router.navigate(['/ecbs/deployment', this.depId, 'issues']); }
}
