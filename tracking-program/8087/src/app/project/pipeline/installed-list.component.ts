import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  selector: 'installed-list',
  template: `
    <div class="container-fluid" style="padding: 20px;">
      <h3 style="margin-bottom: 20px;">
        Installed Projects
        <span class="badge" style="font-size: 14px; margin-left: 10px; background: #27ae60;">{{ projects.length }}</span>
      </h3>

      <div *ngIf="loading" class="text-center" style="padding: 40px;">
        <span class="ss-loading"></span> Loading…
      </div>

      <div *ngIf="!loading && projects.length === 0" class="text-muted" style="padding: 20px;">
        No completed installations yet.
      </div>

      <table *ngIf="!loading && projects.length > 0" class="table table-hover" style="background: #fff; border-radius: 6px;">
        <thead>
          <tr>
            <th>Project</th>
            <th>Client</th>
            <th>Location</th>
            <th>Installed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of projects" style="cursor: pointer;" (click)="selectAndGo(p)">
            <td><strong>{{ p.name }}</strong></td>
            <td>{{ p.client_name }}</td>
            <td>{{ p.location }}</td>
            <td>{{ fmtMs(p.installation_confirmed_at) }}</td>
            <td style="white-space:nowrap;">
              <button class="btn btn-xs btn-default" (click)="selectAndGo(p); $event.stopPropagation()" style="margin-right:6px;">Select →</button>
              <button class="btn btn-xs btn-info" (click)="viewPipeline(p); $event.stopPropagation()">Pipeline</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class InstalledListComponent implements OnInit {
  projects: any[] = [];
  loading = true;

  constructor(
    private api: ApiRequestService,
    private router: Router,
    private userService: CurrentUserService
  ) {}

  ngOnInit() {
    this.api.get('/api/pipeline/installed').subscribe(
      (res: any) => { this.projects = Array.isArray(res) ? res : (res.response || []); this.loading = false; },
      () => { this.loading = false; }
    );
  }

  fmtMs(ms: number): string {
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  selectAndGo(p: any) {
    this.userService.selectProject(p.id);
    window.location.hash = '#/ecbs/dashboard';
  }

  viewPipeline(p: any) {
    this.router.navigate(['/project/pipeline', p.id]);
  }
}
