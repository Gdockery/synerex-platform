import { Injectable }              from '@angular/core';



import {BaseApiCrudService} from "../../api/baseApiCrud.service";

@Injectable()
export class SwitchAlertService extends BaseApiCrudService {

  protected baseUrl:string = '/api/switch/alert/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  transformUpdatedModel(model) {
    model.deviceCount = model.devices.length;
    return model;
  }
}
