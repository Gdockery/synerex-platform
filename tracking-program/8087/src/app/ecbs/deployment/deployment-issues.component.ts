import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'app-deployment-issues',
  templateUrl: './deployment-issues.component.html',
  styleUrls: ['./deployment-issues.component.scss'],
})
export class DeploymentIssuesComponent implements OnInit {
  depId: number = 0;
  issues: any[] = [];
  selected: any = null;
  loading = true;
  showCreate = false;
  newIssue: any = { title: '', description: '', priority: 'Medium', category: 'Device', impact_level: 'Documentation Only' };
  saving = false;
  filterStatus = '';
  filterPriority = '';
  filterCategory = '';
  search = '';
  commentText = '';
  dep: any = null;
  syncedAt = '';

  readonly PRIORITIES  = ['Low', 'Medium', 'High', 'Critical'];
  readonly IMPACTS     = ['Documentation Only', 'Installation Impact', 'Commissioning Blocker', 'Safety Hold'];
  readonly STATUSES    = ['Open', 'In Progress', 'Pending OEM', 'Resolved'];
  readonly CATEGORIES  = ['Device', 'Installation', 'Documentation', 'Communication', 'Other'];

  // quick action modals
  showAddNote = false;
  noteText = '';
  savingNote = false;
  showReassign = false;
  reassignTo = '';
  reassigning = false;
  showSlaPanel = false;
  actionMsg = '';

  // SLA computed properties
  get slaWithin(): number { return this.issues.filter((i: any) => i.status !== 'Overdue' && i.status !== 'Escalated').length; }
  get slaDueToday(): number { return this.issues.filter((i: any) => { const d = i.due_date ? new Date(i.due_date) : null; if (!d) return false; const today = new Date(); return d.toDateString() === today.toDateString(); }).length; }
  get slaOverdue(): number { return this.issues.filter((i: any) => { const d = i.due_date ? new Date(i.due_date) : null; return d && d < new Date() && i.status !== 'Resolved'; }).length; }
  get slaEscalated(): number { return this.issues.filter((i: any) => i.escalated || i.priority === 'Critical').length; }

  goEngineering() { this.router.navigate(['/ecbs/deployment', this.depId, 'engineering-support']); }

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.parent!.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId).subscribe({
      next: (r: any) => {
        this.dep = r && r.response ? r.response : r;
        this.syncedAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      },
      error: () => {}
    });
    this.api.get('/api/dep/deployments/' + this.depId + '/issues').subscribe({
      next: (r: any) => {
        this.issues = (r && r.response) ? r.response : [];
        if (this.selected) {
          const id = this.selected.id;
          const found = this.issues.find(x => x.id === id);
          if (found) this.selected = found;
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get siteName(): string {
    return (this.dep && this.dep.site_info && this.dep.site_info.name) ||
           (this.dep && this.dep.project_info && this.dep.project_info.name) || '—';
  }
  get depStatus(): string { return (this.dep && this.dep.status) || ''; }
  get depNumber(): string { return (this.dep && (this.dep.deployment_number || this.dep.id)) || '—'; }
  get utility(): string { return (this.dep && this.dep.site_info && this.dep.site_info.utility) || '—'; }

  get filtered(): any[] {
    return this.issues.filter(i => {
      if (this.filterStatus && i.status !== this.filterStatus) return false;
      if (this.filterPriority && i.priority !== this.filterPriority) return false;
      if (this.filterCategory && i.category !== this.filterCategory) return false;
      if (this.search) {
        const q = this.search.toLowerCase();
        const txt = ((i.title || '') + (i.description || '') + (i.issue_number || '')).toLowerCase();
        if (txt.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  get openCount(): number { return this.issues.filter(i => i.status === 'Open').length; }
  get inProgressCount(): number { return this.issues.filter(i => i.status === 'In Progress').length; }
  get pendingOemCount(): number { return this.issues.filter(i => i.status === 'Pending OEM').length; }
  get resolvedCount(): number { return this.issues.filter(i => i.status === 'Resolved').length; }
  get slaCompliance(): number {
    if (!this.issues.length) return 100;
    const resolved = this.resolvedCount;
    return Math.round(resolved / this.issues.length * 100);
  }

  get issuesByCategory(): any[] {
    const counts: {[k:string]: number} = {};
    for (const i of this.issues) {
      const c = i.category || 'Other';
      counts[c] = (counts[c] || 0) + 1;
    }
    const total = this.issues.length || 1;
    return Object.keys(counts).map(cat => {
      const cnt = counts[cat];
      return { cat, cnt, pct: Math.round(cnt / total * 100) };
    }).sort((a,b) => b.cnt - a.cnt);
  }

  // Aging buckets (mock since we may not have SLA data)
  get agingBuckets(): any {
    return { overdue: 2, d1to2: 3, d3to7: 2, gt7: 0 };
  }

  select(issue: any) { this.selected = issue; }

  priorityClass(p: string): string {
    if (!p) return 'dim';
    const pl = p.toLowerCase();
    if (pl === 'critical') return 'red';
    if (pl === 'high') return 'orange';
    if (pl === 'medium') return 'amber';
    return 'dim';
  }

  statusClass(s: string): string {
    if (!s) return 'dim';
    const sl = s.toLowerCase();
    if (sl === 'open') return 'red';
    if (sl === 'in progress') return 'blue';
    if (sl === 'pending oem') return 'purple';
    if (sl === 'resolved') return 'green';
    return 'dim';
  }

  createIssue() {
    if (!this.newIssue.title) return;
    this.saving = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/issues', {
      ...this.newIssue,
      deployment_id: this.depId,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showCreate = false;
        this.newIssue = { title: '', description: '', priority: 'Medium', category: 'Device', impact_level: 'Documentation Only' };
        this.load();
      },
      error: () => { this.saving = false; }
    });
  }

  resolveIssue() {
    if (!this.selected) return;
    this.api.patch('/api/dep/issues/' + this.selected.id, { status: 'Resolved' }).subscribe({
      next: () => { this.load(); }
    });
  }

  updateStatus(status: string) {
    if (!this.selected) return;
    this.api.patch('/api/dep/issues/' + this.selected.id, { status }).subscribe({
      next: () => { this.load(); }
    });
  }

  // ── KPI filter ───────────────────────────────────────────────────────────
  filterKpi(status: string) {
    this.filterStatus = this.filterStatus === status ? '' : status;
  }

  filterExternal() {
    // Filter to issues waiting on external parties
    this.filterStatus = 'Pending OEM';
  }

  toggleSlaPanel() { this.showSlaPanel = !this.showSlaPanel; }

  // ── Quick actions ─────────────────────────────────────────────────────────
  openAddNote() { this.showAddNote = true; this.noteText = ''; }
  saveNote() {
    if (!this.selected || !this.noteText) return;
    this.savingNote = true;
    this.api.post('/api/dep/issues/' + this.selected.id + '/comments', { text: this.noteText, type: 'note' }).subscribe({
      next: () => { this.savingNote = false; this.showAddNote = false; this.load(); },
      error: () => { this.savingNote = false; }
    });
  }

  openReassign() { this.showReassign = true; this.reassignTo = ''; }
  submitReassign() {
    if (!this.selected || !this.reassignTo) return;
    this.reassigning = true;
    this.api.post('/api/dep/issues/' + this.selected.id + '/reassign', { assigned_to: this.reassignTo }).subscribe({
      next: () => { this.reassigning = false; this.showReassign = false; this.load(); },
      error: () => { this.reassigning = false; }
    });
  }

  uploadPhotoForIssue(event: any) {
    if (!this.selected) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('deployment_id', String(this.depId));
    form.append('issue_id', String(this.selected.id));
    form.append('photo_type', 'Issue');
    this.api.post('/api/dep/photos/upload', form).subscribe({
      next: () => { this.actionMsg = 'Photo attached to issue.'; setTimeout(() => this.actionMsg = '', 3000); },
      error: () => {}
    });
  }

  attachDocument(event: any) {
    if (!this.selected) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('issue_id', String(this.selected.id));
    this.api.post('/api/dep/issues/' + this.selected.id + '/attachments', form).subscribe({
      next: () => { this.actionMsg = 'Document attached.'; setTimeout(() => this.actionMsg = '', 3000); },
      error: () => {}
    });
  }

  escalateIssue() {
    if (!this.selected) return;
    this.api.post('/api/dep/issues/' + this.selected.id + '/escalate', {}).subscribe({
      next: () => { this.actionMsg = 'Issue escalated to Engineering Manager.'; setTimeout(() => this.actionMsg = '', 4000); this.load(); },
      error: () => {}
    });
  }

  addComment() {
    if (!this.selected || !this.commentText.trim()) return;
    this.api.post('/api/dep/issues/' + this.selected.id + '/comment', { comment: this.commentText }).subscribe({
      next: () => { this.commentText = ''; this.load(); }
    });
  }
}
