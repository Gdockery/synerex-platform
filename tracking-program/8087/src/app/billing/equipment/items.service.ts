import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {BaseApiCrudService} from "../../api/baseApiCrud.service";

@Injectable()
export class ItemService {

  getAll(inputParams:any = {}): Observable<any> {
    return new Observable((observer) => {
      observer.next(this.items);
    });
  };

  private items = 
    [
      {
        id: 2,
        name: 'XPS400',
        price: 2395,
      },
      {
        id: 3,
        name: 'XPS600',
        price: 4695,
      },
      {
        id: 4,
        name: 'XECO600B',
        price: 498,
      },
      {
        id: 5,
        name: 'XPF480-100',
        price: 11995,
      },
    ]
  

}
