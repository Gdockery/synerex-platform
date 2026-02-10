import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {BaseApiCrudService} from "../../api/baseApiCrud.service";

@Injectable()
export class AdminProjectService extends BaseApiCrudService {

  protected baseUrl:string = '/api/project/';

  getProjectsForClient(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/project', this.apiRequestService.createRequestParams(inputParams));
  }

}
