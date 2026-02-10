import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {ApiRequestService} from "../api/api-request.service";
import {CurrentUserService} from "../shared/user/currentUser.service";

let moment = require('moment');

@Injectable()
export class EnergySavingsService {

  constructor(private apiRequestService: ApiRequestService, private userService: CurrentUserService) {}

  getSavingsReports(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/savings-report/', this.apiRequestService.createRequestParams(inputParams));
  }

  getBillURL(month) {
    return '/api/project/' + this.userService.user.selectedProject.id + '/savings-report/' + month + '/bill';
  }

  removeBill(month) {
    return this.apiRequestService.delete(this.getBillURL(month));
  } 

  getEnergySavingsBreakdown(meterIds, showI2RLoss?): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/current-savings', this.apiRequestService.createRequestParams(showI2RLoss? {meters: meterIds, showI2RLoss: showI2RLoss} : {meters: meterIds}));
  }

  getEquipmentSavings(projectId): Observable<any> {
    return this.apiRequestService.get('/api/project/all-equipment-savings', this.apiRequestService.createRequestParams({project: projectId}));
  }

  getEnergySavingsLineChart(meterIds): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/line-chart-data', this.apiRequestService.createRequestParams({meters: meterIds}));
  }

  getEnergySavingsMeterDataDetail(meterIds): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/meterdata-detail', this.apiRequestService.createRequestParams({meters: meterIds}));
  }

  calculateSavings(): Observable<any> {
    return this.apiRequestService.put('/api/project/calculate-savings');
  }

  calculateProjectSavings(): Observable<any> {
    return this.apiRequestService.put('/api/project/calculate-project-savings');
  }

  runDailyScript(): Observable<any> {
    return this.apiRequestService.put('/api/rollup/run-daily-script');
  }
  runRollup(): Observable<any> {
    return this.apiRequestService.put('/api/rollup/run-15min-rollup');
  }
  runGenerateReport(): Observable<any> {
    return this.apiRequestService.put('/api/rollup/generate-automatic-monthly-reports');
  }
}