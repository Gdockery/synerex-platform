import {Inject, Injectable}              from '@angular/core';

import {Observable} from "rxjs";
import {DeviceService} from "../electricityMeters/devices/device.service";
import {CurrentUserService} from "../shared/user/currentUser.service";
import {SavingsReportService} from "../billing/savingsReport/savingsReport.service";
import {APP_CONFIG, IAppConfig} from "../config/app.config";
import {ApiRequestService} from "../api/api-request.service";

var moment = require('moment');

@Injectable()
export class Co2SavingsService {

  constructor(
    private deviceService: DeviceService,
    private userService: CurrentUserService,
    private savingsReportService: SavingsReportService,
    @Inject(APP_CONFIG) private config: IAppConfig,
    private apiRequestService: ApiRequestService
  ) {}

  /*getSavingsData(fromDate, toDate): Observable<any> {
    return this.savingsReportService.getAll({fromDate: fromDate, toDate: toDate}).map(data => {
      return data.response.reduce((result, report) => {
        let totalKwh = report.reportData.lineItems.reduce((sum, item) => {
          if(item.type === 'KWH') {
            sum += item.meterReading;
          }
          return sum;
        }, 0);
        result.data.push((this.config.constants.CARBON_EMISSIONS_RATIO * this.userService.user.selectedProject.carbonCreditRate * totalKwh).toFixed(2));
        result.months.push(report.month);
        return result;
      }, {
        data: [],
        months: []
      });
    });
  }

  //Expected return format
  //{
  //     allTime: 109600,
  //     thisYear: 100000,
  //     thisMonth: 9500,
  //     today: 800
  //}
  */

  getCarbonSavings(): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/carbon-savings');
  }

  getCarbonChart(): Observable<any> {
    return this.apiRequestService.get('/api/project/' + this.userService.user.selectedProject.id + '/carbon-chart');
  }
}
