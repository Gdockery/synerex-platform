import { Injectable }              from '@angular/core';



import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {Observable} from "rxjs";

@Injectable()
export class RepeaterAlertService extends BaseApiCrudService {

  protected baseUrl:string = '/api/repeater/alert/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  transformUpdatedModel(model) {
    model.deviceCount = model.devices.length;
    return model;
  }
}
