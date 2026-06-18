import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-sites',
  templateUrl: './sites.component.html',
  styleUrls: ['./sites.component.scss'],
})
export class SitesComponent implements OnInit {
  projectId: number;
  loading = true;
  project: any = null;
  cbiData: any = null;
  alarmSummary: any = null;
  capacityData: any = null;
  savingsData: any = null;
  deviceCount: number = 0;

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.project = p;
    this.loadAll();
  }

  loadAll() {
    this.loading = false;
    const pid = this.projectId;
    this.api.get(`/api/current-balance/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.cbiData = r; }, error: () => {}});
    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.alarmSummary = r; }, error: () => {}});
    this.api.get(`/api/capacity/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.capacityData = r; }, error: () => {}});
    this.api.get(`/api/savings/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.savingsData = r; }, error: () => {}});
    this.api.get(`/api/devices/count?project_id=${pid}`).subscribe({ next: (r: any) => { this.deviceCount = r?.count || r?.total || 0; }, error: () => {}});
  }

  get cbiScore(): number { return this.cbiData?.score ?? this.cbiData?.cbi_score ?? 0; }

  get siteHealthStatus(): { label: string; color: string } {
    const alarms = this.alarmSummary?.critical ?? 0;
    const cbi = this.cbiScore;
    if (alarms > 0 || cbi < 70)  return { label: 'Needs Attention', color: '#f44336' };
    if (cbi < 85) return { label: 'Fair', color: '#ffd740' };
    return { label: 'Healthy', color: '#00e676' };
  }
}
