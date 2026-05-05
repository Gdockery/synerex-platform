import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiRequestService } from '../../api/api-request.service';

@Injectable()
export class ProposalService {

  constructor(private apiRequestService: ApiRequestService) {}

  fetchFacilityContext(projectId: number): Observable<any> {
    return this.apiRequestService.post(`/api/project/${projectId}/proposal/facility-context`, {});
  }

  saveProposalData(projectId: number, body: object): Observable<any> {
    return this.apiRequestService.post(`/api/project/${projectId}/proposal/save`, body);
  }

  getPreview(projectId: number): Observable<any> {
    return this.apiRequestService.get(`/api/project/${projectId}/proposal/preview`);
  }

  /** Returns the URL to open the PDF (opens in browser tab) */
  getPdfUrl(projectId: number): string {
    return `/api/project/${projectId}/proposal/pdf?inline=1`;
  }
}
