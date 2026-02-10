import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../../api/baseApiCrud.service";
import {Observable} from "rxjs";

@Injectable()
export class SavingsReportService extends BaseApiCrudService {
	protected baseUrl = '/api/project/' + this.userService.user.selectedProject.id + '/savings-report/';
  	public models = [];
	  protected shouldIncludeProjectId:boolean = true;
	  
 	  getSavingsReports(inputParams:any = {}): Observable<any> {
    	return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/savings-report/', this.apiRequestService.createRequestParams(inputParams));
  	}

  	getBillURL(month) {
    	return '/api/project/' + this.userService.user.selectedProject.id + '/savings-report/' + month + '/bill';
  	}

  	removeBill(month) {
    	return this.apiRequestService.delete(this.getBillURL(month));
  	} 
}
