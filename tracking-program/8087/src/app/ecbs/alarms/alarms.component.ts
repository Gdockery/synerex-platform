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
  activeTab: 'alarms' | 'events' | 'rules' = 'alarms';
  alertRules: any[] = [];

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
    this.api.get(`/api/events?project_id=${pid}&limit=50`).subscribe({ next: (r: any) => { this.events = r?.events || r || []; }, error: () => {}});
    this.api.get(`/api/alert-rules?project_id=${pid}`).subscribe({ next: (r: any) => { this.alertRules = r?.rules || r || []; }, error: () => {}});
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
      next: () => { alarm.status = 'acknowledged'; }, error: () => {}
    });
  }

  resolveAlarm(alarm: any) {
    this.api.post(`/api/alarms/${alarm.id}/resolve`, {}).subscribe({
      next: () => { alarm.status = 'resolved'; this.alarms = this.alarms.filter(a => a.id !== alarm.id); },
      error: () => {}
    });
  }

  toggleRule(rule: any) {
    rule.enabled = !rule.enabled;
    this.api.post(`/api/alert-rules/${rule.id}/toggle`, { enabled: rule.enabled }).subscribe({ error: () => { rule.enabled = !rule.enabled; }});
  }

  loadDefaultRules() {
    this.alertRules = [
      { id: 1, name: 'Low CBI Score',            metric: 'CBI Score',              condition: '<',  threshold: 70,   unit: '',   severity: 'critical', notify: 'In-App + Email', enabled: true  },
      { id: 2, name: 'High Harmonic Current',     metric: 'THDi',                   condition: '>',  threshold: 20,   unit: '%',  severity: 'high',     notify: 'In-App',         enabled: true  },
      { id: 3, name: 'Transformer Overload',      metric: 'Transformer Utilization', condition: '>',  threshold: 90,   unit: '%',  severity: 'critical', notify: 'In-App + Email', enabled: true  },
      { id: 4, name: 'Low Power Factor',          metric: 'Power Factor',            condition: '<',  threshold: 0.85, unit: '',   severity: 'medium',   notify: 'In-App',         enabled: true  },
      { id: 5, name: 'Device Offline',            metric: 'Device Comm.',            condition: '=',  threshold: 'Offline', unit: '', severity: 'high',  notify: 'In-App + SMS',   enabled: true  },
      { id: 6, name: 'Phase Imbalance',           metric: 'Imbalance',              condition: '>',  threshold: 10,   unit: '%',  severity: 'high',     notify: 'In-App',         enabled: false },
    ];
  }
}
