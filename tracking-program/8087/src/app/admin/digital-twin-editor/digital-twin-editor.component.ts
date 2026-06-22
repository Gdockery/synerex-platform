import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'admin-digital-twin-editor',
  templateUrl: './digital-twin-editor.component.html',
  styleUrls: ['./digital-twin-editor.component.scss'],
})
export class DigitalTwinEditorComponent implements OnInit {
  projects: any[] = [];
  loadingProjects = true;
  selectedProjectId: any = '';
  get selectedProjectName(): string {
    const p = this.projects.find(x => String(x.id) === String(this.selectedProjectId));
    return p ? (p.name || String(p.id)) : '';
  }

  twinId: number = 0;
  twinNodes: any[] = [];
  relationships: any[] = [];
  loading = false;
  saving = false;

  activeTool = 'select';
  selectedNode: any = null;
  activeTab = 'one-line view';

  editLabel = ''; editKva = ''; editAmp = ''; editNotes = ''; editBusId = '';

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
    this.loadProjects();
    const p = this.userService.user ? (this.userService.user as any).selectedProject : null;
    if (p && p.id) { this.selectedProjectId = String(p.id); }
  }

  loadProjects() {
    this.loadingProjects = true;
    this.api.get('/api/project/?page=1&pageSize=50').subscribe({
      next: (r: any) => {
        const list = r && r.data ? r.data : (r && r.projects ? r.projects : []);
        this.projects = Array.isArray(list) ? list : [];
        this.loadingProjects = false;
        if (this.selectedProjectId) { this.loadTwin(Number(this.selectedProjectId)); }
      },
      error: () => {
        this.loadingProjects = false;
        const p = this.userService.user ? (this.userService.user as any).selectedProject : null;
        if (p && p.id) {
          this.projects = [p];
          this.selectedProjectId = String(p.id);
          this.loadTwin(p.id);
        }
      }
    });
  }

  onProjectChange(projectId: any) {
    this.twinNodes = []; this.relationships = []; this.twinId = 0; this.selectedNode = null;
    if (projectId) { this.loadTwin(Number(projectId)); }
  }

  loadTwin(projectId: number) {
    this.loading = true;
    this.api.get('/api/digital-twin/?project_id=' + projectId).subscribe({
      next: (r: any) => {
        const twins: any[] = r && r.data ? r.data : [];
        if (twins.length > 0) { this.twinId = twins[0].id; this.loadSnapshot(this.twinId); }
        else { this.twinNodes = []; this.relationships = []; this.loading = false; }
      },
      error: () => { this.twinNodes = []; this.loading = false; }
    });
  }

  loadSnapshot(twinId: number) {
    this.api.get('/api/digital-twin/' + twinId).subscribe({
      next: (r: any) => {
        const snap = r && r.data && r.data.snapshot ? r.data.snapshot : {};
        this.twinNodes = (snap.assets || []).map((a: any) => this._normalize(a));
        this.relationships = snap.relationships || [];
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
      id: a.id, uid: a.asset_uid || String(a.id),
      type: a.asset_type || a.type || 'unknown',
      label: a.name || a.label || a.asset_uid || 'Asset',
      kva_rating: a.kva_rating || a.rated_kva || null,
      amp_rating: a.amp_rating || null,
      voltage_primary: a.voltage_primary || null,
      voltage_secondary: a.voltage_secondary || null,
      bus_id: a.bus_id || null, drawing_ref: a.drawing_ref || null,
      notes: a.notes || '', extra: extra || {}, status: a.status || 'active', used_kva: a.used_kva || 0,
    };
  }

  get svgLayout(): any[] {
    if (!this.twinNodes.length) return [];
    const byDbId: {[id: number]: any} = {};
    this.twinNodes.forEach(n => byDbId[n.id] = n);
    const feedsChildren = (pid: number): number[] =>
      this.relationships.filter(r => r.parent_asset_id === pid && r.relationship_type === 'feeds').map(r => r.child_asset_id);
    const containsChildren = (pid: number): any[] =>
      this.relationships.filter(r => r.parent_asset_id === pid && r.relationship_type === 'contains').map(r => byDbId[r.child_asset_id]).filter(n => !!n);
    const result: any[] = [];
    const mk = (n: any, x: number, y: number, badges?: any[]) => Object.assign({}, n, { svgX: x, svgY: y, badges: badges || [] });

    const utility = this.twinNodes.find(n => n.type === 'utility_service');
    const xfmr    = this.twinNodes.find(n => n.type === 'transformer');
    const swg     = this.twinNodes.find(n => n.type === 'switchgear');
    const gen     = this.twinNodes.find(n => n.type === 'generator');
    const ats     = this.twinNodes.find(n => n.type === 'ats');

    if (utility) result.push(mk(utility, 400, 55));
    if (xfmr)    result.push(mk(xfmr,    400, 130));
    this._busBadges = swg ? containsChildren(swg.id) : [];
    if (gen) result.push(mk(gen, 690, 240));
    if (ats) result.push(mk(ats, 690, 310));

    const genAtsIds = [gen && gen.id, ats && ats.id].filter(x => !!x);
    const childNodes = (swg ? feedsChildren(swg.id) : [])
      .map(id => byDbId[id]).filter(n => n && genAtsIds.indexOf(n.id) === -1);
    const circuits = childNodes.filter(n => n.type === 'circuit');
    const panels   = childNodes.filter(n => n.type === 'panel');

    const r1s = 60, r1e = 620, r1step = circuits.length > 1 ? (r1e - r1s) / (circuits.length - 1) : 0;
    circuits.forEach(function(n: any, i: number) { result.push(mk(n, r1s + i * r1step, 265, containsChildren(n.id))); }.bind(this));

    const r2s = 90, r2e = 590, r2step = panels.length > 1 ? (r2e - r2s) / (panels.length - 1) : 0;
    panels.forEach(function(n: any, i: number) { result.push(mk(n, r2s + i * r2step, 370)); }.bind(this));
    return result;
  }

  _busBadges: any[] = [];

  nodeStroke(n: any): string {
    const t = (n.type || '').toLowerCase();
    if (t === 'utility_service') return '#29b6f6';
    if (t === 'transformer')     return '#00e676';
    if (t === 'generator' || t === 'ats') return '#ffd740';
    if (t === 'ecbs')            return '#00e676';
    if (t === 'panel')           return '#ab47bc';
    return '#546e7a';
  }

  shortLabel(s: string, max: number): string {
    if (!s) return '';
    return s.length > max ? s.substring(0, max - 1) + '...' : s;
  }

  selectNode(n: any) {
    this.selectedNode = n;
    this.editLabel = n.label || '';
    this.editKva   = n.kva_rating ? String(n.kva_rating) : '';
    this.editAmp   = n.amp_rating ? String(n.amp_rating) : '';
    this.editNotes = n.notes || '';
    this.editBusId = n.bus_id || '';
  }

  saveNode() {
    if (!this.selectedNode) return;
    this.selectedNode.label      = this.editLabel;
    this.selectedNode.kva_rating = this.editKva ? Number(this.editKva) : null;
    this.selectedNode.amp_rating = this.editAmp ? Number(this.editAmp) : null;
    this.selectedNode.notes      = this.editNotes;
    this.selectedNode.bus_id     = this.editBusId;
    if (!this.twinId) return;
    this.saving = true;
    const payload = { name: this.selectedNode.label, kva_rating: this.selectedNode.kva_rating,
      amp_rating: this.selectedNode.amp_rating, notes: this.selectedNode.notes, bus_id: this.selectedNode.bus_id };
    this.api.put('/api/digital-twin/' + this.twinId + '/asset/' + this.selectedNode.id, payload).subscribe({
      next: () => { this.saving = false; }, error: () => { this.saving = false; }
    });
  }

  selectTool(id: string) { this.activeTool = id; }

  get modelSummary() {
    return {
      total:    this.twinNodes.length,
      measured: this.twinNodes.filter(n => n.used_kva > 0).length,
      verified: this.twinNodes.filter(n => (n.kva_rating || 0) > 0 || (n.amp_rating || 0) > 0).length,
    };
  }

  isValid(): boolean { return this.twinNodes.length > 0; }
}