import { Injectable }              from '@angular/core';


import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {BehaviorSubject, Observable} from "rxjs";

@Injectable()
export class DeviceService extends BaseApiCrudService {

  protected baseUrl:string = '/api/meter/';
  public models = [];
  protected shouldIncludeProjectId = true;

  meterDataExport(inputParams) {
    inputParams.project = this.userService.user.selectedProject.id;
    return this.apiRequestService.get('/api/meter/data/export', this.apiRequestService.createRequestParams(inputParams))
  }

  meterListData(inputParams) {
    inputParams.project = this.userService.user.selectedProject.id;
    return this.apiRequestService.get(this.baseUrl, this.apiRequestService.createRequestParams(inputParams))
  }

  getDevicesWithData(inputParams) {
    return this.apiRequestService.get(this.baseUrl + 'data', this.apiRequestService.createRequestParams(inputParams))
  }

  getDailyDeviceData(inputParams) {
    inputParams.project = this.userService.user.selectedProject.id;
    return this.apiRequestService.get(this.baseUrl + 'daily', this.apiRequestService.createRequestParams(inputParams))
  }

  getConsolidatedDeviceData(fromDate, toDate) {
    return this.apiRequestService.get('/api/meter/period', this.apiRequestService.createRequestParams({fromDate: fromDate, toDate: toDate, project: this.userService.user.selectedProject.id}))
  }
}
