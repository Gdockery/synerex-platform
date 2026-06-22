import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

export interface SimAsset {
  id: string;
  name: string;
  category: 'Loads' | 'HVAC' | 'IT' | 'Process';
  kw: number;
  kva: number;
  voltage: string;
  phase: string;
  icon: string;
}

export interface Scenario {
  id: number;
  label: string;
  assetName: string;
  targetNode: string;
  date: string;
  additionalKw: number;
  additionalKva: number;
}

export interface TwinNode {
  dbId: number;
  id: string;           // asset_uid
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

// Positioned node for SVG rendering
export interface TwinSvgNode extends TwinNode {
  x: number;
  y: number;
  badges: TwinNode[];   // ECBS/contains children shown as inline badges
}

@Component({
  selector: 'ecbs-digital-twin',
  templateUrl: './digital-twin.component.html',
  styleUrls: ['./digital-twin.component.scss'],
})
export class DigitalTwinComponent implements OnInit {
  projectId: number;
  projectName = '';

  twinNodes: TwinNode[] = [];
  relationships: any[] = [];
  loading = true;
  cbi: any = null;

  // Click-to-edit (any TwinNode or TwinSvgNode)
  selectedNode: any = null;
  editingLabel = '';
  editingNotes = '';

  // Simulation state
  activeCategory: 'All' | 'Loads' | 'HVAC' | 'IT' | 'Process' = 'All';
  assetSearch = '';
  selectedLibraryAsset: SimAsset | null = null;
  selectedNodeId = '';
  activeScenarioId: number | null = null;
  scenarios: Scenario[] = [];

  readonly libraryAssets: SimAsset[] = [
    { id: 'mot500', name: '500 HP Motor',      category: 'Loads',   kw: 375, kva: 468, voltage: '480V', phase: '3Ø', icon: 'fa-cog' },
    { id: 'mot250', name: '250 HP Motor',      category: 'Loads',   kw: 186, kva: 233, voltage: '480V', phase: '3Ø', icon: 'fa-cog' },
    { id: 'chl300', name: 'Chiller – 300 Ton', category: 'HVAC',    kw: 211, kva: 264, voltage: '480V', phase: '3Ø', icon: 'fa-snowflake-o' },
    { id: 'dhm',    name: 'Data Hall Module',  category: 'IT',      kw: 500, kva: 625, voltage: '480V', phase: '3Ø', icon: 'fa-server' },
    { id: 'ev',     name: 'EV Charger (DCFC)', category: 'Loads',   kw: 150, kva: 188, voltage: '480V', phase: '3Ø', icon: 'fa-bolt' },
    { id: 'pl',     name: 'Production Line',   category: 'Process', kw: 480, kva: 600, voltage: '480V', phase: '3Ø', icon: 'fa-industry' },
    { id: 'lp',     name: 'Lighting Package',  category: 'Loads',   kw: 25,  kva: 31,  voltage: '480V', phase: '3Ø', icon: 'fa-lightbulb-o' },
    { id: 'hvac50', name: 'HVAC Unit – 50 Ton',category: 'HVAC',    kw: 70,  kva: 88,  voltage: '480V', phase: '3Ø', icon: 'fa-snowflake-o' },
    { id: 'ups',    name: 'UPS – 100 kVA',     category: 'IT',      kw: 80,  kva: 100, voltage: '480V', phase: '3Ø', icon: 'fa-battery-full' },
    { id: 'weld',   name: 'Welding Station',   category: 'Process', kw: 60,  kva: 75,  voltage: '480V', phase: '3Ø', icon: 'fa-wrench' },
  ];

  // SLD upload
  sldUploading  = false;
  sldJobStatus  = '';
  sldError      = '';
  showSldUpload = false;
  topoMeters: any[] = [];

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';
    this.loadTwinData();
  }

  loadTwinData() {
    this.loading = true;
    const pid = this.projectId;
    this.api.get(`/api/digital-twin/?project_id=${pid}`).subscribe({
      next: (r: any) => {
        const twins: any[] = r?.data || [];
        if (twins.length > 0) {
          this.loadTwinSnapshot(twins[0].id);
        } else {
          this.api.get(`/api/capacity/assets?project_id=${pid}`).subscribe({
            next: (r2: any) => {
              const raw: any[] = r2?.data || r2?.assets || [];
              this.twinNodes = raw.map(a => this._mapAsset(a));
              this.loading = false;
            },
            error: () => { this.loading = false; }
          });
        }
      },
      error: () => { this.loading = false; }
    });

    this.api.get(`/api/current-balance/summary?project_id=${pid}`).subscribe({
      next: (r: any) => { this.cbi = r; }, error: () => {}
    });
  }

  loadTwinSnapshot(twinId: number) {
    this.api.get(`/api/digital-twin/${twinId}`).subscribe({
      next: (r: any) => {
        const snap = r?.data?.snapshot || {};
        const assets: any[] = snap.assets || [];
        this.relationships  = snap.relationships || [];
        this.twinNodes = assets.map(a => this._mapAsset(a));
        this.loading = false;
      },
      error: () => { this.loading = false; }
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

  // ── Relationship helpers ──────────────────────────────────────────

  private get _nodeByDbId(): {[id: number]: TwinNode} {
    const m: {[id: number]: TwinNode} = {};
    this.twinNodes.forEach(n => m[n.dbId] = n);
    return m;
  }

  // Returns "feeds" children IDs of a given node (by DB id)
  private _feedsChildren(parentDbId: number): number[] {
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'feeds')
      .map(r => r.child_asset_id);
  }

  // Returns "contains" children (ECBS badges) of a given node
  private _containsChildren(parentDbId: number): TwinNode[] {
    const byId = this._nodeByDbId;
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'contains')
      .map(r => byId[r.child_asset_id])
      .filter(n => !!n);
  }

  // ── SVG layout tree ───────────────────────────────────────────────
  // Computes positioned nodes for SVG rendering.
  // Layout: 780×500 viewBox
  //   Utility      → y=44
  //   Transformer  → y=108
  //   480V Bus bar → y=172
  //   Row 1 (circuits/chillers/generator+ATS) → y=248
  //   Row 2 (EQ panels) → y=340

  get svgNodes(): TwinSvgNode[] {
    if (!this.twinNodes.length) return [];

    const byId = this._nodeByDbId;
    const placed: {[dbId: number]: boolean} = {};
    const result: TwinSvgNode[] = [];

    const mkNode = (n: TwinNode, x: number, y: number, badges?: TwinNode[]): TwinSvgNode => {
      placed[n.dbId] = true;
      return Object.assign({}, n, { x: x, y: y, badges: badges || [] });
    };

    // ── Find typed nodes ─────────────────────────────────────────
    const utility    = this.twinNodes.find(n => n.type === 'utility_service');
    const xfmr       = this.twinNodes.find(n => n.type === 'transformer');
    const swg        = this.twinNodes.find(n => n.type === 'switchgear');
    const gen        = this.twinNodes.find(n => n.type === 'generator');
    const ats        = this.twinNodes.find(n => n.type === 'ats');

    // ── Utility (top center) ─────────────────────────────────────
    if (utility)  result.push(mkNode(utility, 390, 44));
    if (xfmr)     result.push(mkNode(xfmr, 390, 115, []));

    // ── Bus bar is rendered as an SVG line — no node needed ──────
    // Switchgear = the bus itself; ECBS badge on it
    const swgBadges = swg ? this._containsChildren(swg.dbId) : [];
    // Mark swg as placed but don't add as a separate boxed node
    if (swg) placed[swg.dbId] = true;

    // ── Generator + ATS (right side, emergency path) ─────────────
    if (gen) result.push(mkNode(gen, 685, 220));
    if (ats) result.push(mkNode(ats, 685, 295));

    // ── Children of main switchgear ───────────────────────────────
    const swgChildIds = swg ? this._feedsChildren(swg.dbId) : [];
    // Separate circuit/panel types, exclude gen/ats from list
    const genAtsIds = [gen && gen.dbId, ats && ats.dbId].filter(x => !!x);
    const childNodes = swgChildIds
      .map(id => byId[id])
      .filter(n => n && genAtsIds.indexOf(n.dbId) === -1);

    // Split children into circuits (PH-x, Chiller) and panels (EQ-xx)
    const circuits = childNodes.filter(n => n.type === 'circuit');
    const panels   = childNodes.filter(n => n.type === 'panel');

    // ── Row 1: Circuits across the bus, y=248 ────────────────────
    const row1Count = circuits.length;
    const row1Start = 60;
    const row1End   = 620;
    const row1Step  = row1Count > 1 ? (row1End - row1Start) / (row1Count - 1) : 0;
    circuits.forEach(function(n, i) {
      const badges = this._containsChildren(n.dbId);
      result.push(mkNode(n, row1Start + i * row1Step, 248, badges));
    }.bind(this));

    // ── Row 2: Panels, y=350 ──────────────────────────────────────
    const row2Count = panels.length;
    const row2Start = row1Start + 30;
    const row2End   = row1End - 30;
    const row2Step  = row2Count > 1 ? (row2End - row2Start) / (row2Count - 1) : 0;
    panels.forEach(function(n, i) {
      result.push(mkNode(n, row2Start + i * row2Step, 350, []));
    }.bind(this));

    // ── Store swg badges for template access ─────────────────────
    this._busBadges = swgBadges;

    return result;
  }

  // Exposed for template — ECBS badges on the bus bar itself
  _busBadges: TwinNode[] = [];

  get circuitNodes(): TwinSvgNode[] {
    return this.svgNodes.filter(n => n.type === 'circuit' || n.type === 'panel');
  }

  // ── Node click / edit ─────────────────────────────────────────
  selectNode(n: any) {
    this.selectedNode = n;
    this.editingLabel = n.label;
    this.editingNotes = n.notes || '';
  }

  closeNode() {
    this.selectedNode = null;
  }

  saveNodeLabel() {
    if (!this.selectedNode) return;
    // Optimistic update — persist via API in future iteration
    const match = this.twinNodes.find(n => n.dbId === this.selectedNode.dbId);
    if (match) {
      match.label = this.editingLabel;
      match.notes = this.editingNotes;
    }
    this.closeNode();
  }

  // ── SVG helpers ───────────────────────────────────────────────
  nodeStroke(n: TwinNode): string {
    const t = n.type.toLowerCase();
    if (t === 'utility_service') return '#29b6f6';
    if (t === 'transformer')     return '#29b6f6';
    if (t === 'generator')       return '#ffd740';
    if (t === 'ats')             return '#ffd740';
    if (t === 'ecbs')            return '#00e676';
    if (t === 'panel')           return '#ab47bc';
    if (t === 'circuit')         return '#546e7a';
    return '#546e7a';
  }

  nodeFill(n: TwinNode): string {
    const t = n.type.toLowerCase();
    if (t === 'utility_service' || t === 'transformer') return 'rgba(41,182,246,0.08)';
    if (t === 'generator' || t === 'ats')               return 'rgba(255,215,64,0.08)';
    if (t === 'ecbs')                                   return 'rgba(0,230,118,0.08)';
    if (t === 'panel')                                  return 'rgba(171,71,188,0.08)';
    return 'rgba(84,110,122,0.07)';
  }

  nodeIcon(n: TwinNode): string {
    const t = n.type.toLowerCase();
    if (t === 'utility_service') return '~';
    if (t === 'transformer')     return 'XF';
    if (t === 'generator')       return 'G';
    if (t === 'ats')             return 'ATS';
    if (t === 'ecbs')            return '⚡';
    if (t === 'panel')           return '▣';
    if (t === 'circuit')         return '—';
    return '?';
  }

  shortLabel(label: string, max: number): string {
    if (!label) return '';
    return label.length > max ? label.substring(0, max - 1) + '…' : label;
  }

  // ── Auth ──────────────────────────────────────────────────────
  get isAdmin(): boolean {
    const role = Number(this.userService.user?.role);
    return role === 4 || role === 8 || role === 9;
  }

  // ── Twin topology ─────────────────────────────────────────────
  get transformer(): TwinNode | null {
    return this.twinNodes.find(n => n.type === 'transformer') || null;
  }
  get panelNodes(): TwinNode[] {
    return this.twinNodes.filter(n => {
      const t = n.type.toLowerCase();
      return t === 'panel' || t === 'switchgear' || t === 'circuit';
    });
  }
  get hasSubAssets(): boolean { return this.panelNodes.length > 0; }
  get twinStatus(): string {
    if (!this.transformer && !this.twinNodes.length) return 'Not Configured';
    return this.hasSubAssets ? 'Active' : 'Draft';
  }
  get simulationTargets(): string[] {
    if (this.panelNodes.length > 0) return this.panelNodes.map(n => n.label);
    return this.transformer ? [this.transformer.label] : ['Main Panel'];
  }

  // ── Asset Library ──────────────────────────────────────────────
  get filteredAssets(): SimAsset[] {
    return this.libraryAssets.filter(function(a) {
      const catOk = this.activeCategory === 'All' || a.category === this.activeCategory;
      const searchOk = !this.assetSearch || a.name.toLowerCase().indexOf(this.assetSearch.toLowerCase()) >= 0;
      return catOk && searchOk;
    }.bind(this));
  }
  selectLibraryAsset(a: SimAsset) { this.selectedLibraryAsset = a; }

  // ── Scenarios ─────────────────────────────────────────────────
  get activeScenario(): Scenario | null {
    return this.scenarios.find(s => s.id === this.activeScenarioId) || null;
  }
  selectScenario(id: number) { this.activeScenarioId = id; }
  runSimulation() {
    if (!this.selectedLibraryAsset) return;
    const next   = this.scenarios.length + 1;
    const target = this.selectedNodeId || this.simulationTargets[0] || 'Main Panel';
    this.scenarios.push({
      id: next, label: `Scenario ${next}`,
      assetName: this.selectedLibraryAsset.name, targetNode: target,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      additionalKw: this.selectedLibraryAsset.kw, additionalKva: this.selectedLibraryAsset.kva,
    });
    this.activeScenarioId = next;
    this.selectedLibraryAsset = null;
  }

  // ── Derived simulation values ──────────────────────────────────
  get cbiScore(): number          { return this.cbi?.score ?? this.cbi?.cbi_score ?? 0; }
  get transformerKva(): number    { return this.transformer?.rated_kva || 0; }
  get currentLoadKva(): number    { return this.transformer?.used_kva || 0; }
  get currentLoadKw(): number     { return this.currentLoadKva * 0.85; }
  get additionalKw(): number      { return this.activeScenario?.additionalKw  || 0; }
  get additionalKva(): number     { return this.activeScenario?.additionalKva || 0; }
  get newTotalKva(): number       { return this.currentLoadKva + this.additionalKva; }
  get newTotalKw(): number        { return this.currentLoadKw + this.additionalKw; }
  get loadIncreasePct(): number   { return this.currentLoadKw > 0 ? this.additionalKw / this.currentLoadKw * 100 : 0; }
  get xfmrLoadPct(): number       { return this.transformerKva > 0 ? this.newTotalKva / this.transformerKva * 100 : 0; }
  get siteLoadPct(): number       { return this.xfmrLoadPct; }
  get systemHeadroomKva(): number { return Math.max(0, this.transformerKva - this.newTotalKva); }
  get systemHeadroomPct(): number { return this.transformerKva > 0 ? this.systemHeadroomKva / this.transformerKva * 100 : 0; }
  get projectedUnbalance(): number{ return Math.min(15, this.loadIncreasePct * 0.12); }
  get neutralLoading(): number    { return Math.min(100, 30 + this.loadIncreasePct * 0.8); }
  get thdiImpact(): number        { return Math.min(10, this.loadIncreasePct * 0.013); }
  get additionalEnergyCost(): number { return Math.round(this.additionalKw * 8760 * 0.09); }
  get potentialSavings(): number  { return Math.round(this.additionalEnergyCost * 0.196); }
  get netImpact(): number         { return this.additionalEnergyCost - this.potentialSavings; }
  get xfmrUpgradeNeeded(): boolean{ return this.xfmrLoadPct > 90; }
  get swgrUpgradeNeeded(): boolean{ return this.xfmrLoadPct > 85; }
  get recommendation(): string {
    if (!this.activeScenario) return 'Select an asset from the library and click Run Simulation.';
    if (this.xfmrUpgradeNeeded) return 'Transformer upgrade required before adding this load.';
    if (this.xfmrLoadPct > 80)  return 'Approaching capacity. Monitor closely after installation.';
    return 'No immediate upgrade required. System within acceptable limits.';
  }
  get recommendationOk(): boolean { return !!this.activeScenario && !this.xfmrUpgradeNeeded && this.xfmrLoadPct <= 80; }

  loadColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
  formatCurrency(n: number): string { return '$' + n.toLocaleString(); }

  // ── SLD upload ─────────────────────────────────────────────────
  triggerSldInput() {
    const el = document.getElementById('sldFileInputEl') as HTMLInputElement;
    if (el) { el.click(); }
  }
  onSldFileSelected(event: any) {
    const file = event && event.target && event.target.files && event.target.files[0];
    if (!file) { return; }
    this.uploadSld(file);
  }
  uploadSld(file: File) {
    this.sldUploading = true;
    this.sldError     = '';
    this.sldJobStatus = 'processing';
    const fd = new FormData();
    fd.append('file', file, file.name);
    this.api.postFormData(`/api/project/${this.projectId}/sld/analyze-and-seed`, fd).subscribe({
      next: (r: any) => {
        this.sldUploading = false;
        this.sldJobStatus = 'done';
        this.topoMeters   = r && r.topo_meters ? r.topo_meters : [];
        this.showSldUpload = false;
        this.loadTwinData();
      },
      error: (e: any) => {
        this.sldUploading = false;
        this.sldJobStatus = 'error';
        this.sldError = (e && e.error && e.error.error) ? e.error.error : 'Analysis failed — check GPU server';
      }
    });
  }
}
