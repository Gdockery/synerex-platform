import {Injectable} from "@angular/core";
import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {CurrentUserService} from "../shared/user/currentUser.service";
import {Injector} from '@angular/core';

@Injectable()
export class AccountService extends BaseApiCrudService {

  protected baseUrl:string = '/api/account/';

  updateAccount(params) {
    let response = this.apiRequestService.put('/api/account', params);
    response.subscribe(response => {
      this.userService.updateUser(params);
    });
    return response;
  }


  constructor(injector: Injector) {
    super(injector);
  }
}
