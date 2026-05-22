import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiRequestService } from '../../api/api-request.service';

@Component({
  selector: 'pipeline-list',
  template: `
    <div class="container-fluid" style="padding: 20px;">
      <h3 style="margin-bottom: 20px;">
        Pipeline Projects
        <span class="badge" style="font-size: 14px; margin-left: 10px; background: #3498db;">{{ projects.length }}</span>
      </h3>

      <div *ngIf="loading" class="text-center" style="padding: 40px;">
        <span class="ss-loading"></span> Loading pipeline…
      </div>

      <div *ngIf="!loading && projects.length === 0" class="text-muted" style="padding: 20px;">
        No active pipeline projects. Scan a bill to create one.
      </div>

      <div *ngIf="!loading">
        <!-- Filter bar -->
        <div style="margin-bottom: 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
          <label style="font-weight: 600; margin-bottom: 0;">Filter:</label>
          <button class="btn btn-xs" [class.btn-primary]="filter === 'all'" [class.btn-default]="filter !== 'all'" (click)="filter='all'">All ({{ projects.length }})</button>
          <button class="btn btn-xs" [class.btn-warning]="filter === 'waiting'" [class.btn-default]="filter !== 'waiting'" (click)="filter='waiting'">
            Waiting on Customer ({{ waitingCount }})
          </button>
          <button class="btn btn-xs" [class.btn-success]="filter === 'progressing'" [class.btn-default]="filter !== 'progressing'" (click)="filter='progressing'">Progressing ({{ progressingCount }})</button>
        </div>

        <!-- Project cards -->
        <div *ngFor="let p of filteredProjects()" class="pipeline-card" (click)="openProject(p)"
          style="background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 16px 20px;
                 margin-bottom: 12px; cursor: pointer; display: flex; align-items: center;
                 justify-content: space-between; gap: 16px; transition: box-shadow .15s;"
          onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.12)'"
          onmouseout="this.style.boxShadow='none'">

          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ p.name }}</div>
            <div style="color: #777; font-size: 13px;">{{ p.client_name }}<span *ngIf="p.location"> &mdash; {{ p.location }}</span></div>
          </div>

          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-size: 13px; font-weight: 600; color: #555; margin-bottom: 4px;">{{ p.current_stage }}</div>
            <span *ngIf="p.waiting_on_customer"
              style="background: #e67e22; color: #fff; font-size: 11px; font-weight: 700;
                     padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: .5px;">
              Waiting on Customer
            </span>
            <span *ngIf="!p.waiting_on_customer && p.release_status"
              style="background: #27ae60; color: #fff; font-size: 11px; font-weight: 700;
                     padding: 2px 8px; border-radius: 10px;">
              Released
            </span>
          </div>

          <div style="flex-shrink: 0; color: #aaa; font-size: 18px;">&rsaquo;</div>
        </div>
      </div>
    </div>
  `
})
export class PipelineListComponent implements OnInit {
  projects: any[] = [];
  loading = true;
  filter: 'all' | 'waiting' | 'progressing' = 'all';

  get waitingCount() { return this.projects.filter(p => p.waiting_on_customer).length; }
  get progressingCount() { return this.projects.filter(p => !p.waiting_on_customer).length; }

  constructor(private api: ApiRequestService, private router: Router) {}

  ngOnInit() {
    this.api.get('/api/pipeline/projects').subscribe(
      (res: any) => {
        this.projects = Array.isArray(res) ? res : (res.response || []);
        this.loading = false;
      },
      () => { this.loading = false; }
    );
  }

  filteredProjects() {
    if (this.filter === 'waiting')     return this.projects.filter(p => p.waiting_on_customer);
    if (this.filter === 'progressing') return this.projects.filter(p => !p.waiting_on_customer);
    return this.projects;
  }

  openProject(p: any) {
    this.router.navigate(['/project/pipeline', p.id]);
  }
}
