import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class ClientService extends BaseApiCrudService {

  protected baseUrl:string = '/api/client/';
  public models = [];
  protected shouldIncludeProjectId = false;


  constructor(injector: Injector) {
    super(injector);
  }
}
