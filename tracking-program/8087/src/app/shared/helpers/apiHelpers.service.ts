import { Injectable } from '@angular/core';

@Injectable()
export class ApiHelpers {

  parsePaginationParams(params) {
    let requestParams:any = {
      page: (params.first + params.rows) / params.rows,
      pageSize: params.rows,
    };
    if(params.sortField) {
      requestParams.orderBy = params.sortField;
      requestParams.orderDirection = params.sortOrder==1 ? 'ASC' : 'DESC';
    }

    if(params.filters) {
      for(let i in params.filters) {
        requestParams[i] = params.filters[i].value;
      }
    }

    if(params.deviceType) {
      requestParams.deviceType = params.deviceType;
    }

    if(params.client) {
      requestParams.client = params.client;
    }

    if(params.createdBy) {
      requestParams.createdBy = params.createdBy;
    }
    
    return requestParams;
  }
}
