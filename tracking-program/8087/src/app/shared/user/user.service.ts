
import {map} from 'rxjs/operators';
import {Injectable} from '@angular/core';
import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {Injector} from '@angular/core';

@Injectable()
export class UserService extends BaseApiCrudService {
  protected baseUrl:string = '/api/user/';
  protected shouldIncludeProjectId = false;

  getProjectUsers(projectId = 1) {
    return this.apiRequestService.get(
      this.baseUrl,
      this.apiRequestService.createRequestParams({project:projectId})
    );
  }

  getXecoManagers() {
    return this.getAll().pipe(map(userData => {
      return {response: userData.response.filter(user => {
        return (user.role === 4 || user.role === 8);
      })};
    }));
  }

  constructor(injector: Injector) {
    super(injector);
  }
}
