import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Observable} from "rxjs";
import {Injector} from '@angular/core';

@Injectable()
export class EquipmentsService extends BaseApiCrudService {

  protected baseUrl:string = '/api/switch/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  sendSwitchCommand(command) {
    command.project = this.userService.user.selectedProject.id;
    return this.apiRequestService.post(this.baseUrl + 'command', command).subscribe(data=>{});
  }

  getSwitchSchedule(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/equipment/get-schedule', this.apiRequestService.createRequestParams(inputParams));
  }

  getUsageData(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/equipment/get-usage', this.apiRequestService.createRequestParams(inputParams));
  }

  getEquipmentSavings(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/get-savings', this.apiRequestService.createRequestParams(inputParams));
  }

  getSchedulers(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/schedulers', this.apiRequestService.createRequestParams(inputParams));
  }

  getSchedulerChart(params): Observable<any> { 
    return this.apiRequestService.get('/api/meter/quality-chart', this.apiRequestService.createRequestParams(params));
  }

  getSchedulerDetail(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/equipment/get-detail', this.apiRequestService.createRequestParams(inputParams));
  }


  constructor(injector: Injector) {
    super(injector);
  }
}
