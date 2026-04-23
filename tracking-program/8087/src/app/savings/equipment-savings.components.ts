
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
export class EquipmentSavingsComponent implements OnInit, OnDestroy  {

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
  private schedulers = [];
  private selectSchedulerError = false;
  private allSelected = false;
  private equipmentSavings;
  time = new Date();

  constructor(private energySavingsService: EnergySavingsService, private userService: CurrentUserService, private route: ActivatedRoute, private router: Router, private deviceService: DeviceService, private apiService: ApiRequestService) {
    this.selectedClientId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.selectedTest = this.userService.user.selectedProject.selectedTest;

    if (this.selectedTest) {
      //get meters for project
      this.energySavingsService.getEquipmentSavings(this.userService.user.selectedProject.id).subscribe(result => {
        this.equipmentSavings = result.response;
      });
      this.schedulers = this.userService.user.selectedProject.meters;
      this.timer = observableTimer(5,60000);
      this.chartTimer = observableTimer(5,900000);
      this.selectAllSchedulers() ;
      this.projects = this.userService.user.projects;
      /*this.chartSubscription = this.chartTimer.subscribe(lineChartData => {
        this.updateChart();
      });*/
      this.subscription = this.timer.subscribe(energySavingsData => {
        this.refreshData();
      });   
    }
    this.logoPath = '/tracking-images/client_company_logo/' + this.userService.user.client.id + '-client-logo';
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

  /*updateChart() {
    if (this.getSelected().length == 0) {
     this.selectMeterError = true;
    } else {
      this.energySavingsService.getEnergySavingsLineChart(this.getSelected()).subscribe(result => {
        this.chartData = result.chartData;
        this.hasChartData = this.chartData.kwCurrent;
        this.savingsChart.setData([{data: this.chartData.kwCurrent}, {data: this.chartData.kwBefore}], this.chartData.chartLabel); 
      });
    }
  }*/

  refreshData() {
    if (this.getSelected().length == 0) {
     this.selectSchedulerError = true;
    } else {
      this.selectSchedulerError = false;
      this.hasDetail = false;
      this.energySavingsService.getEquipmentSavings(this.userService.user.selectedProject.id).subscribe(result => {
        this.breakdown = result.response;
        this.loaded = true;
      }); 
    }
    
  }

  goToScheduler(projectId) {

  }


  selectAllSchedulers() {
   this.schedulers.forEach(function(scheduler) {
     scheduler.checked = true;
   });
   this.allSelected = true;
  }  
 
  select() {
   if (this.getSelected().length < this.schedulers.length) {
     this.schedulers.forEach(function(scheduler) {
       scheduler.checked = true;
     });
     this.allSelected = true;
   } else {
     this.schedulers.forEach(function(scheduler) {
       scheduler.checked = false;
     });
     this.allSelected = false;
   }  
 }  

 getSelected() {
   let result = this.schedulers.filter((scheduler) => { return scheduler.checked == true})
                    .map((scheduler) => { return scheduler.id});
   return result; 
 }



 changeCheckbox(i) {
    this.schedulers.forEach(function(meter) {
       meter.checked = false;
    });
    this.allSelected = false;
    this.schedulers[i].checked = !this.schedulers[i].checked;
  }

}

