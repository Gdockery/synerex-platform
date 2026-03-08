
import {timer as observableTimer, Observable} from 'rxjs';
import {Component, OnDestroy, OnInit,ViewChild, EventEmitter, Inject, Input, Output} from '@angular/core';
import {EnergySavingsService} from "./energySavings.service";
import {ActivatedRoute, Router} from '@angular/router';
import {CurrentUserService} from "../shared/user/currentUser.service";
import { FormsModule } from '@angular/forms';
import {DeviceService} from "../electricityMeters/devices/device.service";
import {ApiRequestService} from "../api/api-request.service";

let _ = require('lodash');

@Component({
  selector: 'energy-savings',
  templateUrl: './energy-savings.component.html'
})
export class EnergySavingsComponent implements OnInit, OnDestroy  {

private client;
public selectedClientId;
public logoPath;

  @ViewChild('savingsChart', {static: false}) savingsChart;
  @ViewChild('ampGauge', {static: false}) ampGauge;
  @ViewChild('pfGauge', {static: false}) pfGauge;

  @Output() submitEvent = new EventEmitter<any>();

  public projects:any;
  private breakdown;
  private peaksData;
  private chartData;
  private hasChartData;
  private meterDetail;
  public selectedTest;
  private project;
  private timer;
  private subscription;
  private chartTimer;
  private chartSubscription;
  private hasPfc = false;
  private loaded = false;
  private hasDetail = false;
  private meters = [];
  private selectMeterError = false;
  private allSelected = false;
  private equipmentSavings;
  private afterPf;
  private beforePf;
  private addEquipment = true;
  private pfModalShow = false;
  private sdNavShow = false;
  private addI2RLoss;
  time = new Date();

  constructor(private energySavingsService: EnergySavingsService, private userService: CurrentUserService, private route: ActivatedRoute, private router: Router, private deviceService: DeviceService, private apiService: ApiRequestService) {
    this.selectedClientId = route.snapshot.params['id'];
  }

  ngOnInit() {
    const rf = this.userService.user.selectedProject?.reportFields;
    const showI2R = rf && rf.showI2RLoss != null;
    this.addI2RLoss = showI2R ? (typeof rf.showI2RLoss === 'string' ? JSON.parse(rf.showI2RLoss) : !!rf.showI2RLoss) : true;
   
    setInterval(() => {
      this.time = new Date();
    }, 10000); // 10s - was 1s; reduces re-renders

    this.selectedTest = this.userService.user.selectedProject.selectedTest;
    console.log("energySavings.component.ts");
    console.log("DEBUG: slackChannel =", this.userService.user?.selectedProject?.slackChannel);
    console.log("DEBUG: selectedProject =", this.userService.user?.selectedProject);
   
    if (this.selectedTest) {
      //get meters for project
      this.energySavingsService.getEquipmentSavings(this.userService.user.selectedProject.id).subscribe(result => {
        this.equipmentSavings = result.response;
      });
      this.meters = this.userService.user.selectedProject.meters;
      this.timer = observableTimer(5,60000);
      this.chartTimer = observableTimer(5,900000);
      this.getReportingMeters();
      this.projects = this.userService.user.projects;
      this.chartSubscription = this.chartTimer.subscribe(lineChartData => {
        this.updateChart();
      });
      this.subscription = this.timer.subscribe(energySavingsData => {
        this.refreshData();
      });   
    }
    this.logoPath = '/images/client_company_logo/' + this.userService.user.client.id + '-client-logo';
    this.client = {};
    this.fetch();
  }

  fetch() {
    
    this.apiService.get('/api/client/' + this.userService.user.client.id).subscribe(responseData =>{
      this.client = responseData.response;
      
    });
  }

  ngOnDestroy() {
    if (this.selectedTest) {
      this.subscription.unsubscribe();
      this.chartSubscription.unsubscribe();
    }
  }

  updateChart() {
    if (this.getSelected().length == 0) {
     this.selectMeterError = true;
    } else {
      this.energySavingsService.getEnergySavingsLineChart(this.getSelected()).subscribe(result => {
        this.chartData = result.chartData;
        this.hasChartData = this.chartData.kwCurrent;
        this.savingsChart.setData([{data: this.chartData.kwCurrent}, {data: this.chartData.kwBefore}], this.chartData.chartLabel); 
      });
    }
  }

  addEquipmentSavings() {
    if (this.addEquipment) {
      this.equipmentSavings = {
        dailyBeforeKwh: 0,
        dailyAfterKwh: 0,
        dailyKwhSaving: 0,
        dailySaving: 0,
        weeklySaving: 0,
        monthlySaving: 0,
        yearlySaving: 0,
        allTimeSaving: 0,
      };
      this.addEquipment = false;
    } else {
      this.energySavingsService.getEquipmentSavings(this.userService.user.selectedProject.id).subscribe(result => {
        this.equipmentSavings = result.response;
      });
      this.addEquipment = true;
    }
  }

  addI2RLossSavings() {
    if (this.addI2RLoss) {
      this.addI2RLoss = false;
      this.energySavingsService.getEnergySavingsBreakdown(this.getSelected()).subscribe(result => {
        this.breakdown = result.response;
        console.log("DEBUG: breakdown set in addI2RLossSavings (else), slackChannel =", this.userService.user?.selectedProject?.slackChannel);
        console.log("DEBUG: condition result =", this.breakdown && this.userService.user?.selectedProject?.slackChannel > 1);
      });
    } else {
      this.addI2RLoss = true;
      this.energySavingsService.getEnergySavingsBreakdown(this.getSelected(), this.addI2RLoss).subscribe(result => {
        this.breakdown = result.response;
        console.log("DEBUG: breakdown set in addI2RLossSavings, slackChannel =", this.userService.user?.selectedProject?.slackChannel);
        console.log("DEBUG: condition result =", this.breakdown && this.userService.user?.selectedProject?.slackChannel > 1);
      });
    }
  }


  refreshData() {
    if (this.getSelected().length == 0) {
     this.selectMeterError = true;
    } else {
      this.selectMeterError = false;
      this.hasDetail = false;
      this.energySavingsService.getEnergySavingsBreakdown(this.getSelected(), this.addI2RLoss).subscribe(result => {
        this.breakdown = result.response;
        console.log("DEBUG: breakdown set in refreshData, slackChannel =", this.userService.user?.selectedProject?.slackChannel);
        console.log("DEBUG: breakdown exists =", !!this.breakdown);
        console.log("DEBUG: slackChannel > 1 =", (this.userService.user?.selectedProject?.slackChannel || 0) > 1);
        console.log("DEBUG: condition result (breakdown && slackChannel > 1) =", this.breakdown && this.userService.user?.selectedProject?.slackChannel > 1);
        this.pfGauge.setValue(this.breakdown.afterPf, this.breakdown.afterPf); 
        this.hasPfc = result.response.hasPfc;
        this.afterPf = result.response.afterPf;
        this.beforePf = result.response.beforePf;
        this.loaded = true;
      });
      this.energySavingsService.getEnergySavingsMeterDataDetail(this.getSelected()).subscribe(result => {
        this.meterDetail = result.response;
        this.ampGauge.setValue(this.meterDetail.amp, this.meterDetail.ampPercent);
        this.hasDetail = true;
      });  
    }
    
  }

  goToProject(projectId) {
    this.userService.deselectProject();
    // Set the current project
    this.userService.selectProject(projectId);
    // Go to the energy savings dashboard page
    
    this.router.navigate(['/savings/energy-savings']);
   
    window.location.reload();
  }


 selectAllMeters() {
   this.meters.forEach(function(meter) {
     meter.checked = true;
   });
   this.allSelected = true;
  }  
 
 select() {
   if (this.getSelected().length < this.meters.length) {
     this.meters.forEach(function(meter) {
       meter.checked = true;
     });
     this.allSelected = true;
   } else {
     this.meters.forEach(function(meter) {
       meter.checked = false;
     });
     this.allSelected = false;
   }  
  }  

 getSelected() {
   let result = this.meters.filter((meter) => { return meter.checked == true})
                    .map((meter) => { return meter.id});
   return result; 
 }

 goToViewBudget() {
    this.router.navigate(['/savings/budget-savings']);
 }  

 calculateSavings(){
    this.energySavingsService.calculateSavings().subscribe(result => {});  
 }

 calculateProjectSavings(){
    this.energySavingsService.calculateProjectSavings().subscribe(result => {});  
 }

 runDailyScript(){
    this.energySavingsService.runDailyScript().subscribe(result => {});  
 }
 runRollup(){
    this.energySavingsService.runRollup().subscribe(result => {});  
 }
 runGenerateReport(){
    console.log("ran generate report");
    this.energySavingsService.runGenerateReport().subscribe(result => {});  
 }

 changeCheckbox(i) {
    this.meters.forEach(function(meter) {
       meter.checked = false;
    });
    this.allSelected = false;
    this.meters[i].checked = !this.meters[i].checked;
  }

  getReportingMeters() {
    // First, uncheck all meters
    this.meters.forEach(function(meter) {
      meter.checked = false;
    });
    
    // Select all meters with isMain = 1
    var mainMetersFound = false;
    this.meters.forEach(function(meter) {
      if (meter.isMain == 1) {
        meter.checked = true;
        mainMetersFound = true;
      }
    });
    
    // If no main meters found, fall back to isReporting = 1
    if (!mainMetersFound) {
      this.meters.forEach(function(meter) {
        if (meter.isReporting == 1) {
          meter.checked = true;
        }
      });
    }
    
    // Check if all meters are selected
    if (this.getSelected().length == this.meters.length) {
      this.allSelected = true;
    }
  }


}

