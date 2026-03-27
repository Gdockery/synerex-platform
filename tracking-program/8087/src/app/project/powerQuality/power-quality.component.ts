import {timer as observableTimer, Observable} from 'rxjs';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CurrentUserService} from '../../shared/user/currentUser.service';
import {ProjectOverviewService} from "../overview/project-overview.service";
import { IMyOptions } from 'mydatepicker';
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {FormBuilder} from "@angular/forms";
import {DateTimeValidators} from "../../shared/validation/dateTime.validators";
import {DeviceService} from "../../electricityMeters/devices/device.service";

const HARMONIC_ORDERS = ['H3','H5','H7','H9','H11','H13','H15','H17','H19','H21'];

@Component({
  selector: 'power-quality',
  templateUrl: './power-quality.component.html'
})
export class PowerQualityComponent implements OnInit, OnDestroy {

  @ViewChild('chart', {static: false}) chart;
  @ViewChild('spectrumChart', {static: false}) spectrumChart;
  @ViewChild('waveformChart', {static: false}) waveformChart;
  @ViewChild('trendChart', {static: false}) trendChart;

  public realTimeData: any = null;
  public harmonicsData: any = null;

  public loaded = false;
  public harmonicsLoaded = false;

  private dateForm;

  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  public dateFrom: any;
  public dateTo: any;
  public type = 'kw';
  public period;
  public meters;
  public selectedMeter;
  private timer;
  private subscription;

  // Harmonics controls
  public harmonicOrders = HARMONIC_ORDERS;
  public selectedHarmonicPhase = 'l1';
  public selectedHarmonicType: 'amp' | 'volt' = 'amp';
  public selectedHarmonicOrder = 'H5';
  public iscIlRatio = 20;
  public harmonicTrendType = 'ampH5';

  constructor(
    protected userService: CurrentUserService,
    private timeHelpers: TimeHelpers,
    private formBuilder: FormBuilder,
    private projectOverviewService: ProjectOverviewService,
    private deviceService: DeviceService
  ) {}

  ngOnInit() {
    this.meters = this.userService.user.selectedProject.meters || [];
    this.dateForm = this.formBuilder.group({
      dateFrom: [this.timeHelpers.getDatepickerDictionary(this.timeHelpers.momentForUserTzUnadjusted()), [DateTimeValidators.beforeDateField('dateTo')]],
      dateTo:   [this.timeHelpers.getDatepickerDictionary(this.timeHelpers.momentForUserTzUnadjusted()), [DateTimeValidators.afterDateField('dateFrom')]]
    });
    this.selectedMeter = (this.meters.length > 0) ? this.meters[0].id : null;
    if (this.meters.length > 0) {
      this.timer = observableTimer(500, 60000);
      this.subscription = this.timer.subscribe(() => this.updateMeter());
    }
  }

  ngOnDestroy() {
    if (this.subscription) this.subscription.unsubscribe();
  }

  validateParameter() {
    let dateFrom = this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateFrom').value.date);
    let dateTo   = this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date);
    if (dateTo.diff(dateFrom, 'months') > 1) {
      alert('Date range must be less than one month.');
      return false;
    }
    this.period = dateTo.diff(dateFrom, 'days') > 0 ? 'hour' : 'minute';
    return true;
  }

  updateMeter() {
    if (!this.selectedMeter) return;
    this.projectOverviewService.getPowerQualityData({
      project: this.userService.user.selectedProject.id,
      meter:   this.selectedMeter,
    }).subscribe(result => {
      this.loaded = true;
      this.renderData(result.response);
    });
    this.updateChartData();
    this.updateHarmonics();
  }

  updateChartData() {
    if (!this.selectedMeter || !this.chart) return;
    if (this.validateParameter()) {
      this.projectOverviewService.getPowerQualityChart({
        project:  this.userService.user.selectedProject.id,
        fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateFrom').value.date).format('x'),
        toDate:   this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date).format('x'),
        type:     this.type,
        period:   this.period,
        meter:    this.selectedMeter,
      }).subscribe(result => {
        this.chart.setData([
          {data: result.p1Data, label: "Phase1"},
          {data: result.p2Data, label: "Phase2"},
          {data: result.p3Data, label: "Phase3"}
        ], result.timeLabels);
      });
    }
  }

  updateHarmonics() {
    if (!this.selectedMeter) return;
    this.projectOverviewService.getHarmonicsData({
      project:       this.userService.user.selectedProject.id,
      meter:         this.selectedMeter,
      isc_il_ratio:  this.iscIlRatio,
    }).subscribe(result => {
      this.harmonicsData = result.response;
      this.harmonicsLoaded = true;
      setTimeout(() => {
        this.updateSpectrumChart();
        this.updateWaveformChart();
      }, 50);
    });
  }

  updateSpectrumChart() {
    if (!this.spectrumChart || !this.harmonicsData) return;
    const phase = this.selectedHarmonicPhase;
    const type  = this.selectedHarmonicType;
    const limits = this.harmonicsData.ieee519 && this.harmonicsData.ieee519.individualLimits
      ? this.harmonicsData.ieee519.individualLimits : {};

    const liveVals = HARMONIC_ORDERS.map(o => {
      const v = this.harmonicsData[phase] && this.harmonicsData[phase][type]
        ? (this.harmonicsData[phase][type][o] || 0) : 0;
      return v;
    });

    const liveColors = liveVals.map((v, i) => {
      const lim = limits[HARMONIC_ORDERS[i]];
      return (lim && v > lim) ? '#e74c3c' : '#26c49d';
    });

    const datasets: any[] = [{
      data: liveVals,
      label: 'Live',
      backgroundColor: liveColors,
      barThickness: 18,
    }];

    if (this.hasBaseline && this.harmonicsData.baseline.snapshot) {
      const snap = this.harmonicsData.baseline.snapshot;
      const baseVals = HARMONIC_ORDERS.map(o =>
        snap[phase] && snap[phase][type] ? (snap[phase][type][o] || 0) : 0
      );
      datasets.unshift({
        data: baseVals,
        label: 'Baseline (OFF)',
        backgroundColor: 'rgba(150,150,150,0.45)',
        borderColor: '#999',
        borderWidth: 1,
        barThickness: 18,
      });
    }

    const tddLimit = this.harmonicsData.ieee519 ? this.harmonicsData.ieee519.tddLimit : null;
    this.spectrumChart.limitValue = tddLimit;
    this.spectrumChart.setData(datasets, HARMONIC_ORDERS);
  }

  updateWaveformChart() {
    if (!this.waveformChart || !this.harmonicsData || !this.harmonicsData.hasHarmonicData) return;
    const POINTS = 100;
    const angleLabels = Array.from({length: POINTS}, (_, i) => `${Math.round(i / POINTS * 360)}°`);
    const colors = ['#3498db', '#e67e22', '#2ecc71'];
    const phaseLabels = ['L1', 'L2', 'L3'];

    const liveWaves = ['l1','l2','l3'].map(p => this.buildReconstructedWaveform(p, this.harmonicsData));
    const datasets: any[] = phaseLabels.map((label, i) => ({
      data: liveWaves[i],
      label: `${label} Live`,
      borderColor: colors[i],
      borderWidth: 2,
      borderDash: [],
      fill: false,
      pointRadius: 0,
    }));

    if (this.hasBaseline && this.harmonicsData.baseline.snapshot && this.harmonicsData.baseline.snapshot.l1) {
      const baseWaves = ['l1','l2','l3'].map(p => this.buildReconstructedWaveform(p, this.harmonicsData.baseline.snapshot));
      phaseLabels.forEach((label, i) => {
        datasets.push({
          data: baseWaves[i],
          label: `${label} Baseline`,
          borderColor: colors[i],
          borderWidth: 1.5,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        });
      });
    }

    this.waveformChart.setData(datasets, angleLabels);
  }

  updateHarmonicTrend() {
    if (!this.trendChart || !this.selectedMeter) return;
    this.harmonicTrendType = `${this.selectedHarmonicType}${this.selectedHarmonicOrder}`;
    if (!this.validateParameter()) return;
    this.projectOverviewService.getPowerQualityChart({
      project:  this.userService.user.selectedProject.id,
      fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateFrom').value.date).format('x'),
      toDate:   this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date).format('x'),
      type:     this.harmonicTrendType,
      period:   this.period,
      meter:    this.selectedMeter,
    }).subscribe(result => {
      this.trendChart.setData([
        {data: result.p1Data, label: `L1 ${this.selectedHarmonicOrder}`},
        {data: result.p2Data, label: `L2 ${this.selectedHarmonicOrder}`},
        {data: result.p3Data, label: `L3 ${this.selectedHarmonicOrder}`},
      ], result.timeLabels);
    });
  }

  buildReconstructedWaveform(phase: string, harmonicsSource: any): number[] {
    const POINTS = 100;
    const harmonics = harmonicsSource && harmonicsSource[phase] && harmonicsSource[phase].amp
      ? harmonicsSource[phase].amp : {};
    return Array.from({length: POINTS}, (_, i) => {
      const t = (i / POINTS) * 2 * Math.PI;
      let y = Math.sin(t);
      for (const hKey of HARMONIC_ORDERS) {
        const h = parseInt(hKey.replace('H', ''), 10);
        const pct = harmonics[hKey] || 0;
        y += (pct / 100) * Math.sin(h * t);
      }
      return parseFloat(y.toFixed(4));
    });
  }

  getPhasorPoints(voltages: number[], amps: number[], powerFactors: number[]): any[] {
    const cx = 160, cy = 160, vScale = 90, iScale = 70;
    const baseAngles = [0, -120, 120];
    const vFund = Math.max(...voltages) || 240;
    const iFund = Math.max(...amps)    || 100;
    return baseAngles.map((baseAngle, i) => {
      const vMag   = (voltages[i] || 0) / vFund;
      const iMag   = (amps[i]    || 0) / iFund;
      const dpf    = Math.max(-1, Math.min(1, powerFactors[i] || 0));
      const phaseShiftDeg = -(Math.acos(dpf) * 180 / Math.PI);
      const vAngleRad = (baseAngle * Math.PI) / 180;
      const iAngleRad = ((baseAngle + phaseShiftDeg) * Math.PI) / 180;
      return {
        vTip: {
          x: cx + vMag * vScale * Math.cos(vAngleRad),
          y: cy - vMag * vScale * Math.sin(vAngleRad),
        },
        iTip: {
          x: cx + iMag * iScale * Math.cos(iAngleRad),
          y: cy - iMag * iScale * Math.sin(iAngleRad),
        },
        voltLabel: `${Math.round(voltages[i] || 0)}V`,
        ampLabel:  `${Math.round(amps[i] || 0)}A`,
        angleLabel: `${Math.round(Math.abs(phaseShiftDeg))}°`,
      };
    });
  }

  // ---- Baseline computed properties ----

  get hasBaseline(): boolean {
    return !!(this.harmonicsData && this.harmonicsData.baseline && this.harmonicsData.baseline.hasBaseline);
  }

  get hasBaselineComparison(): boolean {
    return this.hasBaseline && !!(this.harmonicsData && this.harmonicsData.hasHarmonicData);
  }

  delta(order: string, phase: string): number {
    const live = this.harmonicsData && this.harmonicsData[phase] && this.harmonicsData[phase].amp
      ? (this.harmonicsData[phase].amp[order] || 0) : 0;
    const snap = this.hasBaseline ? this.harmonicsData.baseline.snapshot : null;
    const base = snap && snap[phase] && snap[phase].amp ? (snap[phase].amp[order] || 0) : 0;
    return parseFloat((live - base).toFixed(3));
  }

  deltaThd(phase: string): number {
    const live = this.realTimeData ? (this.realTimeData[`thd${phase.replace('l','')}`] || 0) : 0;
    const snap = this.hasBaseline ? this.harmonicsData.baseline.snapshot : null;
    const base = snap && snap.thd ? (snap.thd[phase] || 0) : 0;
    return parseFloat((live - base).toFixed(2));
  }

  baselineThd(phase: string): number {
    const snap = this.hasBaseline ? this.harmonicsData.baseline.snapshot : null;
    return snap && snap.thd ? (snap.thd[phase] || 0) : 0;
  }

  liveThd(phase: string): number {
    const idx = phase.replace('l','');
    return this.realTimeData ? (this.realTimeData[`thd${idx}`] || 0) : 0;
  }

  // ---- Compliance banner ----

  get complianceBannerState(): 'compliant' | 'non-compliant' | 'insufficient' {
    if (!this.harmonicsData) return 'insufficient';
    if (!this.harmonicsData.hasHarmonicData) return 'insufficient';
    if (this.harmonicsData.overallCompliant === true)  return 'compliant';
    if (this.harmonicsData.overallCompliant === false) return 'non-compliant';
    return 'insufficient';
  }

  get complianceViolationCount(): number {
    if (!this.harmonicsData || !this.harmonicsData.ieee519) return 0;
    let count = 0;
    for (const phase of ['l1Compliance','l2Compliance','l3Compliance']) {
      const comp = this.harmonicsData.ieee519[phase] || {};
      count += Object.keys(comp).map(k => comp[k]).filter((c: any) => c && c.pass === false).length;
    }
    return count;
  }

  // ---- IEEE 519 helpers ----

  get ieee519TddLimit(): number | null {
    return this.harmonicsData && this.harmonicsData.ieee519
      ? this.harmonicsData.ieee519.tddLimit : null;
  }

  isCompliant(order: string): boolean {
    if (!this.harmonicsData || !this.harmonicsData.ieee519) return true;
    for (const phase of ['l1Compliance','l2Compliance','l3Compliance']) {
      const comp = this.harmonicsData.ieee519[phase] || {};
      if (comp[order] && comp[order].pass === false) return false;
    }
    return true;
  }

  // ---- Phasor data getters ----

  get phasorPoints(): any[] {
    if (!this.realTimeData) return [];
    return this.getPhasorPoints(
      [this.realTimeData.voltage1 || 0, this.realTimeData.voltage2 || 0, this.realTimeData.voltage3 || 0],
      [this.realTimeData.ampLoad1 || 0, this.realTimeData.ampLoad2 || 0, this.realTimeData.ampLoad3 || 0],
      [this.realTimeData.powerFactor1 || 0, this.realTimeData.powerFactor2 || 0, this.realTimeData.powerFactor3 || 0]
    );
  }

  get baselinePhasorPoints(): any[] {
    if (!this.hasBaseline || !this.harmonicsData.baseline.snapshot) return [];
    const snap = this.harmonicsData.baseline.snapshot;
    const pf = snap.pf || {};
    const amp = snap.amp || {};
    const volt = snap.volt || {};
    return this.getPhasorPoints(
      [volt.l1 || 240, volt.l2 || 240, volt.l3 || 240],
      [amp.l1  || 0,   amp.l2  || 0,   amp.l3  || 0],
      [pf.l1   || 0,   pf.l2   || 0,   pf.l3   || 0]
    );
  }

  // ---- Safe dynamic key access (Angular 4/5 JIT doesn't support ?.[key] syntax) ----
  // Usage in templates: safeGet(obj, key) instead of obj?.[key]
  safeGet(obj: any, key: string): any {
    return obj && obj[key] !== undefined ? obj[key] : null;
  }

  // ---- CSV Export ----

  exportComplianceCsv() {
    if (!this.harmonicsData) return;
    const rows: string[][] = [
      ['Harmonic Order','L1 Amp %','L2 Amp %','L3 Amp %','IEEE 519 Limit %','L1 Status','L2 Status','L3 Status']
    ];
    const comp = this.harmonicsData.ieee519 || {};
    for (const order of HARMONIC_ORDERS) {
      const l1c = comp.l1Compliance && comp.l1Compliance[order];
      const l2c = comp.l2Compliance && comp.l2Compliance[order];
      const l3c = comp.l3Compliance && comp.l3Compliance[order];
      rows.push([
        order,
        l1c ? l1c.measured.toFixed(3) : 'N/A',
        l2c ? l2c.measured.toFixed(3) : 'N/A',
        l3c ? l3c.measured.toFixed(3) : 'N/A',
        l1c && l1c.limit !== null ? l1c.limit.toString() : 'N/A',
        l1c ? (l1c.pass ? 'PASS' : 'FAIL') : 'N/A',
        l2c ? (l2c.pass ? 'PASS' : 'FAIL') : 'N/A',
        l3c ? (l3c.pass ? 'PASS' : 'FAIL') : 'N/A',
      ]);
    }
    rows.push(['','','','','','','','']);
    rows.push(['K-Factor L1', this.harmonicsData.kFactor ? this.harmonicsData.kFactor.l1 : '','','','','','','']);
    rows.push(['K-Factor L2', this.harmonicsData.kFactor ? this.harmonicsData.kFactor.l2 : '','','','','','','']);
    rows.push(['K-Factor L3', this.harmonicsData.kFactor ? this.harmonicsData.kFactor.l3 : '','','','','','','']);
    rows.push(['Est Neutral Current (A)', this.harmonicsData.neutralCurrentEst || '','','','','','','']);
    rows.push(['ISC/IL Ratio', String(this.iscIlRatio),'','','','','','']);
    rows.push(['TDD Limit %', comp.tddLimit || '','','','','','','']);
    rows.push(['Timestamp', this.harmonicsData.timestamp || '','','','','','','']);
    if (this.harmonicsData.baseline && this.harmonicsData.baseline.hasBaseline) {
      rows.push(['Baseline Analysis Date', this.harmonicsData.baseline.analysisDate || '','','','','','','']);
      rows.push(['Baseline OFF Period', `${this.harmonicsData.baseline.offPeriodStart} – ${this.harmonicsData.baseline.offPeriodEnd}`,'','','','','','']);
    }

    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `ieee519_harmonics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  renderData(latestPowerQualityData) {
    if (!latestPowerQualityData) {
      throw new Error('Consistency violation: `renderData()` should always be called with a first argument.');
    }
    this.realTimeData = latestPowerQualityData;
  }
}
