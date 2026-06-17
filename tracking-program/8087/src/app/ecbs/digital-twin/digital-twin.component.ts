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
  assets: any[] = [];
  cbi: any = null;
  loading = true;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.api.get(`/api/capacity/assets?project_id=${this.projectId}`).subscribe({ next: (r: any) => { this.assets = r?.assets || r || []; this.loading = false; }, error: () => { this.loading = false; }});
    this.api.get(`/api/current-balance/summary?project_id=${this.projectId}`).subscribe({ next: (r: any) => { this.cbi = r; }, error: () => {}});
  }

  get cbiScore(): number { return this.cbi?.score ?? this.cbi?.cbi_score ?? 0; }
  barColor(pct: number): string { return pct >= 90 ? '#f44336' : pct >= 75 ? '#ffd740' : '#00e676'; }
}
