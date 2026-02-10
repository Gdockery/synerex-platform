import { Injectable } from '@angular/core'
import { BaseApiCrudService } from "../api/baseApiCrud.service"

@Injectable()
export class PaymentService extends BaseApiCrudService {
  protected baseUrl: string = '/api/payment/';

  getInfo() {
    return this.apiRequestService.get(this.baseUrl + 'info')
  }

  deleteSubscription(id) {
    return this.apiRequestService.post(this.baseUrl + 'delete-subscription', { params: { id: id } })
  }

  createSubscription(params) {
    return this.apiRequestService.post(this.baseUrl + 'create-subscription', { params: params })
  }
}
