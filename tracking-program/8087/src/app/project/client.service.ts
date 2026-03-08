import { Injectable }              from '@angular/core';


import {BaseApiCrudService} from "../api/baseApiCrud.service";
import {Observable} from "rxjs";
import {Injector} from '@angular/core';

@Injectable()
export class ClientService extends BaseApiCrudService {

  protected baseUrl:string = '/api/meter/';
  public models = [];
  protected shouldIncludeProjectId = true;

  get(id = null): Observable<any> {
    this.modelObserver.next({
      energySupplier: {
        name: 'Test Supplier',
        address: '1234 Main st.',
        city: 'Austin',
        state: 'TX',
        zip: 12343
      },
      accountNumber: 1234567,
      contact: 'Some Guy'
    });
    return this.modelObserver;
  }



  constructor(injector: Injector) {
    super(injector);
  }
}
