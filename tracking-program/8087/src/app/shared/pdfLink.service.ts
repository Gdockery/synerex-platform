import {Observable} from "rxjs";
import {Injectable} from "@angular/core";
import {CurrentUserService} from "./user/currentUser.service";
import {WindowRef} from "./windowRef.component";

@Injectable()
export class PdfLinkService {

  private baseUrl;
  private token;

  constructor(private windowRef: WindowRef, private currentUserService: CurrentUserService) {
  }

  getLinks(data?): Observable<any> {
    const win = this.windowRef.getNativeWindow();
    const apiBasePath = ((win['BOOTSTRAP_DATA'] || {})['apiBasePath'] || '').toString().replace(/\/$/, '');
    this.baseUrl = win.location.origin + (apiBasePath ? apiBasePath + '/' : '') + 'secure/view?';
    this.token = this.currentUserService.user.selectedProject.documentShareToken;
    if (data) {
     return new Observable((observer) => {
        observer.next({ 
          meterCertificate: this.baseUrl + 'meterCertificate=' + '{"token": "' + this.token + '", "meter": [' + data + ']}',
          selectedBillAnalytic: this.baseUrl + 'selectedBillAnalytic=' + '{"token": "' + this.token + '", "bills": [' + data + ']}',
          selectedProposal: this.baseUrl + 'selectedProposal=' + '{"token": "' + this.token + '", "bills": [' + data + ']}',
          selectedShippingDocuments: this.baseUrl + 'selectedShippingDocuments=' + '{"token": "' + this.token + '", "bills": [' + data + ']}',
          testReport: this.baseUrl + 'testReport=' + '{"token": "' + this.token + '", "test": ' + data.test + ', "meters": [' + data.meters + ']}',
        });
        observer.complete();
      });
    } else {
      return new Observable((observer) => {
        observer.next({ 
          proposal: this.baseUrl + 'proposal=' + this.token,
          depositInvoice: this.baseUrl + 'depositInvoice=' + this.token,
          finalInvoice: this.baseUrl + 'finalInvoice=' + this.token,
          totalInvoice: this.baseUrl + 'totalInvoice=' + this.token,
          installationInvoice: this.baseUrl + 'installationInvoice=' + this.token,
          billAnalytic: this.baseUrl + 'billAnalytic=' + this.token,
          costSavings: this.baseUrl + 'costSavings=' + this.token,
          lsPotential: this.baseUrl + 'lsPotential=' + this.token,
          co2Savings: this.baseUrl + 'co2Savings=' + this.token,
          partsProcurement: this.baseUrl + 'partsProcurement=' + this.token,
          budgetInvoice: this.baseUrl + 'budgetInvoice=' + this.token,
          budgetReport: this.baseUrl + 'budgetReport=' + this.token,
          financeAgreement: this.baseUrl + 'financeAgreement=' + this.token,
          shippingDocuments: this.baseUrl + 'shippingDocuments=' + this.token,
        });
        observer.complete();
      });
    }
   
  };

}
