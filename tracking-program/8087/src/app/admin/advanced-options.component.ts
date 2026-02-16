import {Component, OnInit, NgZone} from '@angular/core';
import {FormBuilder, Validators} from "@angular/forms";
import {CustomValidators} from "ng2-validation";
import {ApiRequestService} from "../api/api-request.service";
import {WhitelabelService} from '../shared/services/whitelabel.service';

@Component({
  template: `
    <div class="container-fluid">
      <h3>Advanced options</h3>
      <p>You can configure a few different global settings for this installation of the {{brandName}} web portal below.</p>
      <hr/>
      <h4>{{brandName}}'s Corporate Info</h4>
      <p>Used for billing and legal purposes in proposals, receipts, terms, etc.</p>
      <form [formGroup]="form" (ngSubmit)="submitForm()">
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="address">Street Address</label>
              <textarea rows="3" class="form-control" id="address" name="address" formControlName="address"></textarea>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="city">City</label>
              <input type="text" class="form-control" id="city" name="city" formControlName="city">
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label for="state">State</label>
              <input type="text" class="form-control" id="state" name="state" formControlName="state">
            </div>
          </div>
          <div class="col-md-2">
            <div class="form-group">
              <label for="zip">Zip</label>
              <input type="text" class="form-control" id="zip" name="zip" formControlName="zip">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="billingPhone">Phone</label>
              <input placeholder="(___) ___-____" type="text" class="form-control" id="billingPhone" name="billingPhone" formControlName="billingPhone" [textMask]="{mask:mask}">
            </div>
          </div>

          <div class="col-md-4">
            <div class="form-group">
              <label for="billingEmail">Email</label>
              <input type="text" class="form-control" id="billingEmail" name="billingEmail" formControlName="billingEmail">
            </div>
          </div>
        </div>

        <hr/>

        <h4>Carbon Credit Rate</h4>
        <p>Used for displaying carbon emission saving charts and highlights.</p>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="carbonCreditRate">USD/Kwh</label>
              <input type="text" placeholder="11.0" class="form-control" id="carbonCreditRate" name="carbonCreditRate" formControlName="carbonCreditRate">
            </div>
          </div>
        </div>

        <hr/>

        <h4>{{brandName}} Manager Fee</h4>
        <p>Percentage to apply on top of a project's subtotal as an additional project management fee.</p>
        <div class="row">
          <div class="col-md-4">
            <div class="form-group">
              <label for="xecoManagerCostPercent">Fee Percentage (%)</label>
              <input type="text" placeholder="5.0" class="form-control" id="xecoManagerCostPercent" name="xecoManagerCostPercent" formControlName="xecoManagerCostPercent">
            </div>
          </div>
        </div>


        <div class="row">
          <div class="col-md-12 text-right">
            <button class="btn btn-primary">Update</button>
          </div>
        </div>
      </form>
    </div>
  `
})


export class AdvancedOptionsComponent implements OnInit {

  // Our FormBuilder instance
  private form;

  // For coercing the user-typed phone number:
  private mask = ['(', /[1-9]/, /\d/, /\d/, ')', ' ', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];
  public brandName: string = 'Synerex';

  constructor(private formBuilder: FormBuilder, private apiRequest: ApiRequestService, private whitelabelService: WhitelabelService) {}

  ngOnInit() {
    this.whitelabelService.getBrandName().subscribe(brandName => {
      this.brandName = brandName;
    });
    this.form = this.formBuilder.group({
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      billingEmail: ['', [CustomValidators.email]],
      billingPhone: ['', [Validators.required]],
      carbonCreditRate: ['', [Validators.required, CustomValidators.range([0,100])]],
      xecoManagerCostPercent: ['', [Validators.required, CustomValidators.range([0,100])]],
    });

    // Populate form with current values
    this.form.patchValue(window['BOOTSTRAP_DATA'].xecoAdvancedOptions || {});

  }

  submitForm() {
    for (let i in this.form.controls) {
      this.form.controls[i].markAsDirty();
    }

    if(!this.form.valid) {
      alert('Something seems a little off -- please check the fields above and try resubmitting.');
      return;
    }

    // Send new values to server
    this.apiRequest.put('/api/xeco', {
      valuesToSet: this.form.value
    });
  }

}
