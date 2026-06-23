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

  readonly STATUSES = ['Pending', 'In Progress', 'Installed', 'CT Verified', 'Communications Verified', 'Commissioned', 'Failed'];
  readonly TYPES = ['APF', 'Gateway', 'Meter', 'XECO600', 'Load Controller', 'Line Filter'];
  readonly WORKFLOW = ['Pending', 'In Progress', 'Installed', 'CT Verified', 'Communications Verified', 'Commissioned'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
    this.route.queryParams.subscribe((q: any) => {
      if (q['device']) {
        this.selectById(Number(q['device']));
      }
    });
  }

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
    this.api.patch('/api/dep/devices/' + d.id, { status: next }).subscribe({
      next: () => this.load(),
    });
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
