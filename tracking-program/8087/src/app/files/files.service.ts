import { Injectable }              from '@angular/core';
import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Observable} from "rxjs";
import {Injector} from '@angular/core';

@Injectable()
export class FilesService extends BaseApiCrudService {
  	public models = [];
  	protected shouldIncludeProjectId:boolean = true;

	getFiles(params): Observable<any> {
	  	if (params.project) {
	  		return this.apiRequestService.get('/api/project/list-files/', this.apiRequestService.createRequestParams(params));
	  		
	  	} else {
	  		return this.apiRequestService.get('/api/project/list-files/', this.apiRequestService.createRequestParams(params));
	  	}
  	}

  	remove(params): Observable<any> {
  		return this.apiRequestService.delete('/api/project/delete-file/' + params.fileName + '/' + params.fileId);
  	}


  constructor(injector: Injector) {
    super(injector);
  }
}
