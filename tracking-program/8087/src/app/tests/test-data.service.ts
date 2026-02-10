import { Injectable }              from '@angular/core';

import {BaseApiCrudService} from "../api/baseApiCrud.service";

@Injectable()
export class TestDataService extends BaseApiCrudService {

  protected baseUrl:string = '/api/test/';
  public models = [];
  protected shouldIncludeProjectId:boolean = false;

  getForTest(testId, params) {
    return this.apiRequestService.get(this.baseUrl + testId + '/data', this.apiRequestService.createRequestParams(params));
  }

  hideMultiple(testId, dataIds) {
    return this.apiRequestService.delete(this.baseUrl + testId + '/data', this.apiRequestService.createRequestParams({body: {rowIds: dataIds}}));
  }

  showMultiple(testId, dataIds) {
    return this.apiRequestService.put(this.baseUrl + testId + '/data', {rowIds: dataIds});
  }

}
