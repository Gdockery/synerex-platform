import { Injectable }              from '@angular/core';



import {BaseApiCrudService} from "../../../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class SwitchAlertEventService extends BaseApiCrudService {

  protected baseUrl:string = '/api/switch/alert/events';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;


  constructor(injector: Injector) {
    super(injector);
  }
}
