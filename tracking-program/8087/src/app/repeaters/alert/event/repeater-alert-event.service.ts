import { Injectable }              from '@angular/core';



import {BaseApiCrudService} from "../../../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class RepeaterAlertEventService extends BaseApiCrudService {

  protected baseUrl:string = '/api/repeater/alert/events/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;


  constructor(injector: Injector) {
    super(injector);
  }
}
