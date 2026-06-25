import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

// ── Interfaces (same as digital-twin.component.ts) ───────────────────────────
export interface TwinNode {
  dbId: number;      // positive = real DB id; negative = temp (unsaved new node)
  id: string;
  type: string;
  label: string;
  rated_kva?: number;
  amp_rating?: number;
  voltage_in?: number;
  voltage_out?: number;
  used_kva?: number;
  status?: string;
  bus_id?: string;
  notes?: string;
  extra?: any;
  device_id?: number | null;   // linked deployment device id (stored in extra.device_id)
}

export interface TwinSvgNode extends TwinNode {
  x: number;
  y: number;
  badges: TwinNode[];
}

export interface TwinRel {
  id?: number;
  parent_asset_id: number;
  child_asset_id: number;
  relationship_type: string;
}

// Downstream-editable types (utility_service and transformer are locked)
const LOCKED_TYPES = ['utility_service', 'transformer'];

const ADDABLE_TYPES = [
  { type: 'circuit',   label: 'Circuit / Feeder',  icon: 'fa-minus' },
  { type: 'panel',     label: 'Panel',              icon: 'fa-th' },
  { type: 'apf',       label: 'ECBS / APF',         icon: 'fa-bolt' },
  { type: 's600',      label: 'XECO-600',           icon: 'fa-square' },
  { type: 'generator', label: 'Generator',          icon: 'fa-industry' },
  { type: 'ats',       label: 'ATS',                icon: 'fa-random' },
  { type: 'mcc',       label: 'MCC',                icon: 'fa-cubes' },
  { type: 'load',      label: 'Load',               icon: 'fa-plug' },
  { type: 'pq_meter',  label: 'PQ Meter',           icon: 'fa-tachometer' },
];

@Component({
  selector: 'app-deployment-oneline',
  templateUrl: './deployment-oneline.component.html',
  styleUrls: ['./deployment-oneline.component.scss'],
})
export class DeploymentOneLineComponent implements OnInit, OnDestroy {
  depId   = 0;
  dep: any = null;
  loading     = true;
  twinLoading = true;
  syncedAt    = '';
  summary: any = {};

  // Twin data
  twinId   = 0;
  twinNodes: TwinNode[]  = [];
  relationships: TwinRel[] = [];
  twinConfigured = false;

  // Position map: dbId → {x, y} — populated from asset.extra, updated by drag
  posMap: {[dbId: number]: {x: number; y: number}} = {};

  // Deployment devices for legend
  devices: any[]   = [];
  deviceLegend: {type: string; count: number}[] = [];
  drawingDocs: any[] = [];

  // Physical switches from the `switch` table (actual XECO hardware)
  switches: any[] = [];
  switchesLoading = false;

  // Node click/detail
  selectedNode: TwinNode | null = null;

  // Exposed for template
  _busBadges: TwinNode[] = [];

  // ── Edit mode state ───────────────────────────────────────────────────────
  editMode = false;
  dirty    = false;
  saving   = false;
  saveMsg  = '';

  // Deletion tracking
  deletedAssetIds: number[] = [];
  deletedRelIds:   number[] = [];
  _tempIdCounter   = -1;   // counts down for new nodes

  // Drag state
  private _dragging: TwinNode | null = null;
  private _dragOffsetSvg = {x: 0, y: 0};  // cursor offset from node center in SVG coords

  // Connect mode (draw electrical feeds edges)
  connectMode   = false;
  connectSource: TwinNode | null = null;

  // Place mode — tap a node to toggle "unit placed here" (shown as circle)
  placeMode = false;

  // Add node modal
  showAddModal  = false;
  newNode = {
    type:        'circuit',
    label:       '',
    amp_rating:  null as number | null,
    kva_rating:  null as number | null,
    notes:       '',
    device_id:   null as number | null,
  };
  readonly addableTypes = ADDABLE_TYPES;

  // Device-link picker (used in edit mode node detail)
  showDevicePicker  = false;
  devicePickerNode: TwinNode | null = null;

  constructor(
    private route:  ActivatedRoute,
    private router: Router,
    private api:    ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe(p => {
      this.depId = +p['id'];
      this.load();
    });
  }

  ngOnDestroy() {}

  // ── Data loading ─────────────────────────────────────────────────────────

  load() {
    this.loading = true;
    this.twinLoading = true;
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep     = r && r.response ? r.response : r;
        this.summary = this.dep.summary || {};
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.loading  = false;
        const pid = this.dep.project_id || (this.dep.project_info && this.dep.project_info.id);
        if (pid) {
          this._loadTwin(pid);
          this._loadSwitches(pid);
        } else { this.twinLoading = false; }
      },
      error: () => { this.loading = false; this.twinLoading = false; }
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/devices').subscribe({
      next: (r: any) => {
        this.devices = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        this._buildLegend();
      },
      error: () => {}
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/documents').subscribe({
      next: (r: any) => {
        this.drawingDocs = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
      },
      error: () => {}
    });
  }

  private _loadSwitches(projectId: number) {
    this.switchesLoading = true;
    this.api.get('/api/switch?project=' + projectId).subscribe({
      next: (r: any) => {
        const raw = r && r.data ? r.data : (Array.isArray(r) ? r : []);
        this.switches = raw.filter(function(s: any) { return !s.isDeleted; });
        this.switchesLoading = false;
      },
      error: () => { this.switchesLoading = false; }
    });
  }

  // Shape type helpers
  switchShape(s: any): string {
    // deviceType 0 = APF (triangle), everything else = Switch/600 (square)
    return s.deviceType === 0 ? 'apf' : 's600';
  }

  switchOnline(s: any): boolean {
    if (!s.lastCommunicatedAt) return false;
    // Within last 10 minutes
    return (Date.now() - s.lastCommunicatedAt) < 600000;
  }

  private _loadTwin(projectId: number) {
    this.api.get('/api/digital-twin/?project_id=' + projectId).subscribe({
      next: (r: any) => {
        const twins: any[] = r && r.data ? r.data : [];
        if (twins.length > 0) {
          this.twinId = twins[0].id;
          this._loadTwinSnapshot(this.twinId);
        } else {
          this.api.get('/api/capacity/assets?project_id=' + projectId).subscribe({
            next: (r2: any) => {
              const raw: any[] = r2 && r2.data ? r2.data : (r2 && r2.assets ? r2.assets : []);
              this._applyAssets(raw, []);
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
    this.api.get('/api/digital-twin/' + twinId).subscribe({
      next: (r: any) => {
        const snap = r && r.data && r.data.snapshot ? r.data.snapshot : {};
        this._applyAssets(snap.assets || [], snap.relationships || []);
        this.twinLoading = false;
      },
      error: () => { this.twinLoading = false; }
    });
  }

  private _applyAssets(assets: any[], rels: any[]) {
    this.relationships = rels.map(function(r: any) {
      return { id: r.id, parent_asset_id: r.parent_asset_id, child_asset_id: r.child_asset_id,
               relationship_type: r.relationship_type };
    });
    this.twinNodes = assets.map(a => this._mapAsset(a));
    // Initialise posMap from extra.x / extra.y
    this.posMap = {};
    for (const n of this.twinNodes) {
      const ex = n.extra || {};
      if (ex.x != null && ex.y != null) {
        this.posMap[n.dbId] = { x: +ex.x, y: +ex.y };
      }
    }
    this.twinConfigured = this.twinNodes.length > 0;
  }

  _mapAsset(a: any): TwinNode {
    let extra = a.extra;
    if (typeof extra === 'string') { try { extra = JSON.parse(extra); } catch (e) { extra = {}; } }
    return {
      dbId:       a.id,
      id:         a.asset_uid || String(a.id),
      type:       a.asset_type || a.type || 'unknown',
      label:      a.name || a.label || a.asset_uid || 'Asset',
      rated_kva:  a.kva_rating  || a.rated_kva  || null,
      amp_rating: a.amp_rating || null,
      voltage_in:  a.voltage_primary  || a.voltage_in  || null,
      voltage_out: a.voltage_secondary || a.voltage_out || null,
      used_kva:   a.used_kva || 0,
      status:     a.status   || 'active',
      bus_id:     a.bus_id   || null,
      notes:      a.notes    || null,
      extra:      extra      || null,
      device_id:  (extra && extra.device_id != null) ? +extra.device_id : null,
    };
  }

  // ── SVG layout (uses posMap when available) ───────────────────────────────

  private get _nodeByDbId(): {[id: number]: TwinNode} {
    const m: {[id: number]: TwinNode} = {};
    this.twinNodes.forEach(n => { m[n.dbId] = n; });
    return m;
  }

  _feedsChildren(parentDbId: number): number[] {
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'feeds')
      .map(r => r.child_asset_id);
  }

  _containsIds(parentDbId: number): number[] {
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'contains')
      .map(r => r.child_asset_id);
  }

  private _containsChildren(parentDbId: number): TwinNode[] {
    const byId = this._nodeByDbId;
    return this.relationships
      .filter(r => r.parent_asset_id === parentDbId && r.relationship_type === 'contains')
      .map(r => byId[r.child_asset_id])
      .filter(n => !!n);
  }

  get svgNodes(): TwinSvgNode[] {
    if (!this.twinNodes.length) return [];

    const byId   = this._nodeByDbId;
    const placed: {[dbId: number]: boolean} = {};
    const result: TwinSvgNode[] = [];

    const mkNode = (n: TwinNode, defX: number, defY: number, badges?: TwinNode[]): TwinSvgNode => {
      placed[n.dbId] = true;
      const pos = this.posMap[n.dbId];
      return Object.assign({}, n, {
        x: pos ? pos.x : defX,
        y: pos ? pos.y : defY,
        badges: badges || [],
      });
    };

    const find = (type: string) => this.twinNodes.filter(n => n.type === type)[0] || null;

    const utility = find('utility_service');
    const xfmr    = find('transformer');
    const swg     = find('switchgear');
    const gen     = find('generator');
    const ats     = find('ats');

    if (utility) result.push(mkNode(utility, 390, 44));
    if (xfmr)    result.push(mkNode(xfmr,    390, 115, []));

    const swgBadges = swg ? this._containsChildren(swg.dbId) : [];
    if (swg) result.push(mkNode(swg, 390, 190, swgBadges));

    if (gen) result.push(mkNode(gen, 700, 190));
    if (ats) result.push(mkNode(ats, 700, 270));

    const genAtsIds = [gen && gen.dbId, ats && ats.dbId].filter(x => !!x);

    // Children of the switchgear (or direct children of xfmr if no swg)
    const parentId = swg ? swg.dbId : (xfmr ? xfmr.dbId : null);
    const swgChildIds = parentId ? this._feedsChildren(parentId) : [];
    const childNodes = swgChildIds.map(id => byId[id])
      .filter(n => n && genAtsIds.indexOf(n.dbId) < 0);

    // Row 1: direct feeds-children of switchgear (circuits, panels, etc.)
    const row1Nodes = childNodes;
    const row1Count = row1Nodes.length;
    const row1Start = 40, row1End = 720;
    const row1Step  = row1Count > 1 ? (row1End - row1Start) / (row1Count - 1) : 0;
    const self = this;
    // Track x position per row1 node so contains-children align under them
    const row1X: {[dbId: number]: number} = {};
    row1Nodes.forEach(function(n, i) {
      const x = row1Count === 1 ? 390 : row1Start + i * row1Step;
      row1X[n.dbId] = x;
      result.push(mkNode(n, x, 300, []));  // no badge count — show as real nodes below
    });

    // Row 2a: feeds-children of row-1 nodes
    const row2Feeds: TwinNode[] = [];
    row1Nodes.forEach(function(n) {
      self._feedsChildren(n.dbId).forEach(function(cid) {
        const child = byId[cid];
        if (child && !placed[child.dbId]) { row2Feeds.push(child); }
      });
    });
    const r2fCount = row2Feeds.length;
    const r2fStart = row1Start + 20, r2fEnd = row1End - 20;
    const r2fStep  = r2fCount > 1 ? (r2fEnd - r2fStart) / (r2fCount - 1) : 0;
    row2Feeds.forEach(function(n, i) {
      result.push(mkNode(n, r2fStart + i * r2fStep, 400, []));
    });

    // Row 2b: contains-children of row-1 nodes (ECBS / APF units installed in circuits)
    // Positioned directly below their parent circuit
    const row2Contains: {node: TwinNode; parentX: number}[] = [];
    row1Nodes.forEach(function(n) {
      const cx = row1X[n.dbId] || 390;
      self._containsChildren(n.dbId).forEach(function(child) {
        if (!placed[child.dbId]) { row2Contains.push({node: child, parentX: cx}); }
      });
    });
    // Also contains-children of switchgear itself
    swgBadges.forEach(function(child) {
      if (!placed[child.dbId]) { row2Contains.push({node: child, parentX: 390}); }
    });
    row2Contains.forEach(function(item) {
      // Spread multiple contains-children of the same parent horizontally
      result.push(mkNode(item.node, item.parentX, 400, []));
    });

    // Unplaced nodes (new/disconnected): floating row below everything
    let unplacedX = 60;
    this.twinNodes.forEach(n => {
      if (!placed[n.dbId]) {
        result.push(mkNode(n, unplacedX, 490, []));
        unplacedX += 120;
      }
    });

    this._busBadges = swgBadges;
    return result;
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────

  toggleEdit() {
    if (this.editMode) {
      if (this.dirty) {
        if (!confirm('Discard unsaved changes?')) return;
      }
      this._exitEdit();
    } else {
      this.editMode    = true;
      this.dirty       = false;
      this.connectMode = false;
      this.connectSource = null;
      this.selectedNode  = null;
    }
  }

  private _exitEdit() {
    this.editMode      = false;
    this.dirty         = false;
    this.connectMode   = false;
    this.placeMode     = false;
    this.connectSource = null;
    this._dragging     = null;
    this.deletedAssetIds = [];
    this.deletedRelIds   = [];
    this.showAddModal    = false;
  }

  isLocked(n: TwinNode): boolean {
    return LOCKED_TYPES.indexOf(n.type) >= 0;
  }

  // ── Drag (mouse + touch unified) ─────────────────────────────────────────

  onNodePointerDown(event: MouseEvent | TouchEvent, n: TwinNode) {
    if (!this.editMode || this.isLocked(n)) return;
    if (this.connectMode) { this._handleConnect(n); return; }
    event.preventDefault();
    event.stopPropagation();
    const pt = this._clientXY(event);
    const sv = this._toSvg(pt.x, pt.y);
    const pos = this.posMap[n.dbId] || this._defaultPos(n);
    this._dragging = n;
    this._dragOffsetSvg = { x: sv.x - pos.x, y: sv.y - pos.y };
    if (!this.posMap[n.dbId]) { this.posMap[n.dbId] = { x: pos.x, y: pos.y }; }
  }

  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onPointerMove(event: MouseEvent | TouchEvent) {
    if (!this._dragging) return;
    event.preventDefault();
    const pt = this._clientXY(event);
    const sv = this._toSvg(pt.x, pt.y);
    const nx = Math.max(10, Math.min(770, sv.x - this._dragOffsetSvg.x));
    const ny = Math.max(10, Math.min(480, sv.y - this._dragOffsetSvg.y));
    this.posMap[this._dragging.dbId] = { x: nx, y: ny };
    this.dirty = true;
  }

  @HostListener('mouseup')
  @HostListener('touchend')
  onPointerUp() {
    if (this._dragging) {
      // Write final position into the node's extra so it round-trips correctly
      const n = this._dragging;
      const pos = this.posMap[n.dbId];
      if (pos) {
        n.extra = Object.assign({}, n.extra || {}, { x: pos.x, y: pos.y });
      }
      this._dragging = null;
    }
  }

  private _defaultPos(n: TwinNode): {x: number; y: number} {
    const found = this.svgNodes.filter(s => s.dbId === n.dbId)[0];
    return found ? { x: found.x, y: found.y } : { x: 390, y: 300 };
  }

  private _clientXY(e: MouseEvent | TouchEvent): {x: number; y: number} {
    if ((e as TouchEvent).changedTouches) {
      const t = (e as TouchEvent).changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  private _toSvg(clientX: number, clientY: number): {x: number; y: number} {
    const el = document.querySelector('.ol-canvas svg') as SVGSVGElement;
    if (!el) return { x: 390, y: 245 };
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width  * 780,
      y: (clientY - rect.top)  / rect.height * 490,
    };
  }

  // ── Delete node ───────────────────────────────────────────────────────────

  deleteNode(n: TwinNode, event?: Event) {
    if (event) { event.stopPropagation(); }
    if (this.isLocked(n)) return;
    if (!confirm('Delete "' + n.label + '"?')) return;

    // Remove from twinNodes
    this.twinNodes = this.twinNodes.filter(function(x) { return x.dbId !== n.dbId; });

    // Track for server deletion (only real DB records)
    if (n.dbId > 0) { this.deletedAssetIds.push(n.dbId); }

    // Remove and track deleted relationships
    const toDelete = this.relationships.filter(function(r) {
      return r.parent_asset_id === n.dbId || r.child_asset_id === n.dbId;
    });
    toDelete.forEach(r => { if (r.id && r.id > 0) { this.deletedRelIds.push(r.id); } });
    this.relationships = this.relationships.filter(function(r) {
      return r.parent_asset_id !== n.dbId && r.child_asset_id !== n.dbId;
    });

    delete this.posMap[n.dbId];
    if (this.selectedNode && this.selectedNode.dbId === n.dbId) { this.selectedNode = null; }
    this.dirty = true;
  }

  // ── Add node ─────────────────────────────────────────────────────────────

  openAddModal() { this.showAddModal = true; this.newNode = { type: 'circuit', label: '', amp_rating: null, kva_rating: null, notes: '', device_id: null }; }
  closeAddModal() { this.showAddModal = false; }

  confirmAddNode() {
    if (!this.newNode.label.trim()) { alert('Please enter a name for the node.'); return; }
    const tempId = this._tempIdCounter--;
    const devId  = this.newNode.device_id || null;
    const node: TwinNode = {
      dbId:       tempId,
      id:         'new-' + (-tempId),
      type:       this.newNode.type,
      label:      this.newNode.label.trim(),
      amp_rating: this.newNode.amp_rating || null,
      rated_kva:  this.newNode.kva_rating || null,
      status:     'planned',
      extra:      devId ? { device_id: devId } : {},
      device_id:  devId,
    };

    // Place at center, user can drag to position
    this.posMap[tempId] = { x: 390, y: 350 };
    this.twinNodes = this.twinNodes.concat([node]);

    // Auto-connect to switchgear if circuit or panel
    const swg = this.twinNodes.filter(n => n.type === 'switchgear')[0] || null;
    if (swg && (node.type === 'circuit' || node.type === 'panel' || node.type === 'mcc')) {
      this.relationships = this.relationships.concat([{
        parent_asset_id:   swg.dbId,
        child_asset_id:    tempId,
        relationship_type: 'feeds',
      }]);
    }

    this.dirty = true;
    this.showAddModal = false;
  }

  // ── Connect mode (draw electrical feeds wires) ───────────────────────────

  toggleConnect() {
    this.connectMode   = !this.connectMode;
    this.connectSource = null;
    if (this.connectMode) { this.placeMode = false; }
  }

  // ── Place mode (mark where a unit is physically installed) ────────────────

  togglePlace() {
    this.placeMode = !this.placeMode;
    if (this.placeMode) { this.connectMode = false; this.connectSource = null; }
  }

  isPlaced(n: TwinNode): boolean {
    const ex = n.extra || {};
    return !!ex.placed;
  }

  togglePlaced(n: TwinNode) {
    n.extra = Object.assign({}, n.extra || {}, { placed: !this.isPlaced(n) });
    this.dirty = true;
  }

  get placedCount(): number {
    return this.twinNodes.filter(n => this.isPlaced(n)).length;
  }

  // ── Device link (assign a physical device to a node) ─────────────────────

  /** All devices that have a device_id means they are already linked (to prevent double-linking) */
  get availableDevices(): any[] {
    const linked = this.twinNodes
      .filter(n => n.device_id != null)
      .map(n => n.device_id);
    return this.devices.filter(function(d) { return linked.indexOf(d.id) < 0; });
  }

  deviceLabel(n: TwinNode): string {
    if (!n.device_id) return '';
    const dev = this.devices.filter(function(d) { return d.id === n.device_id; })[0];
    if (!dev) return '#' + n.device_id;
    return dev.planned_label || dev.device_name || dev.device_type || ('#' + n.device_id);
  }

  deviceSerial(n: TwinNode): string {
    if (!n.device_id) return '';
    const dev = this.devices.filter(function(d) { return d.id === n.device_id; })[0];
    return (dev && dev.expected_serial) ? dev.expected_serial : '';
  }

  openDevicePicker(n: TwinNode, event?: Event) {
    if (event) { event.stopPropagation(); }
    this.devicePickerNode = n;
    this.showDevicePicker = true;
  }

  closeDevicePicker() { this.showDevicePicker = false; this.devicePickerNode = null; }

  assignDevice(devId: number | null) {
    const n = this.devicePickerNode;
    if (!n) return;
    n.device_id = devId;
    n.extra     = Object.assign({}, n.extra || {}, { device_id: devId });
    this.dirty  = true;
    this.closeDevicePicker();
  }

  unlinkDevice(n: TwinNode, event?: Event) {
    if (event) { event.stopPropagation(); }
    n.device_id = null;
    n.extra     = Object.assign({}, n.extra || {});
    delete n.extra.device_id;
    this.dirty  = true;
  }

  private _handleConnect(n: TwinNode) {
    if (!this.connectSource) {
      this.connectSource = n;
    } else {
      if (this.connectSource.dbId !== n.dbId) {
        // Avoid duplicate
        const dup = this.relationships.filter(r =>
          r.parent_asset_id === this.connectSource!.dbId &&
          r.child_asset_id  === n.dbId
        )[0];
        if (!dup) {
          this.relationships = this.relationships.concat([{
            parent_asset_id:   this.connectSource.dbId,
            child_asset_id:    n.dbId,
            relationship_type: 'feeds',
          }]);
          this.dirty = true;
        }
      }
      this.connectSource = null;
      this.connectMode   = false;
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  save() {
    if (!this.twinId) { alert('No digital twin to save to. Set up the project twin first.'); return; }
    this.saving  = true;
    this.saveMsg = '';

    // Bake current posMap into each node's extra before sending
    const self2 = this;
    const assets = this.twinNodes.map(function(n) {
      const pos: {x: number; y: number} | null = self2.posMap[n.dbId] || null;
      const posExtra = pos ? { x: pos.x, y: pos.y } : {};
      return {
        id:          n.dbId > 0 ? n.dbId : null,
        asset_type:  n.type,
        name:        n.label,
        amp_rating:  n.amp_rating,
        kva_rating:  n.rated_kva,
        status:      n.status || 'planned',
        notes:       n.notes,
        extra:       Object.assign({}, n.extra || {}, posExtra),
      };
    });

    const body = {
      assets:           assets,
      relationships:    this.relationships,
      deleted_asset_ids: this.deletedAssetIds,
      deleted_rel_ids:   this.deletedRelIds,
    };

    this.api.post('/api/digital-twin/' + this.twinId + '/save-topology', body).subscribe({
      next: (r: any) => {
        this.saving  = false;
        this.saveMsg = 'Saved';
        this.dirty   = false;
        this.deletedAssetIds = [];
        this.deletedRelIds   = [];
        // Reload fresh snapshot from server
        this._loadTwinSnapshot(this.twinId);
        setTimeout(() => { this.saveMsg = ''; }, 3000);
      },
      error: () => {
        this.saving  = false;
        this.saveMsg = 'Save failed';
        setTimeout(() => { this.saveMsg = ''; }, 4000);
      }
    });
  }

  // ── Node click (view mode) ────────────────────────────────────────────────

  selectNode(n: TwinNode) {
    if (this.connectMode) { this._handleConnect(n); return; }
    if (this.placeMode)   { this.togglePlaced(n);  return; }
    this.selectedNode = (this.selectedNode && this.selectedNode.dbId === n.dbId) ? null : n;
  }

  closeNode() { this.selectedNode = null; }

  // ── SVG helpers ───────────────────────────────────────────────────────────

  shortLabel(label: string, max: number): string {
    if (!label) return '';
    return label.length > max ? label.substring(0, max - 1) + '\u2026' : label;
  }

  isConnectSource(n: TwinNode): boolean {
    return this.connectMode && !!this.connectSource && this.connectSource.dbId === n.dbId;
  }

  nodeEditStroke(n: TwinNode): string {
    if (this.isConnectSource(n))  return '#ff9800';
    if (this.selectedNode && this.selectedNode.dbId === n.dbId) return '#00e676';
    if (this.isLocked(n)) return '#29b6f6';
    return '#546e7a';
  }

  // ── Derived getters ───────────────────────────────────────────────────────

  get depName(): string  { return (this.dep && this.dep.deployment_name) || '\u2014'; }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '\u2014'; }
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '\u2014';
  }
  get utility(): string  { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || ''; }

  get devicesInstalled(): number { return (this.summary && this.summary.installed) || 0; }
  get totalDevices(): number     { return (this.summary && this.summary.total_devices) || 0; }
  get openIssues(): number       { return (this.summary && this.summary.open_issues) || 0; }
  get totalDrawings(): number    { return this.drawingDocs.length; }
  get totalDeviceLegend(): number { return this.deviceLegend.reduce(function(a, b) { return a + b.count; }, 0); }
  get currentDoc(): any { return this.drawingDocs.filter(function(d) { return d.current; })[0] || this.drawingDocs[0] || null; }

  get totalPanels(): number {
    return this.twinNodes.filter(function(n) {
      return n.type === 'circuit' || n.type === 'panel' || n.type === 'switchgear';
    }).length;
  }

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
    if (sl === 'in progress'  || sl === 'in_progress') return 'blue';
    if (sl === 'pending') return 'amber';
    if (sl === 'failed'  || sl === 'rejected') return 'red';
    return 'dim';
  }

  goDevices()     { this.router.navigate(['/ecbs/deployment', this.depId, 'devices']); }
  goEngineering() { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }
  goDocuments()   { this.router.navigate(['/ecbs/deployment', this.depId, 'documents']); }
  goIssues()      { this.router.navigate(['/ecbs/deployment', this.depId, 'issues']); }
}
