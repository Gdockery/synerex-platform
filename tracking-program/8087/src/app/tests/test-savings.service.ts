import { Injectable }              from '@angular/core';



import {Observable, BehaviorSubject} from "rxjs";
import {BaseApiCrudService} from "../api/baseApiCrud.service";

@Injectable()
export class TestSavingsService {

  getSavings(id) {
    return new BehaviorSubject({
      test: {
        kWhDifference: 100,
      },
      billItems: [
        {
          name: 'Item 1',
          tariffRate: 10
        },
        {
          name: 'Item 2',
          tariffRate: 12
        },
      ]
    })
  }

}
