import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiRequestService } from '../../api/api-request.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';

@Injectable()
export class EmvService {

  constructor(
    private apiRequestService: ApiRequestService,
    private userService: CurrentUserService
  ) {}

  getAnalyses(): Observable<any> {
    const projectId = this.userService.user?.selectedProject?.id;
    if (!projectId) {
      throw new Error('No project selected');
    }
    return this.apiRequestService.get(`/api/project/${projectId}/emv-analyses`);
  }

  setActiveAnalysis(analysisId: number): Observable<any> {
    const projectId = this.userService.user?.selectedProject?.id;
    if (!projectId) {
      throw new Error('No project selected');
    }
    return this.apiRequestService.put(`/api/project/${projectId}/emv-analysis/active`, { analysisId });
  }

  getReportUrl(analysisId?: number): string {
    const projectId = this.userService.user?.selectedProject?.id;
    if (!projectId) return '';
    const base = `/api/project/${projectId}/emv-report`;
    return analysisId ? `${base}?analysisId=${analysisId}` : base;
  }
}
