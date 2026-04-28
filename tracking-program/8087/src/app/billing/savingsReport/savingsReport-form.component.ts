import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IMyOptions} from "mydatepicker";
import {FormArray, FormBuilder, FormControl, Validators} from "@angular/forms";
import {BillAnalyticService} from "../billAnalytic/billAnalytic.service";
import {DateTimeValidators} from "../../shared/validation/dateTime.validators";
import {AdditionalValidators} from "../../shared/validation/additional.validator";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {TimeHelpers} from "../../shared/helpers/timeHelpers.service";
import {DeviceService} from "../../electricityMeters/devices/device.service";
import {CreateFromBillService} from "../../project/create-from-bill/create-from-bill.service";
/*import {DropdownModule} from "primeng/primeng";
import {InputTextModule} from "primeng/primeng";*/

let _ = require('lodash');

@Component({
  selector: 'savings-report-form',
  template: `
    <div *ngIf="!selectedTest" style="font-size: 20px; ">
      Please select a test first to enter bills.
    </div>

    <!-- Scan Bill from PDF -->
    <div [hidden]="!selectedTest" style="background:#f0f7ff; border:1px solid #b8d4f0; border-radius:6px; padding:1em 1.25em; margin-bottom:1.25em;">
      <h4 style="margin-top:0; margin-bottom:0.5em; color:#1a5a8a;">Scan Bill from PDF <small style="font-size:0.75em; color:#666; font-weight:normal;">— auto-fill line items and bill details from this month's bill</small></h4>
      <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
        <input type="file" accept=".pdf" (change)="onFileSelect($event)" #billFileInput style="max-width:320px;" />
        <button type="button" class="default-button green-button" (click)="scanBill()" [disabled]="!selectedFile || scanning">
          {{ scanning ? 'Scanning...' : 'Scan Bill' }}
        </button>
        <span *ngIf="scanSuccess" style="color:#2a7a2a; font-size:0.9em;">✓ Bill scanned — {{ scannedLineItemCount }} line item(s) loaded. Review and edit below before submitting.</span>
      </div>
      <div *ngIf="scanError" style="margin-top:8px; color:#c00; font-size:0.9em;">{{ scanError }}</div>
    </div>

    <form [formGroup]="form" [hidden]="!selectedTest" (ngSubmit)="submit(form)">

      <!-- Client & Project Information -->
      <div class="row">
        <div class="col-md-12"><h3>Client &amp; Project Information</h3></div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <div class="form-group">
            <label for="client_name">Client / Company Name</label>
            <input type="text" pInputText id="client_name" name="client_name" formControlName="client_name" placeholder="e.g. Acme Corp" />
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label for="utility_name">Electric Utility / Company</label>
            <input type="text" pInputText id="utility_name" name="utility_name" formControlName="utility_name" placeholder="e.g. Oncor Electric" />
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label for="project_type">Project Type</label>
            <input type="text" pInputText id="project_type" name="project_type" formControlName="project_type" placeholder="e.g. Commercial, Industrial" />
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="facility_address">Facility Street Address</label>
            <input type="text" pInputText id="facility_address" name="facility_address" formControlName="facility_address" placeholder="123 Main St" />
          </div>
        </div>
        <div class="col-md-2">
          <div class="form-group">
            <label for="facility_city">City</label>
            <input type="text" pInputText id="facility_city" name="facility_city" formControlName="facility_city" placeholder="Dallas" />
          </div>
        </div>
        <div class="col-md-2">
          <div class="form-group">
            <label for="facility_state">State</label>
            <input type="text" pInputText id="facility_state" name="facility_state" formControlName="facility_state" placeholder="TX" />
          </div>
        </div>
        <div class="col-md-2">
          <div class="form-group">
            <label for="facility_zip">ZIP</label>
            <input type="text" pInputText id="facility_zip" name="facility_zip" formControlName="facility_zip" placeholder="75001" />
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-4">
          <div class="form-group">
            <label for="contact_name">Contact Name</label>
            <input type="text" pInputText id="contact_name" name="contact_name" formControlName="contact_name" placeholder="Jane Smith" />
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label for="contact_phone">Contact Phone</label>
            <input type="text" pInputText id="contact_phone" name="contact_phone" formControlName="contact_phone" placeholder="+1 (555) 123-4567" />
          </div>
        </div>
        <div class="col-md-4">
          <div class="form-group">
            <label for="contact_email">Contact Email</label>
            <input type="text" pInputText id="contact_email" name="contact_email" formControlName="contact_email" placeholder="jane@company.com" />
          </div>
        </div>
      </div>
      <hr/>

      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
            <label for="fromDate">First day of billing period</label>
            <my-date-picker
              name="fromDate"
              id="fromDate"
              [options]="datePickerOptions"
              (inputFieldChanged)="updateConsolidatedData()"
              formControlName="fromDate">
            </my-date-picker>
            <div *ngIf="form.controls.fromDate.hasError('invalidBeforeDateField') && (form.controls.fromDate.dirty || form.controls.fromDate.touched)" class="alert alert-danger">
              From date must be before to date.
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="form-group">
            <label for="toDate">Last day of billing period</label>
            <my-date-picker
              name="toDate"
              id="toDate"
              (inputFieldChanged)="updateConsolidatedData()"
              [options]="datePickerOptions"
              formControlName="toDate">
            </my-date-picker>
            <div *ngIf="form.controls.toDate.hasError('invalidAfterDateField') && (form.controls.toDate.dirty || form.controls.toDate.touched)" class="alert alert-danger">
              To date must be after from date.
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
            <div class="form-group">
              <label for="multiplier">kwh Multiplier</label><br/>
              <p-dropdown id="selectedMultiplier" name="selectedMultiplier" [options]="multiplier"
                          formControlName="selectedMultiplier"
                          (onChange)="updateConsolidatedData()"
                          [(ngModel)]="selectedMultiplier"></p-dropdown>
            </div>
        </div>
        
      </div>

      <div class="row">
        <div class="col-md-3">
          <div class="form-group">
                <label>Total Bill</label><br/>
                <input type="text" (onChange)="updateConsolidatedData()" pInputText id="totalBill" name="totalBill" formControlName="totalBill" [(ngModel)]="totalBill" />
	        </div>

	</div>
        <div class="col-md-3">
          <div class="form-group">

                <label for="pfc">Power Factor Credit </label><br/>
                <input type="number" pInputText id="pfc" name="pfc" formControlName="pfc" max="0" [(ngModel)]="pfc" required (onChange)="validatePfc()" />
		<br /><font *ngIf="!pfcError" size="-1">(Must be 0 or negative)</font>
          <div *ngIf="pfcError"class="alert">
            <strong>Power Factor Credit must be 0 or negative</strong>
          </div>
	  </div>
	</div>

        <div class="col-md-3">
            <div class="form-group">
              <label for="multiplier">kwPeak Multiplier</label><br/>
              <p-dropdown id="selectedMultiplier2" name="selectedMultiplier2" [options]="multiplier"
                          formControlName="selectedMultiplier2"
                          (onChange)="updateConsolidatedData()"
                          [(ngModel)]="selectedMultiplier2"></p-dropdown>
            </div>
	</div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <h3>Xeco Data for this Period <small>(savings % based on most recent test)</small></h3>
        </div>
        <div class="col-md-6">
          <table style="width:100%;">
            <tr>
              <td>
                <label>Usage (KWH)</label><br/>
                {{(aggregateData?.kwh * selectedMultiplier | number : '1.0-0') || '--'}}
              </td>
              <td>
                <label>KW Peak</label><br/>
                {{(aggregateData?.kvaPeak * selectedMultiplier2 | number : '1.0-0') || '--'}}
              </td>
              <td>
                <label>KWH Savings</label><br/>
                {{savings.kwh * 100 | number : '1.2-2'}}%
              </td>
              <td>
                <label>KW Peak Savings</label><br/>
                {{savings.kwp * 100 | number : '1.2-2'}}%
              </td>
            </tr>
          </table>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <h3>Line Items</h3>
          <line-item-form [items]="items" [itemArray]="form.get('lineItems')" [projectSavings]="true"></line-item-form>
        </div>
        <div class="col-md-12 text-right" style="padding-top: 22px">
          <button class="default-button green-button" type="button" [routerLink]="['/billing']">Cancel</button>
          <button class="default-button green-button" type="submit">Submit</button>
        </div>
      </div>
    </form>
    <style>
      .alert {
          padding: 5px;
          background-color: #f44336;
          color: white;
      }

</style>
  `
})
export class SavingsReportFormComponent implements OnInit {

  @Input() public items;
  @Input() public report:any ;

  @Output() submitEvent = new EventEmitter<any>();

  public selectedTest;
  public form;
  public savings;
  public aggregateData;
  public selectedMultiplier = 1.00;
  public selectedMultiplier2 = 1.00;
  public usageKWH;
  public kwPeak;
  public kwhSavings;
  public kwPeakSavings;
  public totalBill;
  public pfc;
  public pfcError = false;
  public pfcErrorMsg;
  public costTotalError = false;

  // Bill scan state
  public selectedFile: File | null = null;
  public scanning = false;
  public scanError: string | null = null;
  public scanSuccess = false;
  public scannedLineItemCount = 0;

  public datePickerOptions: IMyOptions = {
    dateFormat: 'dd/mmm/yyyy',
    showClearDateBtn: false
  };

  public multiplier = [
                      {label: '0.91', value: 0.91},
                      {label: '0.92', value: 0.92},
                      {label: '0.93', value: 0.93},
                      {label: '0.94', value: 0.94},
                      {label: '0.95', value: 0.95},
                      {label: '0.96', value: 0.96},
                      {label: '0.97', value: 0.97},
                      {label: '0.98', value: 0.98},
                      {label: '0.99', value: 0.99}, 
                      {label: 'None', value: 1.00},
                      {label: '1.01', value: 1.01},
                      {label: '1.02', value: 1.02},
                      {label: '1.03', value: 1.03},
                      {label: '1.04', value: 1.04},
                      {label: '1.05', value: 1.05},
                      {label: '1.06', value: 1.06},
                      {label: '1.07', value: 1.07},
                      {label: '1.08', value: 1.08},
                      {label: '1.09', value: 1.09}];

  constructor(
    private formBuilder: FormBuilder,
    private currentUserService: CurrentUserService,
    private deviceService: DeviceService,
    private timeHelpers: TimeHelpers,
    private createFromBillService: CreateFromBillService,
  ) {
    this.savings = currentUserService.user.selectedProject.savings;
  }

  ngOnInit() {
    this.selectedTest = this.currentUserService.user.selectedProject.selectedTest;
    this.initializeForm();
    //this.updateConsolidatedData();
  }

  validatePfc () {
    if (this.form.value.pfc > 0) {
      this.pfcError = true;
    } 
  }
  

  updateConsolidatedData() {
    if(this.form.value.fromDate.date && this.form.value.toDate.date) {
      this.deviceService.getConsolidatedDeviceData(
        this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).format('x'),
        this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.toDate.date).format('x')
      ).subscribe(data => {
        this.selectedMultiplier = parseFloat(this.form.value.selectedMultiplier);
        this.selectedMultiplier2 = parseFloat(this.form.value.selectedMultiplier2);
    		if (isNaN(this.form.value.totalBill)) {this.form.value.totalBill = 0;}
        this.totalBill = parseFloat(this.form.value.totalBill);
    		if (isNaN(this.form.value.pfc)) {this.form.value.pfc = 0;}
        this.pfc = parseFloat(this.form.value.pfc);
        this.aggregateData = data.response;

        this.usageKWH = '--';
        this.kwPeak = '--';

        if(this.aggregateData.hasOwnProperty('kwh') && this.aggregateData.hasOwnProperty('kwPeak')) {
          this.usageKWH = _.round(this.aggregateData.kwh * this.selectedMultiplier);
          this.kwPeak = _.round(this.aggregateData.kvaPeak * this.selectedMultiplier2);

      	  /*this.form.get('lineItems').controls.forEach(lineItem => {
      			lineItem.controls.usageKWH.setValue(this.usageKWH, {onlySelf: true});
      			lineItem.controls.kwPeak.setValue(this.kwPeak, {onlySelf: true});
    		  });*/
        
          this.kwhSavings = _.round(this.savings.kwh * 100, 2);
          this.kwPeakSavings = _.round(this.savings.kwp * 100, 2); 
        }
      });
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = (input && input.files && input.files[0]) ? input.files[0] : null;
    this.scanError = null;
    this.scanSuccess = false;
  }

  scanBill() {
    if (!this.selectedFile) { this.scanError = 'Please select a PDF file.'; return; }
    if (!this.selectedFile.name.toLowerCase().endsWith('.pdf')) { this.scanError = 'File must be a PDF.'; return; }
    if (this.selectedFile.size > 10 * 1024 * 1024) { this.scanError = 'File must be 10 MB or smaller.'; return; }
    this.scanning = true;
    this.scanError = null;
    this.scanSuccess = false;
    this.createFromBillService.analyzeBill(this.selectedFile, undefined, (msg: string) => { this.scanError = null; this.scanSuccess = false; }).subscribe(
      (res: any) => {
        this.scanning = false;
        const data = res.data || res;
        if (res.success !== false && data && Object.keys(data).length > 0) {
          this.prefillFromScanData(data);
          this.scanSuccess = true;
        } else {
          this.scanError = res.error || 'Could not extract bill data. Please enter information manually.';
        }
      },
      (err: any) => {
        this.scanning = false;
        this.scanError = (err && err.error && (err.error.error || err.error.message)) || 'Upload failed. Please try again.';
      }
    );
  }

  private prefillFromScanData(d: any) {
    if (!this.form || !d) return;

    // Auto-fill scalar fields from scanned bill
    this.form.patchValue({
      totalBill: d.billAmount || this.form.value.totalBill || '',
      utility_name: d.electricCompanyName || this.form.value.utility_name || '',
      facility_address: d.serviceAddress || this.form.value.facility_address || '',
      facility_city: d.serviceCity || this.form.value.facility_city || '',
      facility_state: d.serviceState || this.form.value.facility_state || '',
      facility_zip: d.serviceZip || this.form.value.facility_zip || '',
    });
    if (d.billAmount) {
      this.totalBill = parseFloat(d.billAmount) || this.totalBill;
    }

    // Build line items from scan — one row per charge on this month's bill
    const lineItems = d.lineItems && d.lineItems.length > 0 ? d.lineItems : [
      { name: 'KWH Charges', type: 'kwh', cost: 0, billingRate: d.kwhRate || 0, tierHours: '24', meterReading: d.totalKwh || 0, savings: 0 },
      { name: 'KW Charges',  type: 'kw',  cost: 0, billingRate: d.kwRatePerTariff || 0, tierHours: '24', meterReading: d.kwPeak || 0, savings: 0 },
    ];

    this.items = lineItems;
    const lineItemsArray = this.form.get('lineItems') as FormArray;
    while (lineItemsArray.length) {
      lineItemsArray.removeAt(0);
    }
    lineItems.forEach((item: any) => {
      lineItemsArray.push(this.formBuilder.group({
        name:         new FormControl(item.name || ''),
        tierHours:    new FormControl(item.tierHours || '24'),
        type:         new FormControl(item.type || 'kwh'),
        cost:         new FormControl(item.cost != null ? item.cost : 0),
        billingRate:  new FormControl(item.billingRate != null ? item.billingRate : 0),
        meterReading: new FormControl(item.meterReading != null ? item.meterReading : 0),
        savings:      new FormControl(item.savings || 0),
      }));
    });
    this.scannedLineItemCount = lineItems.length;
  }

  initializeForm() {
    this.form = this.formBuilder.group({
      lineItems: this.formBuilder.array([]),
      fromDate: ['', [Validators.required, DateTimeValidators.beforeDateField('toDate')]],
      toDate: ['', [Validators.required, DateTimeValidators.afterDateField('fromDate')]],
      selectedMultiplier: [''],
      selectedMultiplier2: [''],
      totalBill: '',
      pfc: '',
      client_name: '',
      utility_name: '',
      project_type: '',
      facility_address: '',
      facility_city: '',
      facility_state: '',
      facility_zip: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
    });
    if(this.report) {
      this.form.patchValue({
        month: this.report.month,
        year: this.report.year,
        client_name: (this.report.reportData && this.report.reportData.client_name) || '',
        utility_name: (this.report.reportData && this.report.reportData.utility_name) || '',
        project_type: (this.report.reportData && this.report.reportData.project_type) || '',
        facility_address: (this.report.reportData && this.report.reportData.facility_address) || '',
        facility_city: (this.report.reportData && this.report.reportData.facility_city) || '',
        facility_state: (this.report.reportData && this.report.reportData.facility_state) || '',
        facility_zip: (this.report.reportData && this.report.reportData.facility_zip) || '',
        contact_name: (this.report.reportData && this.report.reportData.contact_name) || '',
        contact_phone: (this.report.reportData && this.report.reportData.contact_phone) || '',
        contact_email: (this.report.reportData && this.report.reportData.contact_email) || '',
      })
    }
  }

  submit() {
    if(this.form.valid) {
      let formData = {
        reportData: {
          lineItems: this.form.get('lineItems').value,
          total: this.form.get('lineItems').value.reduce((sum, item) => sum+=parseInt(item.cost), 0),
          totalBeforeXeco: this.form.get('lineItems').value.reduce((sum, item) => sum+((+item.cost) + (+item.savings)), 0),
          usageKWH: this.usageKWH,
          kwPeak: this.kwPeak,
          kwhSavings: this.kwhSavings,
          kwPeakSavings: this.kwPeakSavings,
	        totalBill: this.totalBill,
	        pfc: this.pfc,
          kwhMultiplier: this.selectedMultiplier,
          kwMultiplier: this.selectedMultiplier2,
          client_name: this.form.get('client_name').value || '',
          utility_name: this.form.get('utility_name').value || '',
          project_type: this.form.get('project_type').value || '',
          facility_address: this.form.get('facility_address').value || '',
          facility_city: this.form.get('facility_city').value || '',
          facility_state: this.form.get('facility_state').value || '',
          facility_zip: this.form.get('facility_zip').value || '',
          contact_name: this.form.get('contact_name').value || '',
          contact_phone: this.form.get('contact_phone').value || '',
          contact_email: this.form.get('contact_email').value || '',
        },
        month: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).format('YYYY-MM-DD'),
        fromDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.fromDate.date).format('x'),
        toDate: this.timeHelpers.getMomentFromDatepickerDictionary(this.form.value.toDate.date).format('x'),
      };
      this.submitEvent.emit(formData);
    } else {
        for (let i in this.form.controls) {
          this.form.controls[i].markAsDirty();
        }
        this.form.get('lineItems').controls.forEach(lineItem => {
        for (let i in lineItem.controls) {
          lineItem.controls[i].markAsDirty();
        }
      });
    }
  }
}
