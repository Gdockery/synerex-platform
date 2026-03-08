import { Injectable }              from '@angular/core';



import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Observable} from "rxjs";
import {Injector} from '@angular/core';

@Injectable()
export class EquipmentScheduleService extends BaseApiCrudService {

  protected baseUrl:string = '/api/switch/schedule/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  transformUpdatedModel(model) {
    model.deviceCount = model.devices.length;
    return model;
  }

  getSchedule(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/equipment/get-schedule', this.apiRequestService.createRequestParams(inputParams));
  }

  getUsageData(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/equipment/get-usage', this.apiRequestService.createRequestParams(inputParams));
  }
  
  updateSchedule(inputParams:any = {}): Observable<any> {
    let response = this.apiRequestService.put('/api/switch/equipment/update-schedule', inputParams);
    response.subscribe(response => {
      
    });
    return response;
  }

  deleteSchedule(scheduleId): Observable<any> {
    let response = this.apiRequestService.put('/api/switch/equipment/delete-schedule', {id: scheduleId});
    response.subscribe(response => {
      
    });
    return response;
  }

  testSchedules(): Observable<any> {
    return this.apiRequestService.post('/api/switch/equipment/test-schedules');
  }
  

  constructor(injector: Injector) {
    super(injector);
  }
}
