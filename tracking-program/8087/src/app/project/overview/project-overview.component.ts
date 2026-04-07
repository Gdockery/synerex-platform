import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {APP_CONFIG, IAppConfig} from "../../config/app.config";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {ProjectOverviewService} from "./project-overview.service";
import {EnergySavingsService} from  "../../savings/energySavings.service";
import {BillAnalyticCalculationsService} from "../../billing/billAnalytic/billAnalytic-calculation.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";
import {EmvService} from "../emv/emv.service";
import {ApiRequestService} from "../../api/api-request.service";

@Component({
  selector: 'project-overview',
  styleUrls: ['./project-overview.component.scss'],
  templateUrl: './project-overview.component.html'
})
export class ProjectOverviewComponent implements OnInit {

  @ViewChild('monthYearPicker', {static: false}) monthYearPicker;
  @ViewChild('kilowattPeakChart', {static: false}) kilowattPeakChart;
  @ViewChild('kilowattHoursChart', {static: false}) kilowattHoursChart;
  @ViewChild('carbonEmissionChart', {static: false}) carbonEmissionChart;

  private date;
  private project;
  private client;

  public pfBefore;
  public pfAfter;

  public kvarBefore;
  public kvarAfter;
  public warning;
  public newROI;
  public amountToBreakEven;
  public amountLabel;
  public greenText;
  public savingsData;
  public loaded = false;
  public noData = true;
  public meters;
  public validBillAnalytic = false;
  public brandName: string = 'Synerex';
  public breakdown;
  public emvAnalyses: any[] = [];
  public emvActiveId: number | null = null;
  public emvLoading = false;
  public emvSettingActive = false;
  public currentUserService: CurrentUserService;

  constructor(
    private projectOverviewService: ProjectOverviewService,
    private energySavingsService: EnergySavingsService,
    currentUserService: CurrentUserService,
    private billAnalyticCalculationService: BillAnalyticCalculationsService,
    private timeHelpers: TimeHelpers,
    private deviceService: DeviceService,
    private emvService: EmvService,
    private apiRequestService: ApiRequestService,
    @Inject(APP_CONFIG) private appConfig: IAppConfig,
  ) {
    this.currentUserService = currentUserService;
  }

  /** EMV URL with Tracking project context (orgId, projectId, clientId) so EMV can pre-select the project. */
  get emvLegacyUrl(): string {
    const base = (this.appConfig.locals && this.appConfig.locals.emvUrl) || '/emv';
    const path = (base.replace(/\/+$/, '')) + '/legacy';
    const proj = this.currentUserService.user?.selectedProject as any;
    if (!proj || !proj.id) return path;
    const params = new URLSearchParams();
    if (proj.orgId) params.set('orgId', String(proj.orgId));
    params.set('projectId', String(proj.id));
    if (proj.client != null) params.set('clientId', String(proj.client));
    return params.toString() ? path + '?' + params.toString() : path;
  }

  ngOnInit() {
    const bootstrap = (typeof window !== 'undefined' && window['BOOTSTRAP_DATA']) || {};
    this.brandName = (bootstrap['oemDisplayName'] || 'Synerex').trim();

    this.project = this.currentUserService.user.selectedProject;
    if(this.project.electricBillAnalysis && this.project.equipmentInfo) {
      this.validBillAnalytic = true;
    }

    //get meters for project
    this.meters = this.currentUserService.user.selectedProject.meters || [];

    // Initialize date so updateData() can run before month-year-picker emits
    this.date = this.timeHelpers.momentForUserTzUnadjusted();

    this.energySavingsService.getEnergySavingsBreakdown(this.getMeters().toString()).subscribe(result => {
        this.savingsData = result.response;
        this.updateData();
        this.amountToBreakEven = result.response.balance;

        if (this.amountToBreakEven > 0){
          this.greenText = false;
          this.amountLabel = "Amount Remaining To Break Even";
        } else {
          this.amountToBreakEven = this.amountToBreakEven * -1;
          this.greenText = true;
          this.amountLabel = "Net Cash Flow Positive";
        } 
        this.newROI = result.response.remainingROI;

    });

    this.loadEmvAnalyses();
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
        const pid = this.currentUserService.user.selectedProject.id;
        this.apiRequestService.get('/api/project/' + pid).subscribe(
          (res: any) => {
            const proj = res.response;
            if (proj) {
              const idx = this.currentUserService.user.projects.findIndex((p: any) => p.id == pid);
              if (idx >= 0) {
                Object.assign(this.currentUserService.user.projects[idx], proj);
              }
              this.currentUserService.selectProject(pid);
            }
          }
        );
        this.energySavingsService.getEnergySavingsBreakdown(this.getMeters().toString()).subscribe(result => {
          this.savingsData = result.response;
          this.updateData();
          this.amountToBreakEven = result.response.balance;
          if (this.amountToBreakEven > 0) {
            this.greenText = false;
            this.amountLabel = "Amount Remaining To Break Even";
          } else {
            this.amountToBreakEven = this.amountToBreakEven * -1;
            this.greenText = true;
            this.amountLabel = "Net Cash Flow Positive";
          }
          this.newROI = result.response.remainingROI;
        });
      },
      () => { this.emvSettingActive = false; }
    );
  }

  getEmvReportUrl(analysisId?: number): string {
    return this.emvService.getReportUrl(analysisId);
  }

  openReport(analysisId?: number): void {
    const url = this.getEmvReportUrl(analysisId);
    if (url) { window.location.href = url; }
  }

  dateChanged(date) {
    this.date = date;
    this.updateData();
  }

  getMeters() {
    if (!this.meters || !this.meters.length) return [];
    return this.meters.map((meter) => meter.id);
  }

  updateData() {
    if (!this.date) {
      this.date = this.timeHelpers.momentForUserTzUnadjusted();
    }
    if (this.date.diff(this.timeHelpers.momentForUserTzUnadjusted().endOf('month')) > 0) {
      alert('Selected date must not be in the future');
    } else {
      this.projectOverviewService.getOverviewData(
        this.date.clone().startOf('month').valueOf(),
        this.date.clone().endOf('month').valueOf(),
      ).subscribe(data => {
        this.loaded = true;
        if (data && data.pf && data.pf[0]) {
          this.noData = false;
          if (this.kilowattPeakChart) {
            this.kilowattPeakChart.setData([{data: data.kwPeak, backgroundColor: ['#26c49d', '#9ca5d7']}]);
          }
          if (this.kilowattHoursChart) {
            this.kilowattHoursChart.setData([{data: data.kilowattHours, backgroundColor: ['#26c49d', '#9ca5d7']}]);
          }
          if (this.carbonEmissionChart) {
            this.carbonEmissionChart.setData([{data: data.carbonEmission, backgroundColor: ['#26c49d', '#9ca5d7']}]);
          }
          if (this.savingsData) {
            this.pfBefore = this.savingsData.beforePf;
            this.pfAfter = this.savingsData.afterPf;
          }
          this.kvarBefore = data.kvar && data.kvar[0];
          this.kvarAfter = data.kvar && data.kvar[1];
        } else {
          this.noData = true;
        }
      });
    }
  }
}
