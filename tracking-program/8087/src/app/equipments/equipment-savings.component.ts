import {timer as observableTimer, Observable} from 'rxjs';
import {Component, OnDestroy, OnInit,ViewChild, EventEmitter, Inject, Input, Output} from '@angular/core';
import {EnergySavingsService} from "../savings/energySavings.service";
import {ActivatedRoute, Router} from '@angular/router';
import {CurrentUserService} from "../shared/user/currentUser.service";
import { FormsModule } from '@angular/forms';
import {DeviceService} from "../electricityMeters/devices/device.service";
import {ApiRequestService} from "../api/api-request.service";
import {EquipmentsService} from "./equipments.service";

@Component({
  selector: 'equipment-savings',
  templateUrl: './equipment-savings.component.html'
})

export class EquipmentSavingsComponent implements OnInit, OnDestroy  {

  @ViewChild('voltChart', {static: false}) voltChart;
  @ViewChild('currentChart', {static: false}) currentChart;

  @Output() submitEvent = new EventEmitter<any>();

  private breakdown;
  private project;
  private timer;
  private subscription;
  private chartTimer;
  private chartSubscription;
  private loaded = false;
  private scheduler;
  private type = 'kva';
  private beginSubscription;
  private hasChartData = false;
  private meterReading;

  private switchId;

  constructor(private energySavingsService: EnergySavingsService, private userService: CurrentUserService, private route: ActivatedRoute, private router: Router, private deviceService: DeviceService, private apiService: ApiRequestService, private equipmentService: EquipmentsService) {
    this.switchId = route.snapshot.params['id'];
  }

  ngOnInit() {
    this.timer = observableTimer(5,60000);
    this.chartTimer = observableTimer(5,900000);
    this.updateChartData();
    this.subscription = this.timer.subscribe(energySavingsData => {
      this.updateChartData();
    }); 
  }

  ngOnDestroy() {
    if (this.beginSubscription) {
      this.subscription.unsubscribe();
      this.chartSubscription.unsubscribe();
    }
  }

  updateChartData() {
    this.equipmentService.getSchedulerDetail({
      project: this.userService.user.selectedProject.id,
      type: 'current&voltage',
      meter: this.switchId, 
      equipment: true,
      period: 'hour',
    }).subscribe(result => {
      this.voltChart.setData([{data: result.voltData}], result.timeLabels);
      this.currentChart.setData([{data: result.currentData}], result.timeLabels);
      this.meterReading = result;
    });
  };

  refreshData() {
  }
}

