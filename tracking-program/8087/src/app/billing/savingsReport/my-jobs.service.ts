import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiRequestService } from '../../api/api-request.service';

export interface MyJob {
  job_type: 'bill' | 'sld';
  gpu_job_id: number;
  filename: string;
  submitted_at: number;       // epoch ms
  estimated_minutes: number;
  // Runtime state (not persisted)
  _status?: string;           // 'pending' | 'done' | 'error' | 'retrying_N'
  _errorMsg?: string;
  _errorNotes?: string;
  _showError?: boolean;
}

@Injectable()
export class MyJobsService {
  private readonly PREFIX = 'myjobs_';

  constructor(private apiRequestService: ApiRequestService) {}

  getJobs(projectId: number): MyJob[] {
    try {
      const raw = localStorage.getItem(this.PREFIX + projectId);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  addJob(projectId: number, job: Omit<MyJob, 'submitted_at'>) {
    const jobs = this.getJobs(projectId);
    // Avoid duplicates (same gpu_job_id + job_type)
    const exists = jobs.some(j => j.gpu_job_id === job.gpu_job_id && j.job_type === job.job_type);
    if (!exists) {
      jobs.push({ ...job, submitted_at: Date.now() } as MyJob);
      this._save(projectId, jobs);
    }
  }

  removeJob(projectId: number, gpuJobId: number, jobType: string) {
    const jobs = this.getJobs(projectId).filter(
      j => !(j.gpu_job_id == gpuJobId && j.job_type === jobType)
    );
    this._save(projectId, jobs);
  }

  pollBill(gpuJobId: number): Observable<any> {
    return this.apiRequestService.get(`/api/bill/analyze/${gpuJobId}`);
  }

  pollSld(gpuJobId: number): Observable<any> {
    return this.apiRequestService.get(`/api/sld/analyze/${gpuJobId}`);
  }

  getQueue(): Observable<any> {
    return this.apiRequestService.get('/api/gpu/queue');
  }

  /**
   * Classify error_notes to determine if the error is recoverable (Retry enabled)
   * or non-recoverable (Manual Entry only).
   */
  isRecoverableError(errorNotes: string): boolean {
    if (!errorNotes) return true;
    const n = errorNotes.toLowerCase();
    return n.includes('timeout') || n.includes('500') ||
           n.includes('connection') || n.includes('readtimeout');
  }

  isNonRecoverableError(errorNotes: string): boolean {
    if (!errorNotes) return false;
    const n = errorNotes.toLowerCase();
    return n.includes('no sld pages found') || n.includes('jsondecodeerror') ||
           n.includes('invalid json') || n.includes('no bill pages found');
  }

  getElapsedMin(job: MyJob): number {
    return Math.round((Date.now() - job.submitted_at) / 60000);
  }

  private _save(projectId: number, jobs: MyJob[]) {
    // Strip runtime-only fields before saving
    const toSave = jobs.map(({ _status, _errorMsg, _errorNotes, _showError, ...rest }) => rest);
    localStorage.setItem(this.PREFIX + projectId, JSON.stringify(toSave));
  }
}
