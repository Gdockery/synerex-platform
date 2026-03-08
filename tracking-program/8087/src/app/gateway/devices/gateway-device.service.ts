import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class GatewayService extends BaseApiCrudService {

  protected baseUrl:string = '/api/gateway/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  constructor(injector: Injector) {
    super(injector);
  }
}
