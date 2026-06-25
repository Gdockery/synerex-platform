import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

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

  // filters
  filterStatus = '';
  filterPriority = '';
  filterCategory = '';
  search = '';
  page = 1;
  pageSize = 10;

  // new request form
  showCreate = false;
  newReq: any = { subject: '', category: '', priority: 'Medium', location: '', description: '' };
  creating = false;

  // message
  messageText = '';
  sending = false;

  readonly CATEGORIES = ['Device', 'Installation', 'Design', 'Documentation', 'Software', 'Engineering', 'Other'];
  readonly PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
  readonly STATUSES = ['Open', 'In Progress', 'Awaiting Response', 'Resolved', 'Closed'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiRequestService,
    public userSvc: CurrentUserService,
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

  // ── Sidebar data ─────────────────────────────────────────────────────────
  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }
  get voltage(): string { return (this.dep && this.dep.site_info && this.dep.site_info.service_voltage) || '—'; }
  get transformer(): string { return (this.dep && this.dep.site_info && this.dep.site_info.transformer) || '—'; }

  // ── KPI getters ──────────────────────────────────────────────────────────
  get totalRequests(): number { return this.requests.length; }
  get resolvedCount(): number { return this.requests.filter(r => r.status === 'Resolved' || r.status === 'Closed').length; }
  get resolvedPct(): number { return this.totalRequests ? Math.round(this.resolvedCount / this.totalRequests * 100) : 0; }
  get inProgressCount(): number { return this.requests.filter(r => r.status === 'In Progress').length; }
  get inProgressPct(): number { return this.totalRequests ? Math.round(this.inProgressCount / this.totalRequests * 100) : 0; }
  get awaitingCount(): number { return this.requests.filter(r => r.status === 'Awaiting Response').length; }
  get awaitingPct(): number { return this.totalRequests ? Math.round(this.awaitingCount / this.totalRequests * 100) : 0; }
  get highPriorityCount(): number { return this.requests.filter(r => r.priority === 'High' || r.priority === 'Critical').length; }
  get highPriorityPct(): number { return this.totalRequests ? Math.round(this.highPriorityCount / this.totalRequests * 100) : 0; }
  get slaCompliant(): number {
    const met = this.requests.filter(r => r.sla_status === 'Met' || r.sla_met === true).length;
    return this.totalRequests ? Math.round(met / this.totalRequests * 100) : 100;
  }

  // ── Filtered list ────────────────────────────────────────────────────────
  get filtered(): any[] {
    return this.requests.filter(r => {
      if (this.filterStatus && r.status !== this.filterStatus) return false;
      if (this.filterPriority && r.priority !== this.filterPriority) return false;
      if (this.filterCategory && r.category !== this.filterCategory) return false;
      if (this.search) {
        const q = this.search.toLowerCase();
        const txt = ((r.subject || '') + ' ' + (r.request_id || '') + ' ' + (r.category || '')).toLowerCase();
        if (txt.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  get paged(): any[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get totalPages(): number { return Math.ceil(this.filtered.length / this.pageSize); }
  get pageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) pages.push(i);
    return pages;
  }

  // ── Analytics ────────────────────────────────────────────────────────────
  get requestsByCategory(): any[] {
    const counts: {[k: string]: number} = {};
    this.requests.forEach(r => {
      const c = r.category || 'Other';
      counts[c] = (counts[c] || 0) + 1;
    });
    const total = this.requests.length || 1;
    return Object.keys(counts).map(cat => ({
      cat, cnt: counts[cat], pct: Math.round(counts[cat] / total * 100)
    })).sort((a, b) => b.cnt - a.cnt);
  }

  // ── Styling ──────────────────────────────────────────────────────────────
  statusClass(s: string): string {
    if (!s) return '';
    const sl = s.toLowerCase();
    if (sl === 'resolved' || sl === 'closed') return 'es-s--green';
    if (sl === 'in progress') return 'es-s--blue';
    if (sl === 'awaiting response') return 'es-s--amber';
    if (sl === 'open') return 'es-s--red';
    return 'es-s--dim';
  }

  priorityClass(p: string): string {
    if (!p) return '';
    const pl = p.toLowerCase();
    if (pl === 'critical') return 'es-p--red';
    if (pl === 'high')     return 'es-p--orange';
    if (pl === 'medium')   return 'es-p--amber';
    return 'es-p--dim';
  }

  slaClass(r: any): string {
    if (!r) return '';
    if (r.sla_status === 'Overdue' || r.sla_overdue === true) return 'es-sla--red';
    if (r.sla_status === 'Met') return 'es-sla--green';
    return 'es-sla--amber';
  }

  catIcon(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c === 'device')        return 'fa-microchip';
    if (c === 'installation')  return 'fa-wrench';
    if (c === 'design')        return 'fa-pencil-square-o';
    if (c === 'documentation') return 'fa-file-text-o';
    if (c === 'software')      return 'fa-laptop';
    if (c === 'engineering')   return 'fa-cogs';
    return 'fa-ellipsis-h';
  }

  catColor(cat: string): string {
    const c = (cat || '').toLowerCase();
    if (c === 'device')        return '#3b82f6';
    if (c === 'installation')  return '#f59e0b';
    if (c === 'design')        return '#a855f7';
    if (c === 'documentation') return '#06b6d4';
    if (c === 'software')      return '#22c55e';
    if (c === 'engineering')   return '#f97316';
    return '#6b7280';
  }

  // ── Actions ──────────────────────────────────────────────────────────────
  select(r: any) { this.selected = r; }

  createRequest() {
    if (!this.newReq.subject) return;
    this.creating = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/engineering-support', this.newReq).subscribe({
      next: (r: any) => {
        const created = r && r.response ? r.response : r;
        this.requests.unshift(created);
        this.selected = created;
        this.showCreate = false;
        this.newReq = { subject: '', category: '', priority: 'Medium', location: '', description: '' };
        this.creating = false;
      },
      error: () => { this.creating = false; }
    });
  }

  sendMessage() {
    if (!this.messageText || !this.selected) return;
    this.sending = true;
    this.api.post('/api/dep/eng-support/' + this.selected.id + '/message', { message: this.messageText }).subscribe({
      next: (r: any) => {
        const msg = r && r.response ? r.response : { message: this.messageText };
        if (!this.selected.messages) this.selected.messages = [];
        this.selected.messages.push(msg);
        this.messageText = '';
        this.sending = false;
      },
      error: () => { this.sending = false; }
    });
  }

  get userName(): string {
    const u = this.userSvc.user;
    if (!u) return '';
    return ((u.firstName || '') + ' ' + (u.lastName || '')).trim();
  }
}
