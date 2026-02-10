import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../../api/baseApiCrud.service";

@Injectable()
export class RepeaterService extends BaseApiCrudService {

  protected baseUrl:string = '/api/repeater/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;
}
