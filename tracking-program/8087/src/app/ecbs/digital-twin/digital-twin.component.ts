import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-digital-twin',
  templateUrl: './digital-twin.component.html',
  styleUrls: ['./digital-twin.component.scss'],
})
export class DigitalTwinComponent implements OnInit {
  projectId: number;
  projectName = '';
  assets: any[] = [];
  cbi: any = null;
  loading = true;

  dtSteps = [
    { label: 'One-Line Scanner', done: false },
    { label: 'Draft Digital Twin', done: false },
    { label: 'Field Verification', done: false },
    { label: 'Engineering Review', done: false },
    { label: 'Approved', done: false },
    { label: 'Locked (Operational)', done: false },
  ];

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.projectName = p.name || '';
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({
      next: (r: any) => {
        this.assets = r?.assets || r || [];
        this.loading = false;
        if (this.assets.length > 0) {
          this.dtSteps[0].done = true;
          this.dtSteps[1].done = true;
        }
      },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/current-balance/summary?project_id=${this.projectId}`).subscribe({
      next: (r: any) => { this.cbi = r; }, error: () => {}
    });
  }

  get cbiScore(): number { return this.cbi?.score ?? this.cbi?.cbi_score ?? 0; }
  get twinStatus(): string { return this.assets.length > 0 ? 'Active' : 'Not Configured'; }
  get statusPillClass(): string { return this.assets.length > 0 ? 'hsp-excellent' : 'hsp-poor'; }

  get totalKva(): number { return this.assets.reduce((s, a) => s + (a.capacity_kva || 0), 0); }
  get totalLoadKva(): number { return this.assets.reduce((s, a) => s + (a.current_load_kva || 0), 0); }
  get avgUtil(): number { return this.totalKva > 0 ? this.totalLoadKva / this.totalKva * 100 : 0; }
  get avgPF(): number {
    if (!this.assets.length) return 0;
    return this.assets.reduce((s, a) => s + (a.power_factor || 0), 0) / this.assets.length;
  }

  barColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
}
