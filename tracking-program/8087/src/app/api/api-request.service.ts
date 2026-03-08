
import {throwError as observableThrowError, Observable, of} from 'rxjs';

import {refCount, publish, catchError, map, share} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {HttpClient, HttpParams, HttpErrorResponse} from '@angular/common/http';
import {CurrentUserService} from "../shared/user/currentUser.service";
import {NgProgress} from "ngx-progressbar";

@Injectable()
export class ApiRequestService {

  private additionalParams = {};

  constructor (protected http: HttpClient, protected userService: CurrentUserService, public pService: NgProgress) {}

  setAdditionalParams(params) {
    this.additionalParams = params;
  }

  public get(url, params = {}): Observable<any> {
    return this.handleRequest(this.http.get(url, params));
  }

  public put(url, body = null, params = {}): Observable<any> {
    return this.handleRequest(this.http.put(url, body, params));
  }

  public post(url, body = null, params = {}): Observable<any> {
    return this.handleRequest(this.http.post(url, body, params));
  }

  public delete(url, params = {}): Observable<any> {
    return this.handleRequest(this.http.delete(url, params));
  }

  public postFormData(url, formData: FormData): Observable<any> {
    return this.handleRequest(this.http.post(url, formData));
  }

  protected handleRequest(request: Observable<any>) {
    this.pService.ref("progressIndicator").start();
    let response = request.pipe(
      share(),
      catchError(error => this.handleError(error)),
      publish(),
      refCount(),);
    response.subscribe(data => {
      this.pService.ref("progressIndicator").complete()
    }, (error)=>{});
    return response;
  }

  protected handleError(resp: HttpErrorResponse) {
    if(resp.status == 200
        && resp.error
        && resp.error.error
        && resp.error.error.name === 'SyntaxError'
        ) {
      return of(resp.error.text)
    } // ignoring JSON parsing errors

    this.pService.ref("progressIndicator").complete();
    
    if(resp.status == 403) {
      this.userService.logout(true)
    }
    
    if(resp.status == 500 || resp.status == 0) {
      alert('Error occurred when making request.');
      return observableThrowError({message: 'Error has occurred', code: resp.status});
    }
    return observableThrowError({message: 'Error has occurred', code: resp.status, error: resp});
  }

  public createRequestParams(inputParams = {}) {
    inputParams = JSON.parse(JSON.stringify(inputParams))
    for(let key in inputParams) {
      if(Array.isArray(inputParams[key])) {
        inputParams[key] = inputParams[key].join(',')
      }
    }
    return {
      params: new HttpParams({fromObject: inputParams})
    }
  }
}
