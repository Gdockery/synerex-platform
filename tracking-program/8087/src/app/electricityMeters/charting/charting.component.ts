import {Component, Input, OnInit, ViewChild, OnDestroy} from '@angular/core';
import { IMyOptions } from 'mydatepicker';
import {MeterChartService} from "./meter-chart.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {FormBuilder} from "@angular/forms";
import {DateTimeValidators} from "../../shared/validation/dateTime.validators";
import {timer as observableTimer, Observable} from 'rxjs';
import { Injectable } from '@angular/core';
import {CurrentUserService} from '../../shared/user/currentUser.service';
import {ProjectOverviewService} from "../../project/overview/project-overview.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";

@Component({
  selector: 'charting',
  templateUrl: './charting.component.html',
})
export class ChartingComponent implements OnInit, OnDestroy {
  @ViewChild('chart', {static: false}) chart;

  private realTimeData;

  public loaded = false; 

  private dateForm;

  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  public dateFrom:any;
  public dateTo:any;
  public type = 'kw';
  public period;
  public meters;
  public selectedMeter;
  private timer;
  private subscription;


  constructor(protected userService: CurrentUserService, private timeHelpers: TimeHelpers, private formBuilder: FormBuilder, private projectOverviewService: ProjectOverviewService, private deviceService: DeviceService) {}

  ngOnInit() {
    this.meters = this.userService.user.selectedProject.meters || [];
    this.dateForm = this.formBuilder.group({
      dateFrom: [this.timeHelpers.getDatepickerDictionary(this.timeHelpers.momentForUserTzUnadjusted()), [DateTimeValidators.beforeDateField('dateTo')]],
      dateTo: [this.timeHelpers.getDatepickerDictionary(this.timeHelpers.momentForUserTzUnadjusted()), [DateTimeValidators.afterDateField('dateFrom')]]
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
    let dateTo = this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date);

    if(dateTo.diff(dateFrom, 'months') > 1) {
      alert('Date range must be less than one month.');
      return false;
    }

    if(dateTo.diff(dateFrom, 'days') > 0) {
      this.period = 'hour';
    } else {
      this.period = 'minute';
    }
    return true;
  }

  updateMeter() {
    if (!this.selectedMeter) return;
    this.projectOverviewService.getPowerQualityData({
        project: this.userService.user.selectedProject.id,
        meter: this.selectedMeter, 
      }).subscribe(result => {
        this.loaded = true;
        this.renderData(result.response);
    });
    this.updateChartData();
  }

  updateChartData() { 
    if (!this.selectedMeter || !this.chart) return;
    if(this.validateParameter()) {
      this.projectOverviewService.getPowerQualityChart({
        project: this.userService.user.selectedProject.id,
        fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateFrom').value.date).format('x'),
        toDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.dateForm.get('dateTo').value.date).format('x'), 
        type: this.type,
        period: this.period,
        meter: this.selectedMeter, 
      }).subscribe(result => {
          this.chart.setData([
          {data: result.p1Data, label: "Phase1"}, 
          {data: result.p2Data, label: "Phase2"}, 
          {data: result.p3Data, label: "Phase3"}], 
          result.timeLabels);
      });
    }
  };


  /**
   * Render the given data into the UI.
   * @param  {Dictionary} data
   */
  renderData(latestPowerQualityData) {
    if (!latestPowerQualityData) { throw new Error('Consistency violation: `renderData()` should always be called with a first argument: a dictionary.'); }

    this.realTimeData = latestPowerQualityData;
  }

}
