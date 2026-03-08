import { Injectable }              from '@angular/core';



import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class SwitchAlertService extends BaseApiCrudService {

  protected baseUrl:string = '/api/switch/alert/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  transformUpdatedModel(model) {
    model.deviceCount = model.devices.length;
    return model;
  }

  constructor(injector: Injector) {
    super(injector);
  }
}
