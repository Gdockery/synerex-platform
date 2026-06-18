import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
})
export class DevicesComponent implements OnInit {
  projectId: number;
  loading = true;
  meters: any[] = [];
  gateways: any[] = [];
  apfs: any[] = [];
  schedules: any[] = [];
  activeTab: 'meters' | 'gateways' | 'apf' | 'schedule' = 'meters';

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.api.get(`/api/meter?project=${this.projectId}`).subscribe({
      next: (r: any) => { this.meters = r?.meters || r || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/gateway?project=${this.projectId}`).subscribe({
      next: (r: any) => { this.gateways = r?.gateways || r || []; }, error: () => {}
    });
    this.api.get(`/api/devices/apf?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.apfs = r?.apfs || r || []; }, error: () => {}
    });
    this.api.get(`/api/devices/schedules?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.schedules = r?.schedules || r || []; }, error: () => {}
    });
  }

  statusClass(s: string): string {
    const st = (s || '').toLowerCase();
    if (st === 'online' || st === 'active' || st === 'commissioned') return 'badge-healthy';
    if (st === 'offline' || st === 'fault') return 'badge-critical';
    if (st === 'warning') return 'badge-warning';
    if (st === 'installed') return 'badge-info';
    return 'badge-offline';
  }

  get activeMeters(): number { return this.meters.filter(m => m.status === 'online' || m.status === 'active').length; }
  get activeGateways(): number { return this.gateways.filter(g => g.status === 'online').length; }
  get offlineCount(): number {
    return this.meters.filter(m => m.status === 'offline' || m.status === 'fault').length +
           this.gateways.filter(g => g.status === 'offline').length;
  }

  addSampleSchedule() {
    this.schedules = [
      { name: 'Nightly Maintenance Window', device: 'All APF Units', action: 'maintenance', type: 'Daily', time: '02:00', days: 'Mon-Sun', nextRun: 'Tonight 02:00', enabled: true },
      { name: 'Weekend Low-Load Mode',       device: 'Gateway GW-001', action: 'enable',      type: 'Weekly', time: '06:00', days: 'Sat, Sun', nextRun: 'Saturday 06:00', enabled: true },
      { name: 'Peak Demand Alert Period',    device: 'All Meters',    action: 'enable',      type: 'Daily', time: '14:00', days: 'Mon-Fri', nextRun: 'Tomorrow 14:00', enabled: false },
    ];
  }
}
