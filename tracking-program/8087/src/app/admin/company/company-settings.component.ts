import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  template: `
    <div class="container-fluid">
      <h3 style="text-align:center; margin-bottom:1.5em;">Company Settings</h3>
      <p class="text-muted">This information appears on all PDF documents — proposals, invoices, bill analytics, shipping documents, and test reports.</p>
      <hr/>

      <div *ngIf="successMsg" class="alert alert-success">{{successMsg}}</div>
      <div *ngIf="errorMsg" class="alert alert-danger">{{errorMsg}}</div>

      <!-- Company Identity -->
      <h4>Company Identity</h4>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>Company Name <span class="text-danger">*</span></label>
            <input type="text" class="form-control" [(ngModel)]="form.name"
                   placeholder="e.g. Synerex Laboratories, LLC"/>
            <p class="help-block">Printed as the service provider name on all documents.</p>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Tax ID / EIN</label>
            <input type="text" class="form-control" [(ngModel)]="form.taxId"
                   placeholder="e.g. 12-3456789"/>
          </div>
        </div>
      </div>

      <!-- Address -->
      <h4 style="margin-top:1em;">Address</h4>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label>Street Address</label>
            <input type="text" class="form-control" [(ngModel)]="form.address"
                   placeholder="e.g. 123 Main Street"/>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
            <label>City</label>
            <input type="text" class="form-control" [(ngModel)]="form.city" placeholder="City"/>
          </div>
        </div>
        <div class="col-md-2">
          <div class="form-group">
            <label>State / Province</label>
            <input type="text" class="form-control" [(ngModel)]="form.state" placeholder="State"/>
          </div>
        </div>
        <div class="col-md-2">
          <div class="form-group">
            <label>ZIP / Postal Code</label>
            <input type="text" class="form-control" [(ngModel)]="form.zip" placeholder="ZIP"/>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Country</label>
            <input type="text" class="form-control" [(ngModel)]="form.country"
                   placeholder="e.g. United States"/>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <h4 style="margin-top:1em;">Contact</h4>
      <div class="row">
        <div class="col-md-4">
          <div class="form-group">
            <label>Billing Email</label>
            <input type="email" class="form-control" [(ngModel)]="form.billingEmail"
                   placeholder="billing@yourcompany.com"/>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Billing Phone</label>
            <input type="text" class="form-control" [(ngModel)]="form.billingPhone"
                   placeholder="e.g. +1 (801) 555-1234"/>
          </div>
        </div>
      </div>

      <!-- Rates -->
      <h4 style="margin-top:1em;">Rates</h4>
      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
            <label>Carbon Credit Rate ($/ton)</label>
            <input type="number" class="form-control" [(ngModel)]="form.carbonCreditRate"
                   placeholder="e.g. 15.00" step="0.01"/>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label>Manager Cost (%)</label>
            <input type="number" class="form-control" [(ngModel)]="form.managerCostPercent"
                   placeholder="e.g. 10" step="0.1"/>
            <p class="help-block">Percentage used for project manager cost calculations.</p>
          </div>
        </div>
      </div>

      <hr/>
      <div class="row">
        <div class="col-md-12 text-right">
          <button class="btn btn-primary btn-lg" (click)="save()" [disabled]="saving">
            <span *ngIf="saving"><span class="glyphicon glyphicon-refresh"></span> Saving...</span>
            <span *ngIf="!saving"><span class="glyphicon glyphicon-floppy-disk"></span> Save Company Settings</span>
          </button>
        </div>
      </div>

      <!-- Preview -->
      <hr/>
      <h4>Preview (as shown on PDF documents)</h4>
      <div style="border:1px solid #ddd; border-radius:8px; padding:1.5em; background:#f9f9f9; font-family:monospace; font-size:13px; line-height:1.8;">
        <strong>{{form.name || '(Company Name)'}}</strong><br/>
        {{form.address || '(Street Address)'}}<br/>
        {{form.city || '(City)'}}<span *ngIf="form.state">, {{form.state}}</span> {{form.zip}}<br/>
        <span *ngIf="form.country">{{form.country}}<br/></span>
        <span *ngIf="form.taxId">Tax ID: {{form.taxId}}<br/></span>
        <span *ngIf="form.billingEmail">{{form.billingEmail}}<br/></span>
        <span *ngIf="form.billingPhone">{{form.billingPhone}}</span>
      </div>
    </div>
  `
})
export class CompanySettingsComponent implements OnInit {

  public saving = false;
  public successMsg: string | null = null;
  public errorMsg: string | null = null;

  public form: any = {
    name: '',
    billingEmail: '',
    billingPhone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    taxId: '',
    carbonCreditRate: 0,
    managerCostPercent: 0,
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>('/api/company-settings').subscribe(
      res => {
        if (res && res.response) {
          Object.assign(this.form, res.response);
        }
      },
      err => {
        this.errorMsg = 'Could not load company settings.';
      }
    );
  }

  save() {
    if (!this.form.name) {
      this.errorMsg = 'Company name is required.';
      return;
    }
    this.saving = true;
    this.successMsg = null;
    this.errorMsg = null;
    this.http.put<any>('/api/company-settings', this.form).subscribe(
      () => {
        this.saving = false;
        this.successMsg = 'Company settings saved. All PDF documents will now use this information.';
        setTimeout(() => this.successMsg = null, 6000);
      },
      err => {
        this.saving = false;
        this.errorMsg = (err.error && err.error.error) || 'Save failed. Please try again.';
      }
    );
  }
}
