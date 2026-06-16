import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Phase 4 — Deployment Management Service.
 * Wraps /api/deployment/* endpoints.
 */
@Injectable()
export class DeploymentService {

  private http: HttpClient;

  constructor(injector: Injector) {
    this.http = injector.get(HttpClient);
  }

  private get headers() {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  list(projectId?: number): Observable<any> {
    const q = projectId ? `?project_id=${projectId}` : '';
    return this.http.get(`/api/deployment/${q}`, { headers: this.headers });
  }

  get(id: number): Observable<any> {
    return this.http.get(`/api/deployment/${id}`, { headers: this.headers });
  }

  create(payload: any): Observable<any> {
    return this.http.post('/api/deployment/', payload, { headers: this.headers });
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.patch(`/api/deployment/${id}`, payload, { headers: this.headers });
  }

  advanceStatus(id: number, status: string): Observable<any> {
    return this.http.post(`/api/deployment/${id}/status`, { status }, { headers: this.headers });
  }

  /** Upload a photo for a deployment (multipart/form-data) */
  uploadPhoto(id: number, file: File, label: string): Observable<any> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    fd.append('label', label || '');
    return this.http.post(`/api/deployment/${id}/photos`, fd);
  }

  listPhotos(id: number): Observable<any> {
    return this.http.get(`/api/deployment/${id}/photos`, { headers: this.headers });
  }
}
