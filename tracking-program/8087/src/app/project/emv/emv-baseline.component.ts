import { Component, Inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { APP_CONFIG, IAppConfig } from '../../config/app.config';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import { EmvService } from './emv.service';

/**
 * EM&V Baseline - shows EM&V analyses for the current project.
 * Analytics appear here when User, org_id and project_id match.
 */
@Component({
  selector: 'sd-emv-baseline',
  templateUrl: './emv-baseline.component.html',
  styleUrls: ['./emv-baseline.component.scss']
})
export class EmvBaselineComponent implements OnInit {

  public emvAnalyses: any[] = [];
  public emvActiveId: number | null = null;
  public emvLoading = false;
  public emvSettingActive = false;

  constructor(
    public currentUserService: CurrentUserService,
    private emvService: EmvService,
    private sanitizer: DomSanitizer,
    @Inject(APP_CONFIG) private appConfig: IAppConfig,
  ) {}

  ngOnInit() {
    this.loadEmvAnalyses();
  }

  /** EMV URL with Tracking project context (orgId, projectId, clientId) so EMV can pre-select the project. */
  get emvLegacyUrl(): string {
    const base = (this.appConfig.locals && this.appConfig.locals.emvUrl) || 'http://localhost:8082';
    const path = (base.replace(/\/+$/, '')) + '/legacy';
    const proj = this.currentUserService.user?.selectedProject as any;
    if (!proj || !proj.id) return path;
    const params = new URLSearchParams();
    if (proj.orgId) params.set('orgId', String(proj.orgId));
    params.set('projectId', String(proj.id));
    if (proj.client != null) params.set('clientId', String(proj.client));
    return params.toString() ? path + '?' + params.toString() : path;
  }

  loadEmvAnalyses() {
    this.emvLoading = true;
    this.emvService.getAnalyses().subscribe(
      (res: any) => {
        this.emvAnalyses = res.response?.analyses || [];
        this.emvActiveId = res.response?.activeId ?? null;
        this.emvLoading = false;
      },
      () => { this.emvLoading = false; }
    );
  }

  onEmvAnalysisChange(analysisId: number) {
    if (!analysisId || this.emvSettingActive) return;
    this.emvSettingActive = true;
    this.emvService.setActiveAnalysis(analysisId).subscribe(
      () => {
        this.emvActiveId = analysisId;
        this.emvSettingActive = false;
        this.currentUserService.user.selectedProject.activeEmvAnalysisId = analysisId;
      },
      () => { this.emvSettingActive = false; }
    );
  }

  getEmvReportUrl(analysisId?: number): string {
    return this.emvService.getReportUrl(analysisId);
  }

  /** Safe URL for iframe src - uses same origin so no CORS. */
  getEmvReportSafeUrl(analysisId?: number): SafeResourceUrl {
    const url = this.emvService.getReportUrl(analysisId);
    return this.sanitizer.bypassSecurityTrustResourceUrl(url || 'about:blank');
  }
}
