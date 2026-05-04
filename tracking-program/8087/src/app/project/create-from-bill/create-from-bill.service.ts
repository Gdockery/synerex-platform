import { Injectable } from '@angular/core';
import { Observable, Subject, interval } from 'rxjs';
import { switchMap, takeUntil, filter, take } from 'rxjs/operators';
import { ApiRequestService } from '../../api/api-request.service';

@Injectable()
export class CreateFromBillService {

  constructor(private apiRequestService: ApiRequestService) {}

  /**
   * POST /api/bill/analyze — submit PDF, get job_id back immediately (HTTP 202).
   * Then polls GET /api/bill/analyze/<job_id> every 5 seconds until done or error.
   * Emits { status: 'pending' } updates while running, then final { success, data } or { success: false, error }.
   * onProgress(msg) is called with human-readable status strings while polling.
   */
  analyzeBill(file: File, meters?: string, pageRange?: string, onProgress?: (msg: string) => void): Observable<any> {
    return new Observable(observer => {
      const formData = new FormData();
      formData.append('bill', file, file.name);
      if (meters && meters.trim()) {
        formData.append('meters', meters.trim());
      }
      if (pageRange && pageRange.trim()) {
        formData.append('page_range', pageRange.trim());
      }

      // Step 1 — submit
      this.apiRequestService.post('/api/bill/analyze', formData).subscribe(
        (submitRes: any) => {
          const jobId = submitRes && submitRes.job_id;
          if (!jobId) {
            // Legacy synchronous response (direct data returned) — pass through
            observer.next(submitRes);
            observer.complete();
            return;
          }

          if (onProgress) onProgress('Scanning bill pages...');

          // Step 2 — poll every 5s
          const stop$ = new Subject<void>();
          let pollCount = 0;
          const maxPolls = 120; // 10 minutes max

          interval(5000).pipe(
            takeUntil(stop$),
            switchMap(() => this.apiRequestService.get(`/api/bill/analyze/${jobId}`))
          ).subscribe(
            (pollRes: any) => {
              pollCount++;
              if (pollRes.status === 'pending') {
                const elapsed = pollCount * 5;
                if (onProgress) onProgress(`Scanning bill pages... (${elapsed}s)`);
                if (pollCount >= maxPolls) {
                  stop$.next();
                  observer.error({ error: { error: 'Scan timed out. Please try again.' } });
                }
                return;
              }
              if (pollRes.status && pollRes.status.startsWith('retrying_')) {
                // AI found nothing on the specified page range — widening and retrying.
                // Reset the timeout counter so the full wait budget applies from each retry.
                pollCount = 0;
                const messages: { [key: string]: string } = {
                  retrying_1: 'Scanning nearby pages (attempt 2 of 3)…',
                  retrying_2: 'Scanning nearby pages (attempt 3 of 3)…',
                  retrying_3: 'Final scan attempt…',
                };
                if (onProgress) onProgress(messages[pollRes.status] || 'Re-scanning nearby pages…');
                return;
              }
              // done or error — emit and complete
              stop$.next();
              observer.next(pollRes);
              observer.complete();
            },
            (err: any) => {
              stop$.next();
              observer.error(err);
            }
          );
        },
        (err: any) => observer.error(err)
      );
    });
  }

  /**
   * POST /api/bill/analyze — fire-and-forget submit.
   * Returns { job_id (GPU int), job_type, filename, estimated_minutes } immediately.
   * Caller saves to localStorage; My Jobs section handles polling.
   */
  submitBillAnalysis(file: File, meters?: string, pageRange?: string): Observable<any> {
    const formData = new FormData();
    formData.append('bill', file, file.name);
    if (meters && meters.trim()) formData.append('meters', meters.trim());
    if (pageRange && pageRange.trim()) formData.append('page_range', pageRange.trim());
    return this.apiRequestService.post('/api/bill/analyze', formData);
  }

  /**
   * POST /api/project/create-from-bill - create Client + Project + Bill Analytic.
   */
  createFromBill(payload: {
    client: any;
    project: any;
    electricBillAnalysis: any;
  }): Observable<any> {
    return this.apiRequestService.post('/api/project/create-from-bill', payload);
  }
}
