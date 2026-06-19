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
  targetPanel: string;
  date: string;
  additionalKw: number;
  additionalKva: number;
}

@Component({
  selector: 'ecbs-digital-twin',
  templateUrl: './digital-twin.component.html',
  styleUrls: ['./digital-twin.component.scss'],
})
export class DigitalTwinComponent implements OnInit {
  projectId: number;
  projectName = '';
  assets: any[] = [];
  cbi: any = null;
  loading = true;

  // Simulation state
  activeCategory: 'All' | 'Loads' | 'HVAC' | 'IT' | 'Process' = 'All';
  assetSearch = '';
  selectedLibraryAsset: SimAsset | null = null;
  selectedPanel = 'Panel A';
  activeScenarioId = 1;
  scenarios: Scenario[] = [
    { id: 1, label: 'Scenario 1', assetName: '500 HP Motor', targetPanel: 'Panel B', date: 'Jun 1, 2025', additionalKw: 375, additionalKva: 468 },
    { id: 2, label: 'Scenario 2', assetName: 'Data Hall Expansion', targetPanel: 'SWGR-1', date: 'Aug 15, 2025', additionalKw: 500, additionalKva: 625 },
    { id: 3, label: 'Scenario 3', assetName: 'Chiller Addition', targetPanel: 'Panel A', date: 'Sep 1, 2025', additionalKw: 211, additionalKva: 264 },
    { id: 4, label: 'Scenario 4', assetName: 'EV Chargers (10)', targetPanel: 'Panel B', date: 'Oct 1, 2025', additionalKw: 120, additionalKva: 150 },
    { id: 5, label: 'Scenario 5', assetName: 'Production Line', targetPanel: 'SWGR-1', date: 'Nov 1, 2025', additionalKw: 480, additionalKva: 600 },
  ];

  panels = ['Panel A', 'MCC-1', 'SWGR-1', 'Panel B'];

  readonly libraryAssets: SimAsset[] = [
    { id: 'mot500', name: '500 HP Motor', category: 'Loads', kw: 375, kva: 468, voltage: '480V', phase: '3Ø', icon: 'fa-cog' },
    { id: 'mot250', name: '250 HP Motor', category: 'Loads', kw: 186, kva: 233, voltage: '480V', phase: '3Ø', icon: 'fa-cog' },
    { id: 'chl300', name: 'Chiller – 300 Ton', category: 'HVAC', kw: 211, kva: 264, voltage: '480V', phase: '3Ø', icon: 'fa-snowflake-o' },
    { id: 'dhm',    name: 'Data Hall Module', category: 'IT',   kw: 500, kva: 625, voltage: '480V', phase: '3Ø', icon: 'fa-server' },
    { id: 'ev',     name: 'EV Charger (DCFC)', category: 'Loads', kw: 150, kva: 188, voltage: '480V', phase: '3Ø', icon: 'fa-bolt' },
    { id: 'pl',     name: 'Production Line', category: 'Process', kw: 480, kva: 600, voltage: '480V', phase: '3Ø', icon: 'fa-industry' },
    { id: 'lp',     name: 'Lighting Package', category: 'Loads', kw: 25, kva: 31, voltage: '480V', phase: '3Ø', icon: 'fa-lightbulb-o' },
    { id: 'hvac50', name: 'HVAC Unit – 50 Ton', category: 'HVAC', kw: 70, kva: 88, voltage: '480V', phase: '3Ø', icon: 'fa-snowflake-o' },
    { id: 'ups',    name: 'UPS System – 100 kVA', category: 'IT', kw: 80, kva: 100, voltage: '480V', phase: '3Ø', icon: 'fa-battery-full' },
    { id: 'weld',   name: 'Welding Station', category: 'Process', kw: 60, kva: 75, voltage: '480V', phase: '3Ø', icon: 'fa-wrench' },
  ];

  dtSteps = [
    { label: 'One-Line Scanner', done: false },
    { label: 'Draft Digital Twin', done: false },
    { label: 'Field Verification', done: false },
    { label: 'Engineering Review', done: false },
    { label: 'Approved', done: false },
    { label: 'Locked (Operational)', done: false },
  ];

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        this.assets = r?.data || r?.assets || [];
        this.loading = false;
        if (this.assets.length > 0) {
          this.dtSteps[0].done = true;
          this.dtSteps[1].done = true;
        }
      },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/current-balance/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.cbi = r; }, error: () => {}
    });
  }

  // ── Asset Library ──────────────────────────────────────────────
  get filteredAssets(): SimAsset[] {
    return this.libraryAssets.filter(a => {
      const catOk = this.activeCategory === 'All' || a.category === this.activeCategory;
      const searchOk = !this.assetSearch || a.name.toLowerCase().includes(this.assetSearch.toLowerCase());
      return catOk && searchOk;
    });
  }

  selectLibraryAsset(a: SimAsset) { this.selectedLibraryAsset = a; }

  // ── Scenarios ─────────────────────────────────────────────────
  get activeScenario(): Scenario {
    return this.scenarios.find(s => s.id === this.activeScenarioId) || this.scenarios[0];
  }

  selectScenario(id: number) { this.activeScenarioId = id; }

  addScenario() {
    const next = this.scenarios.length + 1;
    const asset = this.selectedLibraryAsset || this.libraryAssets[0];
    this.scenarios.push({
      id: next, label: `Scenario ${next}`, assetName: asset.name,
      targetPanel: this.selectedPanel, date: 'TBD', additionalKw: asset.kw, additionalKva: asset.kva
    });
    this.activeScenarioId = next;
    this.selectedLibraryAsset = null;
  }

  runSimulation() {
    if (!this.selectedLibraryAsset) return;
    const next = this.scenarios.length + 1;
    this.scenarios.push({
      id: next, label: `Scenario ${next}`, assetName: this.selectedLibraryAsset.name,
      targetPanel: this.selectedPanel, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      additionalKw: this.selectedLibraryAsset.kw, additionalKva: this.selectedLibraryAsset.kva
    });
    this.activeScenarioId = next;
  }

  // ── Derived values ─────────────────────────────────────────────
  get cbiScore(): number { return this.cbi?.score ?? this.cbi?.cbi_score ?? 0; }
  get twinStatus(): string { return this.assets.length > 0 ? 'Active' : 'Not Configured'; }
  get statusPillClass(): string { return this.assets.length > 0 ? 'hsp-excellent' : 'hsp-poor'; }

  get transformerKva(): number {
    return this.assets.reduce((s, a) => s + (a.capacity_kva || a.rated_kva || a.kva_rating || 0), 0) || 1800;
  }
  get currentLoadKw(): number {
    return this.assets.reduce((s, a) => s + (a.current_load_kva || a.used_kva || 0), 0) * 0.85 || 1307;
  }
  get currentLoadKva(): number { return this.currentLoadKw / 0.85; }

  // Simulation impact
  get additionalKw(): number { return this.activeScenario.additionalKw; }
  get additionalKva(): number { return this.activeScenario.additionalKva; }
  get newTotalKw(): number { return this.currentLoadKw + this.additionalKw; }
  get newTotalKva(): number { return this.currentLoadKva + this.additionalKva; }
  get loadIncreasePct(): number { return this.currentLoadKw > 0 ? this.additionalKw / this.currentLoadKw * 100 : 0; }

  // Panel impacts (simulate Panel B = ~30% of load)
  get panelBCurrentKva(): number { return this.currentLoadKva * 0.3; }
  get panelBNewKva(): number { return this.panelBCurrentKva + (this.activeScenario.targetPanel === 'Panel B' ? this.additionalKva : 0); }
  get panelBLoadPct(): number { return this.transformerKva > 0 ? this.panelBNewKva / (this.transformerKva * 0.4) * 100 : 0; }

  get xfmrLoadPct(): number { return this.transformerKva > 0 ? this.newTotalKva / this.transformerKva * 100 : 0; }
  get siteLoadPct(): number { return this.xfmrLoadPct; }
  get systemHeadroomKva(): number { return Math.max(0, this.transformerKva - this.newTotalKva); }
  get systemHeadroomPct(): number { return this.transformerKva > 0 ? this.systemHeadroomKva / this.transformerKva * 100 : 0; }

  // Current balance impact
  get projectedUnbalance(): number { return Math.min(15, this.loadIncreasePct * 0.12); }
  get neutralLoading(): number { return Math.min(100, 30 + this.loadIncreasePct * 0.8); }
  get thdiImpact(): number { return Math.min(10, this.loadIncreasePct * 0.013); }

  // Financial
  get additionalEnergyCost(): number { return Math.round(this.additionalKw * 8760 * 0.09); }
  get potentialSavings(): number { return Math.round(this.additionalEnergyCost * 0.196); }
  get netImpact(): number { return this.additionalEnergyCost - this.potentialSavings; }
  get roiImpact(): number { return this.potentialSavings / Math.max(1, this.additionalEnergyCost) * 100 - 100; }

  // Upgrade requirements
  get xfmrUpgradeNeeded(): boolean { return this.xfmrLoadPct > 90; }
  get swgrUpgradeNeeded(): boolean { return this.xfmrLoadPct > 85; }
  get panelUpgradeNeeded(): boolean { return this.panelBLoadPct > 90; }

  get recommendation(): string {
    if (this.xfmrUpgradeNeeded) return 'Transformer upgrade required before adding this load. Current headroom insufficient.';
    if (this.xfmrLoadPct > 80) return 'Approaching capacity threshold. Monitor closely after installation.';
    return 'No immediate upgrade required. System remains within acceptable limits.';
  }
  get recommendationOk(): boolean { return !this.xfmrUpgradeNeeded && this.xfmrLoadPct <= 80; }

  loadColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
  formatCurrency(n: number): string { return '$' + n.toLocaleString(); }
}
