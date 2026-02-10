import {Component, OnInit, ViewChild} from '@angular/core';
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {ProjectOverviewService} from "./project-overview.service";
import {EnergySavingsService} from  "../../savings/energySavings.service";
import {BillAnalyticCalculationsService} from "../../billing/billAnalytic/billAnalytic-calculation.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";

@Component({
  selector: 'project-overview',
  styleUrls: ['project-overview.component.scss'],
  templateUrl: 'project-overview.component.html'
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
  public breakdown;


  constructor(
    private projectOverviewService: ProjectOverviewService,
    private energySavingsService: EnergySavingsService,
    private currentUserService: CurrentUserService,
    private billAnalyticCalculationService: BillAnalyticCalculationsService,
    private timeHelpers: TimeHelpers,
    private deviceService: DeviceService,
  ) {}

  ngOnInit() {
    this.project = this.currentUserService.user.selectedProject;
    if(this.project.electricBillAnalysis && this.project.equipmentInfo) {
      this.validBillAnalytic = true;
    }

    //get meters for project
    this.meters = this.currentUserService.user.selectedProject.meters;
    
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
    
  }

  dateChanged(date) {
    this.date = date;
    this.updateData();
  }

  getMeters() {
    let result = this.meters.map((meter) => { return meter.id});
    return result;
  }

  updateData() {
    if(this.date.diff(this.timeHelpers.momentForUserTzUnadjusted().endOf('month')) > 0) {
      alert('Selected date must not be in the future');
    } else {
      let results = this.projectOverviewService.getOverviewData(
        this.date.startOf('month').valueOf(),
        this.date.endOf('month').valueOf(),
      ).subscribe(data => {
        this.loaded = true;
        if(data.pf[0]) {
          this.noData = false;
          this.kilowattPeakChart.setData([
            {data: data.kwPeak, backgroundColor: ['#26c49d', '#9ca5d7']},
          ]);
          this.kilowattHoursChart.setData([
            {data: data.kilowattHours, backgroundColor: ['#26c49d', '#9ca5d7']},
          ]);
          this.carbonEmissionChart.setData([
            {data: data.carbonEmission, backgroundColor: ['#26c49d', '#9ca5d7']},
          ]);
          this.pfBefore = this.savingsData.beforePf;
          this.pfAfter = this.savingsData.afterPf;

          this.kvarBefore = data.kvar[0];
          this.kvarAfter = data.kvar[1];
        } else {
          this.noData = true;
        }
      });
    }
  }
}
