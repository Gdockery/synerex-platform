import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Phase 3 — Device Registry Service.
 * Wraps /api/device-registry/* endpoints.
 */
@Injectable()
export class DeviceRegistryService {

  private http: HttpClient;

  constructor(injector: Injector) {
    this.http = injector.get(HttpClient);
  }

  private get headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  /** GET /api/device-registry/?project=<id> */
  list(projectId: number): Observable<any> {
    return this.http.get(`/api/device-registry/?project=${projectId}`, { headers: this.headers });
  }

  /** GET /api/device-registry/<id> */
  get(id: number): Observable<any> {
    return this.http.get(`/api/device-registry/${id}`, { headers: this.headers });
  }

  /** POST /api/device-registry/ */
  create(payload: any): Observable<any> {
    return this.http.post('/api/device-registry/', payload, { headers: this.headers });
  }

  /** PUT /api/device-registry/<id> */
  update(id: number, payload: any): Observable<any> {
    return this.http.put(`/api/device-registry/${id}`, payload, { headers: this.headers });
  }

  /** POST /api/device-registry/verify-barcode */
  verifyBarcode(barcodeValue: string): Observable<any> {
    return this.http.post('/api/device-registry/verify-barcode',
      { barcode: barcodeValue }, { headers: this.headers });
  }

  /** POST /api/device-registry/scan-barcode (image-based scan) */
  scanBarcodeImage(formData: FormData): Observable<any> {
    return this.http.post('/api/device-registry/scan-barcode', formData);
  }
}
