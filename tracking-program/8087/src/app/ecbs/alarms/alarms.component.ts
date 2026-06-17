import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'ecbs-alarms',
  templateUrl: './alarms.component.html',
  styleUrls: ['./alarms.component.scss'],
})
export class AlarmsComponent implements OnInit {
  projectId: number;
  loading = true;
  alarms: any[] = [];
  events: any[] = [];
  summary: any = null;
  activeTab: 'alarms' | 'events' = 'alarms';

  constructor(private api: ApiRequestService, private userService: CurrentUserService) {}

  ngOnInit() {
    const p = this.userService.user?.selectedProject;
    if (!p) { this.loading = false; return; }
    this.projectId = p.id;
    this.loadAll();
  }

  loadAll() {
    const pid = this.projectId;
    this.api.get(`/api/alarms?project_id=${pid}&status=open`).subscribe({
      next: (r: any) => { this.alarms = r?.alarms || r || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.api.get(`/api/alarms/summary?project_id=${pid}`).subscribe({ next: (r: any) => { this.summary = r; }, error: () => {}});
    this.api.get(`/api/events?project_id=${pid}&limit=20`).subscribe({ next: (r: any) => { this.events = r?.events || r || []; }, error: () => {}});
  }

  severityClass(sev: string): string {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'high':     return 'badge-warning';
      case 'medium':   return 'badge-info';
      default:         return 'badge-offline';
    }
  }

  acknowledgeAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/acknowledge`, {}).subscribe({
      next: () => { alarm.status = 'acknowledged'; },
      error: () => {}
    });
  }
}
