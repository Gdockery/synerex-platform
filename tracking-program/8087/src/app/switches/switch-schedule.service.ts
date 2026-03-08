import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Observable} from "rxjs";
import {Injector} from '@angular/core';

@Injectable()
export class SwitchScheduleService extends BaseApiCrudService {

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

  listSchedules(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/switch/list-schedules', this.apiRequestService.createRequestParams(inputParams));
  }
  
  updateSchedule(inputParams:any = {}): Observable<any> {
    let response = this.apiRequestService.put('/api/switch/equipment/update-schedule', inputParams);
    response.subscribe(response => {
      
    });
    return response;
  }

  deleteSchedule(switchId): Observable<any> {
    let response = this.apiRequestService.put('/api/switch/delete-schedule', {id: switchId});
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
