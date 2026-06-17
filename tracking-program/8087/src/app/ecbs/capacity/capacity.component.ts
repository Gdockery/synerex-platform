import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-capacity',
  templateUrl: './capacity.component.html',
  styleUrls: ['./capacity.component.scss'],
})
export class CapacityComponent implements OnInit {
  projectId: number;
  loading = true;
  summary: any = null;
  assets: any[] = [];
  calculating = false;
  error: string = null;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.api.get(`/api/capacity/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.summary = r; this.loading = false; },
      error: (e: any) => { this.error = e?.error?.error || 'Failed to load.'; this.loading = false; }
    });
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.assets = r?.assets || r || []; },
      error: () => {}
    });
  }

  calculate() {
    this.calculating = true;
    this.api.post('/api/capacity/calculate', { project_id: this.projectId }).subscribe({
      next: () => { this.calculating = false; this.loadAll(); },
      error: () => { this.calculating = false; }
    });
  }

  healthClass(pct: number): string {
    if (pct >= 90) return 'badge-critical';
    if (pct >= 75) return 'badge-warning';
    return 'badge-healthy';
  }

  barColor(pct: number): string {
    if (pct >= 90) return '#f44336';
    if (pct >= 75) return '#ffd740';
    return '#00e676';
  }

  get recoveredPct(): number {
    if (!this.summary) return 0;
    const installed = this.summary.installed_capacity_kva || 0;
    const recovered = this.summary.recovered_capacity_kva || 0;
    return installed > 0 ? Math.round((recovered / installed) * 100) : 0;
  }
}
