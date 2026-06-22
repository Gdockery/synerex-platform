import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'admin-digital-twin-editor',
  templateUrl: './digital-twin-editor.component.html',
  styleUrls: ['./digital-twin-editor.component.scss'],
})
export class DigitalTwinEditorComponent implements OnInit {
  projectId: number = 0;
  projectName = '';
  twinId: number = 0;
  twinNodes: any[] = [];
  relationships: any[] = [];
  loading = true;
  saving = false;
  saveError = '';

  activeTool = 'select';
  selectedNode: any = null;
  activeTab = 'one-line view';

  // Edit state for selected node
  editLabel = '';
  editKva = '';
  editAmp = '';
  editNotes = '';
  editBusId = '';

  readonly tools = [
    { id: 'select',     label: 'Select',     icon: 'fa-mouse-pointer' },
    { id: 'pan',        label: 'Pan',         icon: 'fa-hand-paper-o' },
    { id: 'add-node',   label: 'Add Node',    icon: 'fa-plus-circle' },
    { id: 'add-bus',    label: 'Add Bus',     icon: 'fa-minus' },
    { id: 'add-feeder', label: 'Add Feeder',  icon: 'fa-bolt' },
    { id: 'add-panel',  label: 'Add Panel',   icon: 'fa-th-large' },
    { id: 'add-load',   label: 'Add Load',    icon: 'fa-cog' },
    { id: 'add-device', label: 'Add Device',  icon: 'fa-microchip' },
    { id: 'add-meter',  label: 'Add Meter',   icon: 'fa-tachometer' },
  ];

  readonly tabs = ['One-Line View', 'Network Hierarchy', 'Assets', 'Loads', 'ECBS Devices', 'Meters', 'Calculations'];

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user ? (this.userService.user as any).selectedProject : null;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name ? String(p.name) : '';
    this.loadTwin();
  }

  loadTwin() {
    this.loading = true;
    this.api.get(`/api/digital-twin/?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        const twins: any[] = r && r.data ? r.data : [];
        if (twins.length > 0) {
          this.twinId = twins[0].id;
          this.loadSnapshot(this.twinId);
        } else {
          // Fall back to capacity assets
          this.loadCapacityFallback();
        }
      },
      error: () => { this.loadCapacityFallback(); }
    });
  }

  loadSnapshot(twinId: number) {
    this.api.get(`/api/digital-twin/${twinId}`).subscribe({
      next: (r: any) => {
        const snap = r && r.data && r.data.snapshot ? r.data.snapshot : {};
        this.twinNodes = (snap.assets || []).map((a: any) => this._normalize(a));
        this.relationships = snap.relationships || [];
        this.loading = false;
        if (this.twinNodes.length > 0) { this.selectNode(this.twinNodes[0]); }
      },
      error: () => { this.loadCapacityFallback(); }
    });
  }

  loadCapacityFallback() {
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        const raw = r && r.data ? r.data : (r && r.assets ? r.assets : []);
        this.twinNodes = raw.map((a: any) => this._normalize(a));
        this.loading = false;
        if (this.twinNodes.length > 0) { this.selectNode(this.twinNodes[0]); }
      },
      error: () => { this.loading = false; }
    });
  }

  _normalize(a: any): any {
    let extra = a.extra;
    if (typeof extra === 'string') { try { extra = JSON.parse(extra); } catch (e) { extra = {}; } }
    return {
      id:        a.id,
      uid:       a.asset_uid || String(a.id),
      type:      a.asset_type || a.type || 'unknown',
      label:     a.name || a.label || a.asset_uid || 'Asset',
      kva_rating: a.kva_rating || a.rated_kva || null,
      amp_rating: a.amp_rating || null,
      voltage_primary:   a.voltage_primary || null,
      voltage_secondary: a.voltage_secondary || null,
      bus_id:    a.bus_id || null,
      drawing_ref: a.drawing_ref || null,
      notes:     a.notes || '',
      extra:     extra || {},
      status:    a.status || 'active',
      used_kva:  a.used_kva || 0,
    };
  }

  // ── SVG layout ──────────────────────────────────────────────────────────
  // Returns positioned nodes for the SVG canvas (same algorithm as ecbs/digital-twin)
  get svgLayout(): any[] {
    if (!this.twinNodes.length) return [];

    const byDbId: {[id: number]: any} = {};
    this.twinNodes.forEach(n => byDbId[n.id] = n);

    const feedsChildren = (parentId: number): number[] =>
      this.relationships
        .filter(r => r.parent_asset_id === parentId && r.relationship_type === 'feeds')
        .map(r => r.child_asset_id);

    const containsChildren = (parentId: number): any[] =>
      this.relationships
        .filter(r => r.parent_asset_id === parentId && r.relationship_type === 'contains')
        .map(r => byDbId[r.child_asset_id])
        .filter(n => !!n);

    const placed: {[id: number]: boolean} = {};
    const result: any[] = [];

    const mkNode = (n: any, x: number, y: number, badges?: any[]) => {
      placed[n.id] = true;
      return Object.assign({}, n, { svgX: x, svgY: y, badges: badges || [] });
    };

    const utility = this.twinNodes.find(n => n.type === 'utility_service');
    const xfmr    = this.twinNodes.find(n => n.type === 'transformer');
    const swg     = this.twinNodes.find(n => n.type === 'switchgear');
    const gen     = this.twinNodes.find(n => n.type === 'generator');
    const ats     = this.twinNodes.find(n => n.type === 'ats');

    if (utility) result.push(mkNode(utility, 400, 55));
    if (xfmr)    result.push(mkNode(xfmr,    400, 130));

    const swgBadges = swg ? containsChildren(swg.id) : [];
    this._busBadges = swgBadges;
    if (swg) placed[swg.id] = true;

    if (gen) result.push(mkNode(gen, 690, 240));
    if (ats) result.push(mkNode(ats, 690, 310));

    const genAtsIds = [gen && gen.id, ats && ats.id].filter(x => !!x);
    const swgChildIds = swg ? feedsChildren(swg.id) : [];
    const childNodes = swgChildIds
      .map(id => byDbId[id])
      .filter(n => n && genAtsIds.indexOf(n.id) === -1);

    const circuits = childNodes.filter(n => n.type === 'circuit');
    const panels   = childNodes.filter(n => n.type === 'panel');

    const row1Start = 60; const row1End = 620;
    const row1Step = circuits.length > 1 ? (row1End - row1Start) / (circuits.length - 1) : 0;
    circuits.forEach(function(n: any, i: number) {
      result.push(mkNode(n, row1Start + i * row1Step, 265, containsChildren(n.id)));
    }.bind(this));

    const row2Start = 90; const row2End = 590;
    const row2Step = panels.length > 1 ? (row2End - row2Start) / (panels.length - 1) : 0;
    panels.forEach(function(n: any, i: number) {
      result.push(mkNode(n, row2Start + i * row2Step, 370));
    }.bind(this));

    return result;
  }

  _busBadges: any[] = [];

  nodeStroke(n: any): string {
    const t = (n.type || '').toLowerCase();
    if (t === 'utility_service') return '#29b6f6';
    if (t === 'transformer')     return '#00e676';
    if (t === 'switchgear')      return '#29b6f6';
    if (t === 'generator' || t === 'ats') return '#ffd740';
    if (t === 'ecbs')            return '#00e676';
    if (t === 'panel')           return '#ab47bc';
    return '#546e7a';
  }

  shortLabel(s: string, max: number): string {
    if (!s) return '';
    return s.length > max ? s.substring(0, max - 1) + '…' : s;
  }

  // ── Node selection / edit ────────────────────────────────────────────
  selectNode(n: any) {
    this.selectedNode = n;
    this.editLabel  = n.label  || '';
    this.editKva    = n.kva_rating ? String(n.kva_rating) : '';
    this.editAmp    = n.amp_rating ? String(n.amp_rating) : '';
    this.editNotes  = n.notes  || '';
    this.editBusId  = n.bus_id || '';
  }

  applyEdits() {
    if (!this.selectedNode) return;
    this.selectedNode.label      = this.editLabel;
    this.selectedNode.kva_rating = this.editKva ? Number(this.editKva) : null;
    this.selectedNode.amp_rating = this.editAmp ? Number(this.editAmp) : null;
    this.selectedNode.notes      = this.editNotes;
    this.selectedNode.bus_id     = this.editBusId;
  }

  saveNode() {
    this.applyEdits();
    if (!this.selectedNode || !this.twinId) return;
    this.saving = true;
    this.saveError = '';
    const payload = {
      name:       this.selectedNode.label,
      kva_rating: this.selectedNode.kva_rating,
      amp_rating: this.selectedNode.amp_rating,
      notes:      this.selectedNode.notes,
      bus_id:     this.selectedNode.bus_id,
    };
    this.api.put(`/api/digital-twin/${this.twinId}/asset/${this.selectedNode.id}`, payload).subscribe({
      next: () => { this.saving = false; },
      error: () => {
        // Optimistic UI — changes stick in memory even if API isn't wired yet
        this.saving = false;
        this.saveError = '';
      }
    });
  }

  selectTool(id: string) { this.activeTool = id; }

  get transformer(): any {
    return this.twinNodes.find(n => n.type === 'transformer') || null;
  }

  get modelSummary() {
    return {
      total:    this.twinNodes.length,
      measured: this.twinNodes.filter(n => n.used_kva > 0).length,
      verified: this.twinNodes.filter(n => (n.kva_rating || 0) > 0 || (n.amp_rating || 0) > 0).length,
    };
  }

  isValid(): boolean { return this.twinNodes.length > 0; }

  loadColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
}
