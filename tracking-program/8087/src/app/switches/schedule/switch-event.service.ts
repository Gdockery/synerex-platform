
import {Injector} from '@angular/core';import { Injectable } from '@angular/core'
import { BaseApiCrudService } from "../../api/baseApiCrud.service"
import { Observable } from 'rxjs'

@Injectable()
export class SwitchEventService extends BaseApiCrudService {

  protected baseUrl: string = '/api/switch/event/'
  protected allEventsUrl: string = '/api/switch/events'
  public models = []
  protected shouldIncludeProjectId: boolean = true


  clearSchedule(projectId = null): Observable<any> {
    let response =
      this.apiRequestService.delete(this.allEventsUrl, {
        params: {
          project: projectId || this.userService.user.selectedProject.id
        }
      })

    response.subscribe(data => {
      this.models = []
      this.modelObserver.next(this.models)
    }, error => { })

    return response
  }


  constructor(injector: Injector) {
    super(injector);
  }
}
