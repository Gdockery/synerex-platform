import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Observable} from "rxjs";
import {Injector} from '@angular/core';

@Injectable()
export class SwitchesService extends BaseApiCrudService {

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


  constructor(injector: Injector) {
    super(injector);
  }
}
