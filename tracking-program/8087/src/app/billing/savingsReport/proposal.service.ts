import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiRequestService } from '../../api/api-request.service';

@Injectable()
export class ProposalService {

  constructor(private apiRequestService: ApiRequestService) {}

  fetchFacilityContext(projectId: number): Observable<any> {
    return this.apiRequestService.post(`/tracking/api/project/${projectId}/proposal/facility-context`, {});
  }

  fetchFacilityNarrative(projectId: number, customer: string, address: string): Observable<any> {
    return this.apiRequestService.post(
      `/tracking/api/project/${projectId}/proposal/facility-context`,
      { customer, address }
    );
  }

  autoFill(projectId: number, billId: number | null, sldId: number | null, customer: string, address: string): Observable<any> {
    const body: any = {};
    if (billId)   body.bill_id  = billId;
    if (sldId)    body.sld_id   = sldId;
    if (customer) body.customer = customer;
    if (address)  body.address  = address;
    return this.apiRequestService.post(`/tracking/api/project/${projectId}/proposal/autofill`, body);
  }

  saveProposalData(projectId: number, body: object): Observable<any> {
    return this.apiRequestService.post(`/tracking/api/project/${projectId}/proposal/save`, body);
  }

  getPreview(projectId: number): Observable<any> {
    return this.apiRequestService.get(`/tracking/api/project/${projectId}/proposal/preview`);
  }

  /** Returns the URL to open the PDF (opens in browser tab) */
  getPdfUrl(projectId: number): string {
    return `/tracking/api/project/${projectId}/proposal/pdf?inline=1`;
  }
}
