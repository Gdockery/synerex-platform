import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomValidators } from 'ng2-validation';
import { IMyOptions } from 'mydatepicker';
import { CreateFromBillService } from './create-from-bill.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import { UserService } from '../../shared/user/user.service';
import { TimeHelpers } from '../../shared/helpers/timeHelpers.service';

@Component({
  selector: 'create-from-bill-wizard',
  templateUrl: './create-from-bill-wizard.component.html',
  styleUrls: ['./create-from-bill-wizard.component.scss']
})
export class CreateFromBillWizardComponent implements OnInit {
  step = 1;
  maxStep = 5;
  scanData: any = null;
  scanError: string = null;
  uploadError: string = null;
  uploading = false;
  submitting = false;
  createdProject: any = null;
  selectedFile: File = null;
  metersInput: string = '';
  useExistingClient = false;
  selectedClientId: number | null = null;
  clients: any[] = [];
  showClientRequired = false;

  clientForm: FormGroup;
  projectForm: FormGroup;
  billForm: FormGroup;

  datePickerOptions: IMyOptions = { dateFormat: 'yyyy-mm-dd', showClearDateBtn: false };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private createFromBillService: CreateFromBillService,
    private userService: CurrentUserService,
    private usrService: UserService,
    private timeHelpers: TimeHelpers,
    @Inject('TIMEZONES') private timezones: any[]
  ) {}

  ngOnInit() {
    this.buildForms();
    this.clients = (window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].clients) || [];
  }

  private buildForms() {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      city: [''],
      state: [''],
      zip: [''],
      contactName: [''],
      contactPhone: ['']
    });

    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      location: [''],
      timeZoneId: ['America/Chicago', Validators.required]
    });

    this.billForm = this.fb.group({
      billReference: [''],
      billDate: [null],
      electricCompanyName: [''],
      electricCompanyAddress: [''],
      electricCompanyCity: [''],
      electricCompanyState: [''],
      electricCompanyZip: [''],
      accountNumber: [''],
      meterNumber: [''],
      totalKwh: ['', [Validators.required, CustomValidators.number]],
      kwPeak: ['', [Validators.required, CustomValidators.number]],
      billAmount: ['', [Validators.required, CustomValidators.number]],
      daysBilled: ['', CustomValidators.number],
      voltage: ['', CustomValidators.number],
      kwRatePerTariff: ['', CustomValidators.number],
      customerCharge: ['', CustomValidators.number],
      tariff: ['']
    });
  }

  onFileSelect(event: { files?: File[] } | Event) {
    let file: File | null = null;
    if (event && typeof event === 'object') {
      if ('files' in event && event.files && event.files[0]) {
        file = event.files[0];
      } else if (event instanceof Event) {
        const input = event.target as HTMLInputElement;
        if (input?.files?.[0]) file = input.files[0];
      }
    }
    if (file) {
      this.selectedFile = file;
      this.scanError = null;
    }
  }

  uploadAndAnalyze() {
    if (!this.selectedFile || !this.selectedFile.name.toLowerCase().endsWith('.pdf')) {
      this.scanError = 'Please select a PDF file.';
      return;
    }
    if (this.selectedFile.size > 10 * 1024 * 1024) {
      this.scanError = 'File must be 10 MB or smaller.';
      return;
    }
    this.scanError = null;
    this.uploadError = null;
    this.uploading = true;
    this.createFromBillService.analyzeBill(this.selectedFile, this.metersInput || undefined).subscribe(
      (res: any) => {
        this.uploading = false;
        const data = res.data || res;
        if (res.success !== false && data && Object.keys(data).length > 0) {
          this.scanData = data;
          this.prefillFromScan();
          this.step = 2;
        } else {
          this.scanError = res.error || 'Could not extract bill data. Please enter information manually.';
        }
      },
      err => {
        this.uploading = false;
        const msg = err && err.error ? (err.error.error || err.error.message || 'Upload failed') : 'Upload failed. Please try again.';
        this.scanError = msg;
        this.uploadError = msg;
      }
    );
  }

  private getDatepickerFromEpoch(ms: number): { date: { year: number; month: number; day: number } } | null {
    if (!ms) return null;
    try {
      const dt = new Date(ms);
      return { date: { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() } };
    } catch (_) {
      return null;
    }
  }

  private prefillFromScan() {
    const d = this.scanData || {};
    this.clientForm.patchValue({
      name: d.serviceAddress ? `Client - ${d.serviceAddress}` : '',
      address: d.serviceAddress || '',
      city: d.serviceCity || '',
      state: d.serviceState || '',
      zip: d.serviceZip || ''
    });
    this.projectForm.patchValue({
      name: d.serviceAddress ? `Project - ${d.serviceAddress}` : '',
      location: [d.serviceAddress, d.serviceCity, d.serviceState].filter(Boolean).join(', ') || '',
      timeZoneId: 'America/Chicago'
    });
    const billDateVal = d.billDate ? this.getDatepickerFromEpoch(Number(d.billDate)) : null;
    this.billForm.patchValue({
      billReference: d.billReference || '',
      billDate: billDateVal,
      electricCompanyName: d.electricCompanyName || '',
      electricCompanyAddress: d.electricCompanyAddress || '',
      electricCompanyCity: d.electricCompanyCity || '',
      electricCompanyState: d.electricCompanyState || '',
      electricCompanyZip: d.electricCompanyZip || '',
      accountNumber: d.accountNumber || '',
      meterNumber: d.meterNumber || '',
      totalKwh: d.totalKwh || '',
      kwPeak: d.kwPeak || '',
      billAmount: d.billAmount || '',
      daysBilled: d.daysBilled || '',
      voltage: d.voltage || '',
      kwRatePerTariff: d.kwRatePerTariff || '',
      customerCharge: d.customerCharge || '',
      tariff: d.tariff || ''
    });
  }

  nextStep() {
    if (this.step === 2) {
      if (!this.useExistingClient && !this.clientForm.valid) {
        this.clientForm.markAllAsTouched();
        return;
      }
      if (this.useExistingClient && !this.selectedClientId) {
        this.showClientRequired = true;
        return;
      }
      this.showClientRequired = false;
    }
    if (this.step === 3 && !this.projectForm.valid) {
      this.projectForm.markAllAsTouched();
      return;
    }
    if (this.step === 4 && !this.billForm.valid) {
      this.billForm.markAllAsTouched();
      return;
    }
    if (this.step < this.maxStep) {
      this.step++;
    }
  }

  prevStep() {
    if (this.step > 1) {
      this.step--;
    }
  }

  submitCreate() {
    const clientOk = this.useExistingClient ? !!this.selectedClientId : this.clientForm.valid;
    if (!clientOk) {
      if (!this.useExistingClient) this.clientForm.markAllAsTouched();
      return;
    }
    if (!this.projectForm.valid || !this.billForm.valid) {
      this.projectForm.markAllAsTouched();
      this.billForm.markAllAsTouched();
      return;
    }

    const billVal = this.billForm.value;
    let billDateTs = null;
    if (billVal.billDate && billVal.billDate.date) {
      const d = billVal.billDate.date;
      try {
        billDateTs = new Date(d.year, d.month - 1, d.day).getTime();
      } catch (_) {}
    }

    // Derive meter count from the meterNumber field (may be comma-separated for multi-meter bills)
    const meterNumberStr = (billVal.meterNumber || '').toString().trim();
    const meterCount = meterNumberStr
      ? meterNumberStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0).length
      : 1;

    // Determine currency exchange rate from currency symbol extracted by AI scan
    const currencySymbol = (this.scanData && this.scanData.currencySymbol) || '$';
    const currencyExchangeRate = (currencySymbol.trim() === '$') ? 1 : 1;

    const meterBill = {
      billReference: billVal.billReference,
      billDate: billDateTs,
      electricCompanyName: billVal.electricCompanyName,
      electricCompanyAddress: billVal.electricCompanyAddress,
      electricCompanyCity: billVal.electricCompanyCity,
      electricCompanyState: billVal.electricCompanyState,
      electricCompanyZip: billVal.electricCompanyZip,
      electricCompanyCountry: 'USA',
      accountNumber: billVal.accountNumber,
      meterNumber: meterNumberStr || '1',
      totalKwh: billVal.totalKwh,
      kwPeak: billVal.kwPeak,
      billAmount: billVal.billAmount,
      daysBilled: billVal.daysBilled || '30',
      voltage: billVal.voltage || 480,
      kwRatePerTariff: billVal.kwRatePerTariff || '0',
      customerCharge: billVal.customerCharge || '0',
      tariff: billVal.tariff || '',
      switchGearCount: meterCount,
      mainCircuitCount: 0,
      kWPerUnit: 75,
      lineItems: (this.scanData && this.scanData.lineItems) || [
        { name: 'KWH Charges', type: 'kwh', cost: 0, billingRate: 0, tierHours: '24', meterReading: billVal.totalKwh, savings: 0 },
        { name: 'KW Charges', type: 'kw', cost: 0, billingRate: billVal.kwRatePerTariff, tierHours: '24', meterReading: billVal.kwPeak, savings: 0 }
      ],
      date: billDateTs,
      totalSavings: 0
    };

    const electricBillAnalysis = {
      meterBills: [meterBill],
      ...meterBill
    };

    const payload: any = {
      project: {
        ...this.projectForm.value,
        currencyExchangeRate,
        reportFields: { numberOfMeters: meterCount },
      },
      electricBillAnalysis
    };
    if (this.useExistingClient && this.selectedClientId) {
      payload.clientId = this.selectedClientId;
    } else {
      payload.client = this.clientForm.value;
    }

    this.submitting = true;
    this.createFromBillService.createFromBill(payload).subscribe(
      (res: any) => {
        this.submitting = false;
        const proj = res.response || res;
        this.createdProject = proj;
        if (proj.id) {
          const clientId = proj.client && (typeof proj.client === 'object' ? proj.client.id : proj.client);
          const p: any = {
            id: proj.id,
            name: proj.name,
            client: clientId,
            slug: proj.slug,
            orgId: proj.orgId,
            timeZoneId: proj.timeZoneId || 'America/Chicago',
            electricBillAnalysis: proj.electricBillAnalysis || {}
          };
          const existing = this.userService.user.projects || [];
          this.userService.user.projects = [p, ...existing];
          if (typeof window !== 'undefined' && window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].user) {
            window['BOOTSTRAP_DATA'].user.projects = this.userService.user.projects;
          }
          if (proj.client && typeof proj.client === 'object' && window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].clients) {
            window['BOOTSTRAP_DATA'].clients.push({ id: proj.client.id, name: proj.client.name });
          }
          if (this.userService.user.role === 7) {
            const ids = (this.userService.user.projects || []).map((x: any) => x.id);
            if (ids.indexOf(proj.id) === -1) ids.push(proj.id);
            this.usrService.update(this.userService.user.id, { projects: ids }).subscribe(() => {}, () => {});
          }
        }
        this.step = this.maxStep;
      },
      err => {
        this.submitting = false;
        const msg = err && err.error ? (err.error.error || err.error.message || 'Create failed') : 'Create failed';
        alert(msg);
      }
    );
  }

  goToProject() {
    if (this.createdProject && this.createdProject.id) {
      this.userService.selectProject(this.createdProject.id);
      this.router.navigate(['/savings/energy-savings']);
    }
  }

  cancel() {
    this.router.navigate(['/project/select']);
  }

  /** Client name for summary step - avoids arrow function in template (Angular parse error). */
  getSummaryClientName(): string {
    if (this.useExistingClient && this.selectedClientId) {
      const c = this.clients.find(x => x.id === this.selectedClientId);
      return (c && c.name) || String(this.selectedClientId);
    }
    return (this.clientForm && this.clientForm.get('name')) ? this.clientForm.get('name').value : '';
  }

  getSummaryProjectName(): string {
    return (this.projectForm && this.projectForm.get('name')) ? this.projectForm.get('name').value : '';
  }

  getSummaryLocation(): string {
    return (this.projectForm && this.projectForm.get('location')) ? this.projectForm.get('location').value : '';
  }

  getSummaryBillText(): string {
    const kwh = (this.billForm && this.billForm.get('totalKwh')) ? this.billForm.get('totalKwh').value : '';
    const kw = (this.billForm && this.billForm.get('kwPeak')) ? this.billForm.get('kwPeak').value : '';
    const amt = (this.billForm && this.billForm.get('billAmount')) ? this.billForm.get('billAmount').value : '';
    return `${kwh} kWh, ${kw} kW peak, $${amt}`;
  }
}
