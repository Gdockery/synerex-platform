import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'app-deployment-list',
  templateUrl: './deployment-list.component.html',
  styleUrls: ['./deployment-list.component.scss'],
})
export class DeploymentListComponent implements OnInit {
  deployments: any[] = [];
  loading = true;
  projectId: number = 0;
  projectName: string = '';
  showCreate = false;
  newName = '';
  creating = false;
  createError = '';
  canCreate = false;

  // Field-mode project picker (role 14)
  isFieldMode = false;
  assignedProjects: any[] = [];
  projectSelected = false;

  constructor(
    private api: ApiRequestService,
    private userService: CurrentUserService,
    private router: Router,
  ) {}

  ngOnInit() {
    const role = Number(this.userService.user && this.userService.user.role || 0);
    this.canCreate = role !== 14;
    this.isFieldMode = role === 14;

    if (this.isFieldMode) {
      // For role 14: pull released projects from bootstrap data and pick automatically
      const allProjects = (this.userService.user && (this.userService.user as any).projects) || [];
      this.assignedProjects = allProjects.filter((p: any) => p.releaseStatus);
      if (this.assignedProjects.length === 1) {
        this.selectFieldProject(this.assignedProjects[0]);
      } else {
        this.loading = false;
      }
    } else {
      const p = this.userService.user && this.userService.user.selectedProject;
      if (p) {
        this.projectId = p.id;
        this.projectName = p.name ? p.name.toString() : '';
      }
      this.load();
    }
  }

  selectFieldProject(p: any) {
    this.projectId = p.id;
    this.projectName = p.name ? p.name.toString() : '';
    this.projectSelected = true;
    this.load();
  }

  load() {
    this.loading = true;
    this.api.get('/api/dep/deployments?project=' + this.projectId).subscribe({
      next: (r: any) => {
        this.deployments = (r && r.response) ? r.response : [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  open(dep: any) {
    this.router.navigate(['/ecbs/deployment', dep.id]);
  }

  create() {
    const name = this.newName.trim();
    if (!name) return;

    // Re-read project at call time in case it was selected after ngOnInit
    if (!this.projectId) {
      const p = this.userService.user && this.userService.user.selectedProject;
      if (p) {
        this.projectId = p.id;
        this.projectName = p.name ? p.name.toString() : '';
      }
    }

    if (!this.projectId) {
      this.createError = 'No project selected. Please select a project first.';
      return;
    }

    this.createError = '';
    this.creating = true;
    this.api.post('/api/dep/deployments', {
      project_id: this.projectId,
      deployment_name: name,
    }).subscribe({
      next: (r: any) => {
        const dep = (r && r.response) ? r.response : null;
        this.creating = false;
        this.showCreate = false;
        this.newName = '';
        this.createError = '';
        if (dep) {
          this.router.navigate(['/ecbs/deployment', dep.id]);
        } else {
          this.load();
        }
      },
      error: (err: any) => {
        this.creating = false;
        const code = err && err.code;
        if (code === 400) {
          this.createError = 'Invalid request. Check that a project is selected.';
        } else if (code === 404) {
          this.createError = 'Project not found or not accessible.';
        } else {
          this.createError = 'Failed to create deployment. Please try again.';
        }
        console.error('[Deployment] create failed:', err);
      },
    });
  }

  statusClass(s: string): string {
    var m: any = {
      'not_started': 'status-pending',
      'scheduled': 'status-warning',
      'installing': 'status-active',
      'commissioning': 'status-active',
      'awaiting_approval': 'status-warning',
      'activated': 'status-online',
      'on_hold': 'status-offline',
      'closed': 'status-online',
    };
    return m[s] || 'status-pending';
  }

  statusLabel(s: string): string {
    var m: any = {
      'not_started': 'Not Started',
      'scheduled': 'Scheduled',
      'installing': 'In Progress',
      'commissioning': 'Commissioning',
      'awaiting_approval': 'Awaiting Approval',
      'activated': 'Activated',
      'on_hold': 'On Hold',
      'closed': 'Closed',
    };
    return m[s] || s;
  }

  fmtDate(ms: any): string {
    if (!ms) return '—';
    return new Date(Number(ms)).toLocaleDateString();
  }
}
