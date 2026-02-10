import { Injectable }              from '@angular/core';
import {Observable} from "rxjs";
import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {WindowRef} from "../../shared/windowRef.component";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {ApiRequestService} from "../../api/api-request.service";
import {ApiHelpers} from "../../shared/helpers/apiHelpers.service";

@Injectable()
export class CsvDataService extends BaseApiCrudService {

  protected baseUrl:string = '/api/meter/csv/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  constructor(protected userService: CurrentUserService, protected apiRequestService: ApiRequestService, protected apiHelpers: ApiHelpers, private window: WindowRef) {
    super(userService, apiRequestService, apiHelpers);
  }

  public getDownloadLink(id) {
    return this.apiRequestService.get(this.baseUrl  + id + '/download/');
  }

  public createReport(id, data) {
    return this.apiRequestService.post(this.baseUrl  + id + '/create/', data);
  }

  downloadFile(csv) {
    this.getDownloadLink(csv.id).subscribe(data => {
      this.window.getNativeWindow().location.href = data.response;
    });
  }
  public listReports(project) {
    return this.apiRequestService.get(this.baseUrl + project + '/list');
  }
}
