import { Injectable } from '@angular/core';
import { Observable, Subject, interval } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import { ApiRequestService } from '../../api/api-request.service';

@Injectable()
export class SldService {

  constructor(private apiRequestService: ApiRequestService) {}

  /**
   * POST /api/sld/analyze — submit SLD file + optional bill_peak_kw.
   * Polls GET /api/sld/analyze/<job_id> every 5 s until done or error.
   * onProgress(msg) receives human-readable status strings while polling.
   */
  analyzeSld(file: File, billPeakKw?: number, onProgress?: (msg: string) => void): Observable<any> {
    return new Observable(observer => {
      const formData = new FormData();
      formData.append('file', file, file.name);
      if (billPeakKw != null && !isNaN(billPeakKw)) {
        formData.append('bill_peak_kw', String(billPeakKw));
      }

      this.apiRequestService.post('/api/sld/analyze', formData).subscribe(
        (submitRes: any) => {
          const jobId = submitRes && submitRes.job_id;
          if (!jobId) {
            observer.error({ error: { error: 'No job ID returned from server' } });
            return;
          }

          if (onProgress) onProgress('Analyzing drawing…');

          const stop$ = new Subject<void>();
          let pollCount = 0;
          const maxPolls = 120; // 10 minutes at 5-second intervals

          interval(5000).pipe(
            takeUntil(stop$),
            switchMap(() => this.apiRequestService.get(`/api/sld/analyze/${jobId}`))
          ).subscribe(
            (pollRes: any) => {
              pollCount++;
              if (pollRes.status === 'pending') {
                const elapsed = pollCount * 5;
                if (onProgress) onProgress(`Analyzing drawing… (${elapsed}s)`);
                if (pollCount >= maxPolls) {
                  stop$.next();
                  observer.error({ error: { error: 'Analysis timed out. Please try again.' } });
                }
                return;
              }
              stop$.next();
              observer.next(pollRes);
              observer.complete();
            },
            (err: any) => { stop$.next(); observer.error(err); }
          );
        },
        (err: any) => observer.error(err)
      );
    });
  }

  acceptSld(projectId: number, placements: any[], sldAnalysis: any): Observable<any> {
    return this.apiRequestService.post(`/api/project/${projectId}/sld/accept`, { placements, sldAnalysis });
  }

  dismissSld(projectId: number): Observable<any> {
    return this.apiRequestService.post(`/api/project/${projectId}/sld/dismiss`, {});
  }
}
