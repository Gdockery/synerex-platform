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

// Real snapshot asset (from digital twin topology)
export interface TwinNode {
  id: string;
  type: string;
  label: string;
  rated_kva?: number;
  voltage_in?: number;
  voltage_out?: number;
  used_kva?: number;
  utilization_pct?: number;
  status?: string;
}

@Component({
  selector: 'ecbs-digital-twin',
  templateUrl: './digital-twin.component.html',
  styleUrls: ['./digital-twin.component.scss'],
})
export class DigitalTwinComponent implements OnInit {
  projectId: number;
  projectName = '';

  // Real assets from API (topology nodes with live data)
  twinNodes: TwinNode[] = [];
  relationships: any[] = [];
  loading = true;
  cbi: any = null;

  // Simulation state
  activeCategory: 'All' | 'Loads' | 'HVAC' | 'IT' | 'Process' = 'All';
  assetSearch = '';
  selectedLibraryAsset: SimAsset | null = null;
  selectedNodeId = '';
  activeScenarioId: number | null = null;
  scenarios: Scenario[] = [];  // Start empty — no fake pre-loaded scenarios

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

  // SLD upload / GPU analysis
  sldUploading  = false;
  sldJobId: number|null = null;
  sldJobStatus  = '';          // 'pending' | 'processing' | 'done' | 'error'
  sldError      = '';
  sldPollTimer: any = null;
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

    // Load digital twin assets
    this.api.get(`/api/digital-twin/?site_id=${pid}`).subscribe({
      next: (r: any) => {
        const twins: any[] = r?.data || [];
        if (twins.length > 0) {
          const twin = twins[0];
          this.loadTwinSnapshot(twin.id);
        } else {
          // Fall back to capacity assets
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
      error: () => {
        this.api.get(`/api/capacity/assets?project_id=${pid}`).subscribe({
          next: (r2: any) => {
            const raw: any[] = r2?.data || r2?.assets || [];
            this.twinNodes = raw.map(a => this._mapAsset(a));
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      }
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
    return {
      id:              a.asset_uid || a.id,
      type:            a.asset_type || a.type || 'unknown',
      label:           a.name || a.label || a.asset_uid || 'Asset',
      rated_kva:       a.kva_rating || a.rated_kva || null,
      voltage_in:      a.voltage_primary || a.voltage_in || null,
      voltage_out:     a.voltage_secondary || a.voltage_out || null,
      used_kva:        a.used_kva || 0,
      utilization_pct: a.utilization_pct || null,
      status:          a.status || 'active',
    };
  }

  // ── SLD upload & GPU analysis ──────────────────────────────────────────────

  triggerSldInput() {
    const el = document.getElementById('sldFileInputEl') as HTMLInputElement;
    if (el) { el.click(); }
  }

  onSldFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) { return; }
    this.uploadSld(file);
  }

  uploadSld(file: File) {
    this.sldUploading = true;
    this.sldError     = '';
    this.sldJobStatus = 'pending';

    const fd = new FormData();
    fd.append('file', file, file.name);
    if (this.currentLoadKw > 0) {
      fd.append('bill_peak_kw', String(Math.round(this.currentLoadKw)));
    }

    this.api.postFormData('/api/sld/analyze', fd).subscribe({
      next: (r: any) => {
        this.sldUploading = false;
        this.sldJobId     = r?.job_id;
        this.sldJobStatus = 'processing';
        this.startSldPoll();
      },
      error: (e: any) => {
        this.sldUploading = false;
        this.sldJobStatus = 'error';
        this.sldError     = e?.error?.error || 'Upload failed';
      }
    });
  }

  startSldPoll() {
    if (this.sldPollTimer) { clearInterval(this.sldPollTimer); }
    this.sldPollTimer = setInterval(() => { this.checkSldStatus(); }, 20000);
  }

  checkSldStatus() {
    if (!this.sldJobId) { return; }
    this.api.get(`/api/sld/analyze/${this.sldJobId}`).subscribe({
      next: (r: any) => {
        if (r?.status === 'done') {
          clearInterval(this.sldPollTimer);
          this.sldJobStatus = 'done';
          this.applySldResult(r?.result || {});
        } else if (r?.status === 'error') {
          clearInterval(this.sldPollTimer);
          this.sldJobStatus = 'error';
          this.sldError = r?.error || 'GPU analysis failed';
        }
      },
      error: () => {}
    });
  }

  applySldResult(result: any) {
    // Fetch the topology format from the dedicated endpoint
    this.api.get(`/api/sld/${this.sldJobId}/topology`).subscribe({
      next: (r: any) => {
        this.topoMeters = r?.topo_meters || [];
        // Now seed the digital twin
        this.seedTwinFromSld();
      },
      error: () => {}
    });
  }

  seedTwinFromSld() {
    if (!this.sldJobId) { return; }
    this.api.post(`/api/project/${this.projectId}/sld/seed-twin`, { gpu_id: this.sldJobId }).subscribe({
      next: (r: any) => {
        this.showSldUpload = false;
        this.loadTwinData(); // Reload topology after seeding
      },
      error: () => {}
    });
  }

  // ── Auth ────────────────────────────────────────────────────────
  get isAdmin(): boolean {
    const role = Number(this.userService.user?.role);
    return role === 4 || role === 8;
  }

  // ── Twin topology ───────────────────────────────────────────────
  get transformer(): TwinNode | null {
    return this.twinNodes.find(n => n.type.toLowerCase().includes('transform') && n.rated_kva > 0) || null;
  }
  get panelNodes(): TwinNode[] {
    return this.twinNodes.filter(n => {
      const t = n.type.toLowerCase();
      return t.includes('panel') || t.includes('switchgear') || t.includes('mcc') || t.includes('bus');
    });
  }
  get hasSubAssets(): boolean { return this.panelNodes.length > 0; }
  get twinStatus(): string {
    if (!this.transformer) return 'Not Configured';
    return this.hasSubAssets ? 'Active' : 'Draft';
  }

  // ── Simulation node list (real panels only) ─────────────────────
  get simulationTargets(): string[] {
    if (this.panelNodes.length > 0) return this.panelNodes.map(n => n.label);
    return this.transformer ? [this.transformer.label] : ['Main Panel'];
  }

  // ── Asset Library filter ────────────────────────────────────────
  get filteredAssets(): SimAsset[] {
    return this.libraryAssets.filter(a => {
      const catOk = this.activeCategory === 'All' || a.category === this.activeCategory;
      const searchOk = !this.assetSearch || a.name.toLowerCase().includes(this.assetSearch.toLowerCase());
      return catOk && searchOk;
    });
  }
  selectLibraryAsset(a: SimAsset) { this.selectedLibraryAsset = a; }

  // ── Scenarios ──────────────────────────────────────────────────
  get activeScenario(): Scenario | null {
    return this.scenarios.find(s => s.id === this.activeScenarioId) || null;
  }
  selectScenario(id: number) { this.activeScenarioId = id; }

  runSimulation() {
    if (!this.selectedLibraryAsset) return;
    const next = this.scenarios.length + 1;
    const target = this.selectedNodeId || this.simulationTargets[0] || 'Main Panel';
    this.scenarios.push({
      id: next,
      label: `Scenario ${next}`,
      assetName: this.selectedLibraryAsset.name,
      targetNode: target,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      additionalKw:  this.selectedLibraryAsset.kw,
      additionalKva: this.selectedLibraryAsset.kva,
    });
    this.activeScenarioId = next;
    this.selectedLibraryAsset = null;
  }

  // ── Derived values ──────────────────────────────────────────────
  get cbiScore(): number { return this.cbi?.score ?? this.cbi?.cbi_score ?? 0; }
  get transformerKva(): number { return this.transformer?.rated_kva || 0; }
  get currentLoadKva(): number { return this.transformer?.used_kva || 0; }
  get currentLoadKw(): number { return this.currentLoadKva * 0.85; }

  get additionalKw(): number  { return this.activeScenario?.additionalKw  || 0; }
  get additionalKva(): number { return this.activeScenario?.additionalKva || 0; }
  get newTotalKva(): number   { return this.currentLoadKva + this.additionalKva; }
  get newTotalKw(): number    { return this.currentLoadKw + this.additionalKw; }
  get loadIncreasePct(): number { return this.currentLoadKw > 0 ? this.additionalKw / this.currentLoadKw * 100 : 0; }

  get xfmrLoadPct(): number   { return this.transformerKva > 0 ? this.newTotalKva / this.transformerKva * 100 : 0; }
  get siteLoadPct(): number   { return this.xfmrLoadPct; }
  get systemHeadroomKva(): number { return Math.max(0, this.transformerKva - this.newTotalKva); }
  get systemHeadroomPct(): number { return this.transformerKva > 0 ? this.systemHeadroomKva / this.transformerKva * 100 : 0; }

  get projectedUnbalance(): number { return Math.min(15, this.loadIncreasePct * 0.12); }
  get neutralLoading(): number     { return Math.min(100, 30 + this.loadIncreasePct * 0.8); }
  get thdiImpact(): number         { return Math.min(10, this.loadIncreasePct * 0.013); }

  get additionalEnergyCost(): number { return Math.round(this.additionalKw * 8760 * 0.09); }
  get potentialSavings(): number     { return Math.round(this.additionalEnergyCost * 0.196); }
  get netImpact(): number            { return this.additionalEnergyCost - this.potentialSavings; }
  get roiImpact(): number            { return this.potentialSavings / Math.max(1, this.additionalEnergyCost) * 100 - 100; }

  get xfmrUpgradeNeeded(): boolean  { return this.xfmrLoadPct > 90; }
  get swgrUpgradeNeeded(): boolean  { return this.xfmrLoadPct > 85; }

  get recommendation(): string {
    if (!this.activeScenario) return 'Select an asset from the library and click Run Simulation.';
    if (this.xfmrUpgradeNeeded) return 'Transformer upgrade required before adding this load.';
    if (this.xfmrLoadPct > 80) return 'Approaching capacity threshold. Monitor closely after installation.';
    return 'No immediate upgrade required. System remains within acceptable limits.';
  }
  get recommendationOk(): boolean { return !!this.activeScenario && !this.xfmrUpgradeNeeded && this.xfmrLoadPct <= 80; }

  nodeColor(n: TwinNode): string {
    const t = n.type.toLowerCase();
    if (t.includes('utility')) return '#29b6f6';
    if (t.includes('transform')) return '#29b6f6';
    if (t.includes('panel') || t.includes('switchgear')) return '#ffd740';
    if (t.includes('mcc')) return '#ce93d8';
    if (t.includes('filter') || t.includes('apf')) return '#00e676';
    return '#546e7a';
  }

  loadColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
  formatCurrency(n: number): string { return '$' + n.toLocaleString(); }
}
