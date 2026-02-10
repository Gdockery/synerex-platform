import {Injectable}              from '@angular/core';
import {Observable, BehaviorSubject} from "rxjs";
import {CurrentUserService} from "../shared/user/currentUser.service";
import {ApiRequestService} from "./api-request.service";
import {ApiHelpers} from "../shared/helpers/apiHelpers.service";

@Injectable()
export class BaseApiCrudService {
  protected baseUrl:string = '/api';
  protected modelObserver;
  //Flag determines whether the current user's selected project ID should be included in requests.
  protected shouldIncludeProjectId:boolean = false;

  public models = [];

  constructor (protected userService: CurrentUserService, protected apiRequestService: ApiRequestService, protected apiHelpers: ApiHelpers) {
    this.modelObserver = new BehaviorSubject([]);
  }

  public getModelObserver() {
    return this.modelObserver;
  }

  public releaseModelObserver() {
    this.modelObserver.complete();
  }

  get(id) {
    return this.apiRequestService.get(this.baseUrl + id);
  }

  getPaginated(inputParams:any = {}): Observable<any> {
    return this.getAll(this.apiHelpers.parsePaginationParams(inputParams));
  }

  getAll(inputParams:any = {}): Observable<any> {
    if(this.shouldIncludeProjectId && !inputParams.project) {
      inputParams.project = this.userService.user.selectedProject.id;
    }
    return this.apiRequestService.get(this.baseUrl, this.apiRequestService.createRequestParams(inputParams));
  }

  loadModels(inputParams:any = {}): Observable<any> {
    let response = this.getAll(inputParams).subscribe(data => {
      this.modelObserver.next(data.response);
      this.models = data.response;
    }, error => {});
    return this.getModelObserver();
  }

  transformUpdatedModel(model) {
    return model;
  }

  protected updateArray(id, response): Array<any> {
    let newModels = JSON.parse(JSON.stringify(this.models));
    let index = this.models.findIndex(model => {
      return model.id == id;
    });
    response.id = id;
    newModels[index] = this.transformUpdatedModel(response);
    return newModels;
  }

  update(id, params): Observable<any> {
    let response = this.apiRequestService.put(this.baseUrl + id, params);
    response.subscribe(data => {
      if(data.id) {
        this.models = this.updateArray(id, data.response);
        this.modelObserver.next(this.models);
      }
    }, error => {});
    return response;
  }

  create(params): Observable<any> {
    if(this.shouldIncludeProjectId) {
      if(params.valuesToSet) {
        params.valuesToSet.project = this.userService.user.selectedProject.id;
      } else {
        params.project = this.userService.user.selectedProject.id;
      }
    }
    let response = this.apiRequestService.post(this.baseUrl, params);
    response.subscribe(data => {
      let newModels = JSON.parse(JSON.stringify(this.models));
      newModels.push(data.response);
      this.models = newModels;
      this.modelObserver.next(this.models);
    }, error => {});
    return response;
  }

  protected removeFromArray(id) {
    return this.models.filter(model => {
      //TODO: this is not a proper fix, we shouldn't have undefined models in the modelService collection
      if (typeof model != 'undefined') {
        return model.id != id;
      } else {
        return true;
      }
    });
  }

  remove(id): Observable<any> {
    let response = this.apiRequestService.delete(this.baseUrl + id);
    response.subscribe(data => {
      this.models = this.removeFromArray(id);
      this.modelObserver.next(this.models);
    }, error => {});
    return response;
  }
}
