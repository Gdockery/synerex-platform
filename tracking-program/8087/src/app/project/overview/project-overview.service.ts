
import {map} from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {DeviceService} from "../../electricityMeters/devices/device.service";
import {Observable} from "rxjs";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {ApiRequestService} from "../../api/api-request.service";


@Injectable()
export class ProjectOverviewService {
 
  constructor(private deviceService: DeviceService, private userService: CurrentUserService, private apiRequestService: ApiRequestService) {}

  getOverviewData(fromDate, toDate): Observable<any> {
    return this.deviceService.getConsolidatedDeviceData(fromDate, toDate).pipe(map(data => {
      return {
        kwPeak: [Math.floor(data.response.kvaPeak), Math.floor(data.response.kvaPeak * (1 + this.userService.user.selectedProject.savings.kwp))],
        kilowattHours: [Math.floor(data.response.kwh), Math.floor(data.response.kwh * (1 + this.userService.user.selectedProject.savings.kwh))],
        carbonEmission: [Math.floor(data.response.carbonEmission), Math.floor(data.response.carbonEmission * (1 + this.userService.user.selectedProject.savings.kwh))],
        pf: [data.response.afterPf * (1 - data.response.pfSavingsPercent), data.response.afterPf],
        kvar: [data.response.avgKvar * (1 + data.response.kvarSavingsPercent), data.response.avgKvar],
      }
    }));
  }


  getPowerQualityChart(params): Observable<any> {
    return this.apiRequestService.get('/api/meter/quality-chart', this.apiRequestService.createRequestParams(params));
  }

  getPowerQualityData(params): Observable<any> {
    return this.apiRequestService.get('/api/meter/quality', this.apiRequestService.createRequestParams(params));
  }

  getHarmonicsData(params): Observable<any> {
    return this.apiRequestService.get('/api/meter/harmonics', this.apiRequestService.createRequestParams(params));
  }

}
