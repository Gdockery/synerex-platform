import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {ApiRequestService} from "../../api/api-request.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {Project} from "../../shared/project/project";

@Injectable()
export class BillAnalyticService {


  constructor(private apiRequestService: ApiRequestService, private currentUserService: CurrentUserService) {}

  getAnalytic() {
    return new Observable((observer) => {
      observer.next(this.currentUserService.user.selectedProject.electricBillAnalysis);
      observer.complete();
    });
  }

  getEquipment() {
    return new Observable((observer) => {
      observer.next(this.currentUserService.user.selectedProject.equipmentInfo);
      observer.complete();
    });
  }

  updateAnalytic(inputParams:any = {}): Observable<any> {
    let response = this.apiRequestService.put('/api/project/'+this.currentUserService.user.selectedProject.id+'/electric-bill-analysis', {electricBillAnalysis: inputParams});
    response.subscribe(response => {
      this.currentUserService.user.selectedProject.electricBillAnalysis = (response && response.response !== undefined) ? response.response : response;
    });
    return response;
  };

  updateEquipment(inputParams:any = {}, meterNumber?): Observable<any> {
    let response = this.apiRequestService.put('/api/project/'+this.currentUserService.user.selectedProject.id+'/equipment-info/', {equipmentInfo: inputParams, meterNumber: meterNumber});
    response.subscribe(response => {
      this.currentUserService.user.selectedProject.equipmentInfo = (response && response.response !== undefined) ? response.response : response;
    });
    return response;
  };
}
