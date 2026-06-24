import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-devices',
  templateUrl: './deployment-devices.component.html',
  styleUrls: ['./deployment-devices.component.scss'],
})
export class DeploymentDevicesComponent implements OnInit {
  depId: number = 0;
  devices: any[] = [];
  selected: any = null;
  loading = true;
  filterStatus = '';
  filterType = '';
  search = '';
  showAdd = false;
  newDevice: any = { device_name: '', device_type: 'APF', location: '', breaker_req: '', ct_req: '' };
  saving = false;

  // Barcode scanner state
  showScanner = false;
  scannerTarget: 'expected' | 'installed' = 'installed';

  // Serial number editing
  editingSerial: 'expected' | 'installed' | null = null;
  serialDraft = '';
  serialSaving = false;

  // GPS state
  gpsCapturing = false;
  gpsError = '';

  readonly STATUSES = ['Pending', 'In Progress', 'Installed', 'CT Verified', 'Communications Verified', 'Commissioned', 'Failed'];
  readonly TYPES = ['APF', 'Gateway', 'Meter', 'XECO600', 'Load Controller', 'Line Filter'];
  readonly WORKFLOW = ['Pending', 'In Progress', 'Installed', 'CT Verified', 'Communications Verified', 'Commissioned'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  depName = '';
  depStatus = '';
  dep: any = null;
  summary: any = {};
  syncedAt = '';

  ngOnInit() {
    this.route.parent!.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
      this._loadDep();
    });
    this.route.queryParams.subscribe((q: any) => {
      if (q['device']) {
        this.selectById(Number(q['device']));
      }
    });
  }

  _loadDep() {
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.summary = this.dep.summary || {};
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        this.depName = this.dep.deployment_name || '—';
        this.depStatus = this.dep.status || '';
      },
      error: () => {}
    });
  }

  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get kpiNotInstalled(): number {
    return this.devices.filter(d => d.status === 'Pending' || !d.status).length;
  }
  get kpiOpenIssues(): number { return (this.summary && this.summary.open_issues) || 0; }

  get deviceSummaryByType(): any[] {
    const counts: {[k:string]: {total: number, installed: number}} = {};
    for (const d of this.devices) {
      const t = d.device_type || 'Other';
      if (!counts[t]) counts[t] = { total: 0, installed: 0 };
      counts[t].total++;
      if (['Installed','CT Verified','Communications Verified','Commissioned'].includes(d.status)) {
        counts[t].installed++;
      }
    }
    return Object.entries(counts).map(([type, c]) => ({
      type,
      ...c,
      pct: c.total ? Math.round(c.installed / c.total * 100) : 0,
    }));
  }

  typeIcon(type: string): string {
    if (!type) return 'fa-circle-o';
    const t = (type || '').toLowerCase();
    if (t === 'apf') return 'fa-microchip';
    if (t === 'gateway') return 'fa-wifi';
    if (t === 'meter') return 'fa-tachometer';
    if (t === 'ct') return 'fa-retweet';
    if (t === 'breaker') return 'fa-bolt';
    return 'fa-circle-o';
  }

  typeIconClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t === 'apf') return 'blue';
    if (t === 'gateway') return 'green';
    if (t === 'meter') return 'purple';
    if (t === 'ct') return 'amber';
    return 'dim';
  }

  statusColorDot(status: string): string {
    if (!status) return 'dot-amber';
    const sl = status.toLowerCase();
    if (sl === 'commissioned') return 'dot-green';
    if (sl === 'in progress') return 'dot-blue';
    if (['installed','ct verified','communications verified'].includes(sl)) return 'dot-teal';
    if (sl === 'failed') return 'dot-red';
    return 'dot-amber';
  }

  goOneLine() { this.router.navigate(['/ecbs/deployment', this.depId, 'one-line']); }
  goPhotos() { this.router.navigate(['/ecbs/deployment', this.depId, 'photos']); }
  goEngineering() { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }
  goDocuments() { this.router.navigate(['/ecbs/deployment', this.depId, 'documents']); }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId + '/devices').subscribe({
      next: (r: any) => {
        this.devices = (r && r.response) ? r.response : [];
        if (this.selected) {
          var id = this.selected.id;
          for (var i = 0; i < this.devices.length; i++) {
            if (this.devices[i].id === id) { this.selected = this.devices[i]; break; }
          }
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  selectById(id: number) {
    for (var i = 0; i < this.devices.length; i++) {
      if (this.devices[i].id === id) { this.selected = this.devices[i]; return; }
    }
  }

  get filtered(): any[] {
    var result: any[] = [];
    for (var i = 0; i < this.devices.length; i++) {
      var d = this.devices[i];
      if (this.filterStatus && d.status !== this.filterStatus) continue;
      if (this.filterType && d.device_type !== this.filterType) continue;
      if (this.search) {
        var q = this.search.toLowerCase();
        var name = (d.device_name || d.planned_label || '').toLowerCase();
        var loc = (d.location || '').toLowerCase();
        if (name.indexOf(q) < 0 && loc.indexOf(q) < 0) continue;
      }
      result.push(d);
    }
    return result;
  }

  get kpiInstalled(): number {
    var n = 0;
    for (var i = 0; i < this.devices.length; i++) {
      var s = this.devices[i].status;
      if (s === 'Installed' || s === 'CT Verified' || s === 'Communications Verified' || s === 'Commissioned') n++;
    }
    return n;
  }
  get kpiInProgress(): number {
    var n = 0;
    for (var i = 0; i < this.devices.length; i++) { if (this.devices[i].status === 'In Progress') n++; }
    return n;
  }
  get kpiPending(): number {
    var n = 0;
    for (var i = 0; i < this.devices.length; i++) { if (this.devices[i].status === 'Pending') n++; }
    return n;
  }
  get kpiCommissioned(): number {
    var n = 0;
    for (var i = 0; i < this.devices.length; i++) { if (this.devices[i].status === 'Commissioned') n++; }
    return n;
  }

  select(d: any) { this.selected = d; }

  workflowStep(d: any): number {
    return this.WORKFLOW.indexOf(d.status);
  }

  nextStep(d: any): string {
    var idx = this.workflowStep(d);
    if (idx < 0 || idx >= this.WORKFLOW.length - 1) return '';
    return this.WORKFLOW[idx + 1];
  }

  advanceStatus(d: any) {
    var next = this.nextStep(d);
    if (!next) return;
    // When advancing to "Installed", try to capture GPS automatically
    if (next === 'Installed') {
      this._advanceWithGps(d, next);
    } else {
      this.api.patch('/api/dep/devices/' + d.id, { status: next }).subscribe({
        next: () => this.load(),
      });
    }
  }

  private _advanceWithGps(d: any, status: string) {
    var self = this;
    var payload: any = { status: status };
    if (!navigator.geolocation) {
      self.api.patch('/api/dep/devices/' + d.id, payload).subscribe({ next: () => self.load() });
      return;
    }
    self.gpsCapturing = true;
    self.gpsError = '';
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        self.gpsCapturing = false;
        payload.install_lat = pos.coords.latitude;
        payload.install_lng = pos.coords.longitude;
        self.api.patch('/api/dep/devices/' + d.id, payload).subscribe({ next: () => self.load() });
      },
      function(err: any) {
        self.gpsCapturing = false;
        // #region agent log
        fetch('http://127.0.0.1:7790/ingest/7eed15d0-e4e9-4f21-b0dd-c59c8d5479d3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'822e51'},body:JSON.stringify({sessionId:'822e51',runId:'1',hypothesisId:'H2',location:'deployment-devices.component.ts:163',message:'GPS error callback fired - gpsError NOT set on component',data:{errCode:err&&err.code,errMsg:err&&err.message,deviceId:d.id},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        self.api.patch('/api/dep/devices/' + d.id, payload).subscribe({ next: () => self.load() });
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  }

  // ── Barcode / Serial ──────────────────────────────────────────────────────

  openScanner(target: 'expected' | 'installed') {
    this.scannerTarget = target;
    this.showScanner = true;
  }

  onScanned(value: string) {
    this.showScanner = false;
    if (!this.selected) return;
    var field = this.scannerTarget === 'expected' ? 'expected_serial' : 'installed_serial';
    var payload: any = {};
    payload[field] = value;
    this.api.patch('/api/dep/devices/' + this.selected.id, payload).subscribe({
      next: () => this.load(),
    });
  }

  onScanCancelled() {
    this.showScanner = false;
  }

  startEditSerial(target: 'expected' | 'installed') {
    this.editingSerial = target;
    this.serialDraft = target === 'expected'
      ? (this.selected && this.selected.expected_serial || '')
      : (this.selected && this.selected.installed_serial || '');
  }

  saveSerial() {
    if (!this.selected || !this.editingSerial) return;
    this.serialSaving = true;
    var field = this.editingSerial === 'expected' ? 'expected_serial' : 'installed_serial';
    var payload: any = {};
    payload[field] = this.serialDraft;
    this.api.patch('/api/dep/devices/' + this.selected.id, payload).subscribe({
      next: () => {
        this.serialSaving = false;
        this.editingSerial = null;
        this.load();
      },
      error: () => { this.serialSaving = false; },
    });
  }

  cancelEditSerial() {
    this.editingSerial = null;
    this.serialDraft = '';
  }

  serialMatch(): boolean {
    if (!this.selected) return false;
    var exp = (this.selected.expected_serial || '').trim();
    var ins = (this.selected.installed_serial || '').trim();
    return exp && ins && exp === ins;
  }

  serialMismatch(): boolean {
    if (!this.selected) return false;
    var exp = (this.selected.expected_serial || '').trim();
    var ins = (this.selected.installed_serial || '').trim();
    return exp && ins && exp !== ins;
  }

  addDevice() {
    if (!this.newDevice.device_name) return;
    this.saving = true;
    var payload = {
      device_name: this.newDevice.device_name,
      device_type: this.newDevice.device_type,
      location: this.newDevice.location,
      breaker_req: this.newDevice.breaker_req,
      ct_req: this.newDevice.ct_req ? Number(this.newDevice.ct_req) : null,
    };
    this.api.post('/api/dep/deployments/' + this.depId + '/devices', payload).subscribe({
      next: () => {
        this.saving = false;
        this.showAdd = false;
        this.newDevice = { device_name: '', device_type: 'APF', location: '', breaker_req: '', ct_req: '' };
        this.load();
      },
      error: () => { this.saving = false; },
    });
  }

  deleteDevice(d: any) {
    if (!confirm('Remove ' + (d.device_name || 'this device') + ' from the deployment?')) return;
    this.api.delete('/api/dep/devices/' + d.id).subscribe({
      next: () => {
        if (this.selected && this.selected.id === d.id) this.selected = null;
        this.load();
      },
    });
  }

  statusClass(s: string): string {
    if (s === 'Commissioned') return 'sv-commissioned';
    if (s === 'Installed' || s === 'CT Verified' || s === 'Communications Verified') return 'sv-installed';
    if (s === 'In Progress') return 'sv-progress';
    if (s === 'Failed') return 'sv-failed';
    return 'sv-pending';
  }

  goBack() { this.router.navigate(['/ecbs/deployment', this.depId]); }
  goIssues() { this.router.navigate(['/ecbs/deployment', this.depId, 'issues']); }
  goCommissioning() { this.router.navigate(['/ecbs/deployment', this.depId, 'commissioning']); }
}
