import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../../api/baseApiCrud.service";

@Injectable()
export class ClientService extends BaseApiCrudService {

  protected baseUrl:string = '/api/client/';
  public models = [];
  protected shouldIncludeProjectId = false;

}
