import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-electrical-network',
  templateUrl: './electrical-network.component.html',
  styleUrls: ['./electrical-network.component.scss'],
})
export class ElectricalNetworkComponent implements OnInit {
  projectId: number;
  loading = true;
  assets: any[] = [];
  cbi: any = null;
  capacity: any = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({ next: (r: any) => { this.assets = r?.assets || r || []; this.loading = false; }, error: () => { this.loading = false; }});
    this.api.get(`/api/current-balance/summary?project_id=${this.projectId}`).subscribe({ next: (r: any) => { this.cbi = r; }, error: () => {}});
    this.api.get(`/api/capacity/summary?project_id=${this.projectId}`).subscribe({ next: (r: any) => { this.capacity = r; }, error: () => {}});
  }

  barColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
  healthClass(pct: number): string { return pct >= 90 ? 'badge-critical' : pct >= 75 ? 'badge-warning' : 'badge-healthy'; }
  get totalKva(): number { return this.assets.reduce((sum, a) => sum + (a.capacity_kva || 0), 0); }
  get totalLoadKva(): number { return this.assets.reduce((sum, a) => sum + (a.current_load_kva || 0), 0); }
  get avgUtil(): number { return this.totalKva > 0 ? this.totalLoadKva / this.totalKva * 100 : 0; }
}
