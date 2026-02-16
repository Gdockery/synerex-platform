/**
 * Dependencies
 */

import { Validators } from "@angular/forms";
import { CustomValidators} from "ng2-validation";


/**
 * Validation rules
 */

export default {
  client: [{value: this.clientId, disabled: false}, [Validators.required]],
  xecoManager: [{value: '', disabled: false}],
  name: [{value: '', disabled: false}, [Validators.required]],
  purchaseOrder: [{value: '', disabled: false}],
  invoiceNumber: [{value: '', disabled: false}],
  depositAmount: [{value: 0, disabled: false}, [CustomValidators.number]],
  discount: [{value: 0, disabled: false}, [CustomValidators.range([0,100])]],
  totalCost: [{value: 0, disabled: false}, [CustomValidators.number]],
  startDate: [{value: '', disabled: false}, []],
  timeZoneId: [{value: '', disabled: false}, [Validators.required]],
  location: [{value: '', disabled: false}],
  proposalNumber: [{value: '', disabled: false}, []],
  salesTax: [{value: 0, disabled: false}, [CustomValidators.number]],
  currencyCode: [{value: 'USD', disabled: false}, [Validators.required]],
  currencyExchangeRate: [{value: 1, disabled: false}],
  carbonCreditRate: [{value: 15, disabled: false}, [CustomValidators.number]],
  //gwControl: [{value: false, disabled: false}],
  slug: [{value: '', disabled: false}, [Validators.required]],
  initialPf: [{value: 0, disabled: false}, [Validators.required, CustomValidators.number]],
  multiplier: [{value: 1, disabled: false}, [Validators.required, CustomValidators.number]],
  peakMultiplier: [{value: 1, disabled: false}, [Validators.required, CustomValidators.number]],
  ILRatio: [{value: 100, disabled: false}, [Validators.required, CustomValidators.number]],
};
