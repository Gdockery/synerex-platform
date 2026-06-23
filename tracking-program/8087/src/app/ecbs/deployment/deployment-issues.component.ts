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
  newIssue: any = { title: '', description: '', priority: 'Medium', impact_level: 'Documentation Only' };
  saving = false;
  filterStatus = '';
  filterPriority = '';

  readonly PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
  readonly IMPACTS = ['Documentation Only', 'Installation Impact', 'Commissioning Blocker', 'Safety Hold'];
  readonly STATUSES = ['Open', 'In Progress', 'On Hold', 'Resolved'];

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiRequestService) {}

  ngOnInit() {
    this.route.params.subscribe((p: any) => {
      this.depId = Number(p['id']);
      this.load();
    });
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments/' + this.depId + '/issues').subscribe({
      next: (r: any) => {
        this.issues = (r && r.response) ? r.response : [];
        if (this.selected) {
          var id = this.selected.id;
          for (var i = 0; i < this.issues.length; i++) {
            if (this.issues[i].id === id) { this.selected = this.issues[i]; break; }
          }
        }
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get filtered(): any[] {
    var result: any[] = [];
    for (var i = 0; i < this.issues.length; i++) {
      var iss = this.issues[i];
      if (this.filterStatus && iss.status !== this.filterStatus) continue;
      if (this.filterPriority && iss.priority !== this.filterPriority) continue;
      result.push(iss);
    }
    return result;
  }

  get kpiTotal(): number { return this.issues.length; }
  get kpiHigh(): number { var n = 0; for (var i = 0; i < this.issues.length; i++) { if (this.issues[i].priority === 'High' || this.issues[i].priority === 'Critical') n++; } return n; }
  get kpiResolved(): number { var n = 0; for (var i = 0; i < this.issues.length; i++) { if (this.issues[i].status === 'Resolved') n++; } return n; }
  get kpiOpen(): number { var n = 0; for (var i = 0; i < this.issues.length; i++) { if (this.issues[i].status !== 'Resolved') n++; } return n; }

  select(iss: any) { this.selected = iss; }

  createIssue() {
    if (!this.newIssue.title) return;
    this.saving = true;
    this.api.post('/api/dep/deployments/' + this.depId + '/issues', {
      title: this.newIssue.title,
      description: this.newIssue.description,
      priority: this.newIssue.priority,
      impact_level: this.newIssue.impact_level,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.showCreate = false;
        this.newIssue = { title: '', description: '', priority: 'Medium', impact_level: 'Documentation Only' };
        this.load();
      },
      error: () => { this.saving = false; },
    });
  }

  updateStatus(iss: any, status: string) {
    this.api.patch('/api/dep/issues/' + iss.id, { status: status }).subscribe({
      next: () => this.load(),
    });
  }

  priorityClass(p: string): string {
    if (p === 'Critical') return 'pri-critical';
    if (p === 'High') return 'pri-high';
    if (p === 'Medium') return 'pri-medium';
    return 'pri-low';
  }

  impactClass(imp: string): string {
    if (imp === 'Safety Hold') return 'imp-safety';
    if (imp === 'Commissioning Blocker') return 'imp-blocker';
    if (imp === 'Installation Impact') return 'imp-install';
    return 'imp-doc';
  }

  fmtDate(ms: any): string {
    if (!ms) return '—';
    return new Date(Number(ms)).toLocaleDateString();
  }

  goBack() { this.router.navigate(['/ecbs/deployment', this.depId]); }
}
