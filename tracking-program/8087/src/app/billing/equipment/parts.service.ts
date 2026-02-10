import {Observable} from "rxjs";
import {Injectable} from "@angular/core";

@Injectable()
export class PartService {

  private parts = [
    {
      name: 'XLC60 (60 Amp Load Controller)',
      taxable: true,
      price: 620,
      countType: 'item',
      factor: 1,
    },
    {
      name: 'XLC90 (90 Amp Load Controller)',
      taxable: true,
      price: 780,
      countType: 'switchGear',
      factor: 1,
    },
    {
      name: 'XPF480-LC5A (Power Filter Load Controller)',
      taxable: true,
      price: 780,
      countType: 'manual',
      factor: 1,
    },
    {
      name: 'Revenue Grade Meter',
      taxable: true,
      price: 1995,
      countType: 'switchGear',
      factor: 1,
    },
    {
      name: '24" Rocoil CTs',
      taxable: true,
      price: 150,
      countType: 'switchGear',
      factor: 3,
    },
/*    {
      name: 'SUBMETER',
      taxable: true,
      price: 400,
    },*/
    {
      name: 'Xeco Gateways',
      taxable: true,
      price: 129,
      countType: 'item',
      factor: 0.125, 
    },
    {
      name: 'Computer Server',
      taxable: true,
      price: 2475,
      countType: 'single',
      factor: 1, 
    },
    {
      name: 'MISC PARTS (screws, washers, nuts, couplers, clamps, electric tape, screws)',
      taxable: true,
      price: 126.65,
      countType: 'item',
      factor: 1, 
    },
    {
      name: 'METAL STRUT RACKS',
      taxable: true,
      price: 100,
      countType: 'mainCircuit',
      factor: 1, 
    },
    {
      name: '6 GUAGE THHN STRANDED WIRE',
      taxable: true,
      price: 252,
      countType: 'item',
      factor: 0.06,
    },
  ];

  private services = [

    {
      name: 'ENGINEERING/SERVICES/INSTALLATIONS',
      taxable: false,
      percent: 0.15,
      countType: 'single',
    },
    {
      name: 'ANNUAL METERING/SERVER FEE',
      taxable: false,
      price: 799,
      countType: 'switchGear',
      factor: 1,
    },
    /*{
      name: 'ANNUAL METERING/SUBMETER FEE',
      taxable: false,
      price: 299,
      countType: 'manual',
    },*/
    {
      name: 'SHIPPING COSTS',
      taxable: false,
      percent: 0.005,
      countType: 'single',
    },
  ];



  getAllParts(inputParams:any = {}): Observable<any> {
    return new Observable((observer) => {
      observer.next(this.parts);
    });
  };

  getAllServices(inputParams:any = {}): Observable<any> {
    return new Observable((observer) => {
      observer.next(this.services);
    });
  };

  get(name = null) {
    return this.parts.filter(part => {
      return part.name == name;
    })[0];
  }

}
