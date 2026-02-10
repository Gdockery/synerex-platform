/**
 * Dependencies
 */

import { Validators } from "@angular/forms";
import { CustomValidators} from "ng2-validation";


/**
 * Validation rules
 */

export default {
  name: [{value: '', disabled: false}, [Validators.required]],
  country: [{value: '', disabled: false}],
  address: [{value: '', disabled: false}],
  city: [{value: '', disabled: false}],
  state: [{value: '', disabled: false}],
  zip: [{value: '', disabled: false}],
  contactName: [{value: '', disabled: false}, [Validators.required]],
  contactTitle: [{value: '', disabled: false}],
  contactPhone: [{value: '', disabled: false}],
  marketSegment: [{value: '', disabled: false}],
  taxId: [{value: '', disabled: false}],
  shippingTerms: [{value: '', disabled: false}],
  financeEmail: [{value: '', disabled: false}, [CustomValidators.email]],
  financePhone: [{value: '', disabled: false}],
  legalName: [{value: '', disabled: false}],
  logoImgSrc: [{value: '', disabled: false}],
  managerName: [{value: '', disabled: false}],
  managerCertificate: [{value: '', disabled: false}],
  managerPhone: [{value: '', disabled: false}],
  managerEmail: [{value: '', disabled: false}],
  managerLocation: [{value: '', disabled: false}],
};
