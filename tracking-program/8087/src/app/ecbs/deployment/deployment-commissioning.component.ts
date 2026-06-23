import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-commissioning',
  templateUrl: './deployment-commissioning.component.html',
  styleUrls: ['./deployment-commissioning.component.scss'],
})
export class DeploymentCommissioningComponent implements OnInit {
  depId: number = 0;
  devices: any[] = [];
  commRecords: any = {};
  selected: any = null;
  selectedComm: any = null;
  loading = true;

  readonly CHECKS = [
    { key: 'pre_checks_done',   label: 'Pre-Installation Checks Complete' },
    { key: 'power_up_done',     label: 'Device Powered Up Successfully' },
    { key: 'comms_verified',    label: 'Communications Verified (Portal)' },
    { key: 'portal_verified',   label: 'Portal Reading Data' },
    { key: 'no_active_alarms',  label: 'No Active Alarms' },
    { key: 'photos_complete',   label: 'Photos Complete' },
    { key: 'docs_complete',     label: 'Documentation Complete' },
  ];

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId + '/devices').subscribe({
      next: (r: any) => {
        this.devices = (r && r.response) ? r.response : [];
        this.loadCommissioning();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadCommissioning() {
    this.api.get('/api/dep/deployments/' + this.depId + '/commissioning').subscribe({
      next: (r: any) => {
        var recs = (r && r.response) ? r.response : [];
        this.commRecords = {};
        for (var i = 0; i < recs.length; i++) {
          this.commRecords[recs[i].device_id] = recs[i];
        }
        if (this.selected) {
          this.selectedComm = this.commRecords[this.selected.id] || null;
        }
      },
    });
  }

  select(d: any) {
    this.selected = d;
    this.selectedComm = this.commRecords[d.id] || null;
    if (!this.selectedComm) {
      this.api.post('/api/dep/devices/' + d.id + '/commissioning', {}).subscribe({
        next: (r: any) => {
          if (r && r.response) {
            this.commRecords[d.id] = r.response;
            this.selectedComm = r.response;
          }
        },
      });
    }
  }

  toggleCheck(key: string) {
    if (!this.selectedComm) return;
    var val = this.selectedComm[key] ? 0 : 1;
    var update: any = {};
    update[key] = val;
    this.api.patch('/api/dep/commissioning/' + this.selectedComm.id, update).subscribe({
      next: (r: any) => {
        if (r && r.response) {
          this.commRecords[this.selectedComm.device_id] = r.response;
          this.selectedComm = r.response;
          this.loadCommissioning();
        }
      },
    });
  }

  allChecked(): boolean {
    if (!this.selectedComm) return false;
    for (var i = 0; i < this.CHECKS.length; i++) {
      if (!this.selectedComm[this.CHECKS[i].key]) return false;
    }
    return true;
  }

  checkedCount(): number {
    if (!this.selectedComm) return 0;
    var n = 0;
    for (var i = 0; i < this.CHECKS.length; i++) {
      if (this.selectedComm[this.CHECKS[i].key]) n++;
    }
    return n;
  }

  statusClass(d: any): string {
    var comm = this.commRecords[d.id];
    if (!comm) return 'sv-pending';
    if (comm.status === 'Commissioned') return 'sv-commissioned';
    if (comm.status === 'In Progress') return 'sv-progress';
    return 'sv-pending';
  }

  get devicesDone(): number {
    var n = 0;
    for (var i = 0; i < this.devices.length; i++) {
      var comm = this.commRecords[this.devices[i].id];
      if (comm && comm.status === 'Commissioned') n++;
    }
    return n;
  }

  goBack() { this.router.navigate(['/ecbs/deployment', this.depId]); }
}
