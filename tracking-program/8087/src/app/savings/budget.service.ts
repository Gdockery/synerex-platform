import { Injectable } from '@angular/core';


import {Observable} from "rxjs";
import {ApiRequestService} from "../api/api-request.service";
import {CurrentUserService} from "../shared/user/currentUser.service";

let moment = require('moment');

@Injectable()
export class BudgetService {

  constructor(private apiRequestService: ApiRequestService, private userService: CurrentUserService) {}

  getBudgetDetail(inputParams:any = {}): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/budget', this.apiRequestService.createRequestParams(inputParams));
  }

  updateBudget(inputParams:any = {}, budgetType): Observable<any> {
    let response = this.apiRequestService.put('/api/project/'+this.userService.user.selectedProject.id+'/update-budget/', {budgetData: inputParams, type: budgetType});
    response.subscribe(response => {
      //this.userService.user.selectedProject.lastBudgetInvoice = inputParams;
    });
    return response;
  }

}
