
import {map} from 'rxjs/operators';
import { Injectable }              from '@angular/core';


import {ApiRequestService} from "../../api/api-request.service";
import {Observable} from "rxjs";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";

@Injectable()
export class MeterChartService {
  constructor (private apiService: ApiRequestService, private currentUserService: CurrentUserService, private timeHelpers: TimeHelpers) {}


  getData(params, period:string): Observable<any> {
    params.project = this.currentUserService.user.selectedProject.id;
    let format = (period == 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD');
    let outputFormat = (period == 'monthly' ? 'MMM YYYY' : 'MMM D YYYY');
    return this.apiService.get('/api/meter/' + period, this.apiService.createRequestParams(params)).pipe(map(meterResponse => {
      meterResponse.response.map(data => {
        data.date = this.timeHelpers.momentForUserTzUnadjusted(data.date, format).format(outputFormat);
        return data;
      });
      return meterResponse.response;
    }));
  }
}
