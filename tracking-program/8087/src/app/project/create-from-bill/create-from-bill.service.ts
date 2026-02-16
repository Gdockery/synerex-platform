import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiRequestService } from '../../api/api-request.service';

@Injectable()
export class CreateFromBillService {

  constructor(private apiRequestService: ApiRequestService) {}

  /**
   * POST /api/bill/analyze - upload PDF and get extracted bill data.
   */
  analyzeBill(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('bill', file, file.name);
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
