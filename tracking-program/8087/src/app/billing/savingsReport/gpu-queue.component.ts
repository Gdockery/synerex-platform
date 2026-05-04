import { Component, OnInit, OnDestroy } from '@angular/core';
import { MyJobsService } from './my-jobs.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Component({
  template: `
    <div class="content-box" style="padding:1.5em;">
      <h2 style="color:#4a1a5c; margin-top:0;">GPU Job Queue
        <small style="font-size:0.6em; font-weight:normal; color:#888;"> — all active jobs across all users</small>
      </h2>

      <div *ngIf="userService.user.role !== 8" style="padding:1em; background:#f8d7da; border-radius:5px; color:#721c24;">
        Admin access required (role 8 only).
      </div>

      <ng-container *ngIf="userService.user.role === 8">
        <div style="margin-bottom:1em; display:flex; gap:10px; align-items:center;">
          <button type="button" class="default-button" (click)="loadQueue()" [disabled]="loading">
            {{ loading ? 'Loading…' : '↻ Refresh' }}
          </button>
          <span *ngIf="lastRefreshed" style="font-size:0.85em; color:#888;">Last refreshed: {{ lastRefreshed }}</span>
        </div>

        <div *ngIf="error" style="padding:0.75em 1em; background:#f8d7da; border-radius:5px; color:#721c24; margin-bottom:1em;">
          {{ error }}
        </div>

        <div *ngIf="!loading && !error && queue.length === 0" style="color:#888; font-style:italic;">
          No active jobs in queue.
        </div>

        <table *ngIf="queue.length > 0" class="table table-bordered table-condensed" style="font-size:0.9em;">
          <thead style="background:#f5f0ff;">
            <tr>
              <th>Type</th>
              <th>GPU ID</th>
              <th>Filename</th>
              <th>Status</th>
              <th>Elapsed (min)</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of queue" [style.background]="getRowBg(job.status)">
              <td>{{ job.job_type === 'sld' ? '📐 SLD' : '🧾 Bill' }}</td>
              <td>{{ job.id }}</td>
              <td style="max-width:220px; word-break:break-all;">{{ job.filename || '—' }}</td>
              <td>
                <span [style.color]="getStatusColor(job.status)">{{ job.status }}</span>
              </td>
              <td>{{ job.elapsed_min != null ? job.elapsed_min.toFixed(1) : '—' }}</td>
              <td style="white-space:nowrap;">{{ formatDate(job.created_at) }}</td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="count != null" style="font-size:0.85em; color:#888; margin-top:0.5em;">
          {{ count }} job(s) in queue
        </div>
      </ng-container>
    </div>
  `
})
export class GpuQueueComponent implements OnInit, OnDestroy {
  queue: any[] = [];
  count: number | null = null;
  loading = false;
  error: string | null = null;
  lastRefreshed: string | null = null;
  private _refreshInterval: any = null;

  constructor(
    public userService: CurrentUserService,
    private myJobsService: MyJobsService,
  ) {}

  ngOnInit() {
    if (this.userService.user.role === 8) {
      this.loadQueue();
      this._refreshInterval = setInterval(() => this.loadQueue(), 30000);
    }
  }

  ngOnDestroy() {
    if (this._refreshInterval) clearInterval(this._refreshInterval);
  }

  loadQueue() {
    this.loading = true;
    this.error = null;
    this.myJobsService.getQueue().subscribe(
      (res: any) => {
        this.loading = false;
        this.queue = res.queue || [];
        this.count = res.count != null ? res.count : this.queue.length;
        this.lastRefreshed = new Date().toLocaleTimeString();
      },
      (err: any) => {
        this.loading = false;
        if (err && err.status === 403) {
          this.error = 'Admin access required — token rejected by GPU server.';
        } else {
          const msg = (err && err.error && err.error.error) || 'Failed to load queue.';
          this.error = msg;
        }
      }
    );
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleString(); } catch { return dateStr; }
  }

  getStatusColor(status: string): string {
    if (!status) return '#555';
    if (status === 'processing') return '#0056b3';
    if (status.startsWith('retrying_')) return '#856404';
    if (status === 'pending_review') return '#155724';
    if (status === 'failed') return '#721c24';
    return '#555';
  }

  getRowBg(status: string): string {
    if (!status) return '';
    if (status === 'pending_review') return '#f0fff4';
    if (status === 'failed') return '#fff5f5';
    if (status.startsWith('retrying_')) return '#fffbf0';
    return '';
  }
}
