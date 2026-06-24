import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-eng-support',
  templateUrl: './deployment-eng-support.component.html',
  styleUrls: ['./deployment-eng-support.component.scss'],
})
export class DeploymentEngSupportComponent implements OnInit {
  depId = 0;
  dep: any = null;
  requests: any[] = [];
  selected: any = null;
  loading = true;
  syncedAt = '';
  showCreate = false;
  newRequest: any = { subject: '', description: '', category: 'Design Change', priority: 'Medium' };
  saving = false;
  filterStatus = '';
  messageText = '';

  readonly CATEGORIES = ['Design Change', 'Clarification', 'Configuration', 'Documentation', 'Drawing Update', 'Other'];
  readonly STATUSES   = ['Open', 'In Progress', 'Resolved', 'Closed'];
  readonly PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
  ) {}

  ngOnInit() {
    this.route.parent!.params.subscribe(p => {
      this.depId = +p['id'];
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }, error: () => {}
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/engineering-support').subscribe({
      next: (r: any) => {
        this.requests = Array.isArray(r && r.response ? r.response : r) ? (r.response || r) : [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }

  get filtered(): any[] {
    if (!this.filterStatus) return this.requests;
    return this.requests.filter(r => r.status === this.filterStatus);
  }

  get openCount(): number { return this.requests.filter(r => r.status === 'Open').length; }
  get inProgressCount(): number { return this.requests.filter(r => r.status === 'In Progress').length; }
  get resolvedCount(): number { return this.requests.filter(r => r.status === 'Resolved').length; }
  get closedCount(): number { return this.requests.filter(r => r.status === 'Closed').length; }

  select(req: any) { this.selected = req; }

  statusClass(s: string): string {
    if (!s) return 'dim';
    const sl = s.toLowerCase();
    if (sl === 'open') return 'amber';
    if (sl === 'in progress') return 'blue';
    if (sl === 'resolved') return 'green';
    if (sl === 'closed') return 'dim';
    return 'dim';
  }

  priorityClass(p: string): string {
    if (!p) return 'dim';
    const pl = p.toLowerCase();
    if (pl === 'critical') return 'red';
    if (pl === 'high') return 'orange';
    if (pl === 'medium') return 'amber';
    return 'dim';
  }

  createRequest() {
    if (!this.newRequest.subject) return;
    this.saving = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/engineering-support', {
      ...this.newRequest, deployment_id: this.depId,
    }).subscribe({
      next: () => {
        this.saving = false; this.showCreate = false;
        this.newRequest = { subject: '', description: '', category: 'Design Change', priority: 'Medium' };
        this.load();
      },
      error: () => { this.saving = false; }
    });
  }

  sendMessage() {
    if (!this.selected || !this.messageText.trim()) return;
    this.api.post('/api/dep/eng-support/' + this.selected.id + '/message', { message: this.messageText }).subscribe({
      next: () => { this.messageText = ''; this.load(); }
    });
  }
}
