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
  activeTab: 'meters' | 'gateways' = 'meters';

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.api.get(`/api/meter?project=${this.projectId}`).subscribe({
      next: (r: any) => { this.meters = r?.meters || r || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/gateway?project=${this.projectId}`).subscribe({
      next: (r: any) => { this.gateways = r?.gateways || r || []; },
      error: () => {}
    });
  }

  statusClass(s: string): string {
    if (s === 'online' || s === 'active') return 'badge-healthy';
    if (s === 'offline') return 'badge-critical';
    return 'badge-offline';
  }
}
