import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../../../api/baseApiCrud.service";

@Injectable()
export class AlertEventService extends BaseApiCrudService {

  protected shouldIncludeProjectId:boolean = true;
  protected baseUrl:string = '/api/repeater/alert/events/';

}
