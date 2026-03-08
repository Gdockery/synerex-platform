import { Injectable }              from '@angular/core';

import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class TestService extends BaseApiCrudService {

  protected baseUrl:string = '/api/test/';
  public models = [];
  protected shouldIncludeProjectId:boolean = true;

  getTestData(id) {
    return this.apiRequestService.get(this.baseUrl + id + '/report');
  }
  getTestDataOfSelectedMeters(id, meterIds, minutesToAverage?: number, minutesToIgnore?: number) {
    const params: any = {meters: meterIds};
    if (minutesToAverage !== undefined) {
      params.minutesToAverage = minutesToAverage;
    }
    if (minutesToIgnore !== undefined) {
      params.minutesToIgnore = minutesToIgnore;
    }
    return this.apiRequestService.get(this.baseUrl + id + '/selected-report', this.apiRequestService.createRequestParams(params));
  }

  updateReportingMeters(project, meters) {
    return this.apiRequestService.put(this.baseUrl + project + '/reporting-meters', {meters: meters});
  }

  constructor(injector: Injector) {
    super(injector);
  }
}
