import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { IMyOptions } from 'mydatepicker';
import { CreateFromBillService } from './create-from-bill.service';
import { CurrentUserService } from '../../shared/user/currentUser.service';
import { UserService } from '../../shared/user/user.service';
import { TimeHelpers } from '../../shared/helpers/timeHelpers.service';

export const PENDING_BILL_PROJECT_KEY = 'pending_bill_project';

@Component({
  selector: 'create-from-bill-wizard',
  templateUrl: './create-from-bill-wizard.component.html',
  styleUrls: ['./create-from-bill-wizard.component.scss']
})
export class CreateFromBillWizardComponent implements OnInit {
  step = 1;
  maxStep = 5;
  scanData: any = null;
  billGpuJobId: number | null = null;   // GPU integer id from POST /bills response
  scanError: string = null;
  uploadError: string = null;
  uploading = false;
  submitted = false;          // true after fire-and-forget bill submit succeeds
  resuming = false;           // true while fetching result for ?resume= flow
  resumeError: string = null; // set if resume fetch fails or job still pending
  billFormTouched = false;
  step4MissingFields: string[] = [];
  submitting = false;
  createdProject: any = null;
  selectedFile: File = null;
  metersInput: string = '';
  pageRangeInput: string = '';
  pdfPageCount: number = 0;
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
    private route: ActivatedRoute,
    private createFromBillService: CreateFromBillService,
    private userService: CurrentUserService,
    private usrService: UserService,
    private timeHelpers: TimeHelpers,
    @Inject('TIMEZONES') private timezones: any[]
  ) {}

  ngOnInit() {
    this.buildForms();
    this.clients = (window['BOOTSTRAP_DATA'] && window['BOOTSTRAP_DATA'].clients) || [];

    // Resume flow: ?resume=<gpu_job_id> — fetch result, pre-fill forms, skip to step 2
    const resumeId = this.route.snapshot.queryParamMap.get('resume');
    if (resumeId) {
      this.billGpuJobId = Number(resumeId);
      this.resuming = true;
      this.createFromBillService.getBillResult(Number(resumeId)).subscribe(
        (res: any) => {
          this.resuming = false;
          console.log('[wizard] getBillResult raw response:', JSON.stringify(res).slice(0, 800));
          if (res.status === 'done' && res.data) {
            this.scanData = res.data;
            console.log('[wizard] scanData assigned:', JSON.stringify(this.scanData).slice(0, 500));
            this.prefillFromScan();
            this.step = 2;
          } else if (res.status === 'error') {
            this.resumeError = 'The bill scan failed. Please try uploading again.';
          } else {
            this.resumeError = 'The bill scan is still processing — check back in a moment.';
          }
        },
        () => {
          this.resuming = false;
          this.resumeError = 'Could not load the bill result. Please try again.';
        }
      );
    }
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
      totalKwh: [''],
      kwPeak: [''],
      billAmount: [''],
      daysBilled: [''],
      voltage: [''],
      kwRatePerTariff: [''],
      customerCharge: [''],
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
      this.pdfPageCount = 0;
      this.readPdfPageCount(file);
    }
  }

  private readPdfPageCount(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const bytes = new Uint8Array(e.target.result as ArrayBuffer);
        // Convert to latin-1 string — /Count is always plain ASCII in a PDF
        let str = '';
        for (let i = 0; i < bytes.length; i++) {
          str += String.fromCharCode(bytes[i]);
        }
        const matches = str.match(/\/Count\s+(\d+)/g) || [];
        let max = 0;
        for (const m of matches) {
          const n = parseInt(m.replace(/\/Count\s+/, ''), 10);
          if (n > max) { max = n; }
        }
        this.pdfPageCount = max;
      } catch (_) {
        this.pdfPageCount = 0;
      }
    };
    reader.onerror = () => { this.pdfPageCount = 0; };
    reader.readAsArrayBuffer(file);
  }

  uploadAndAnalyze() {
    if (!this.selectedFile || !this.selectedFile.name.toLowerCase().endsWith('.pdf')) {
      this.scanError = 'Please select a PDF file.';
      return;
    }
    if (this.selectedFile.size > 50 * 1024 * 1024) {
      this.scanError = 'File must be 50 MB or smaller.';
      return;
    }
    this.scanError = null;
    this.uploadError = null;
    this.uploading = true;

    // Fire-and-forget: submit to GPU and return immediately.
    // Save GPU job ID to localStorage; project list page will poll and offer resume.
    this.createFromBillService.submitBillAnalysis(
      this.selectedFile,
      this.metersInput || undefined,
      this.pageRangeInput || undefined
    ).subscribe(
      (res: any) => {
        this.uploading = false;
        if (res && res.success && res.job_id) {
          this.billGpuJobId = Number(res.job_id);
          try {
            localStorage.setItem(PENDING_BILL_PROJECT_KEY, JSON.stringify({
              gpu_job_id: res.job_id,
              filename: res.filename || this.selectedFile.name,
              submitted_at: Date.now(),
              estimated_minutes: res.estimated_minutes || 10,
            }));
          } catch (_) {}
          this.submitted = true;
        } else {
          this.scanError = (res && res.error) || 'Submission failed. Please try again.';
        }
      },
      err => {
        this.uploading = false;
        const status = err && err.status;
        if (status === 413) {
          this.scanError = 'File is too large for the server (max 50 MB). Try a smaller file.';
        } else {
          const msg = err && err.error ? (err.error.error || err.error.message || 'Upload failed') : 'Upload failed. Please try again.';
          this.scanError = msg;
        }
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

  /**
   * Parse a bill date (epoch ms number, numeric string, or human string like "Oct 8, 2025")
   * and return the full IMyDateModel that mydatepicker v1.x requires:
   * { date, jsdate, formatted, epoc }
   */
  private parseBillDate(val: any): any | null {
    if (val === null || val === undefined || val === '') return null;
    let dt: Date | null = null;
    const n = Number(val);
    if (!isNaN(n) && n > 0) {
      // Epoch ms — use UTC to avoid timezone shifting the date by one day
      dt = new Date(n);
    } else if (typeof val === 'string' && val.trim()) {
      dt = new Date(val.trim());
    }
    if (!dt || isNaN(dt.getTime())) return null;
    // Use UTC values to match what the server stored (midnight UTC = the correct calendar date)
    const year  = dt.getUTCFullYear();
    const month = dt.getUTCMonth() + 1;
    const day   = dt.getUTCDate();
    const pad   = (n: number) => (n < 10 ? '0' : '') + n;
    return {
      date:      { year, month, day },
      jsdate:    dt,
      formatted: year + '-' + pad(month) + '-' + pad(day),
      epoc:      Math.floor(dt.getTime() / 1000),
    };
  }

  private prefillFromScan() {
    const raw = this.scanData || {};
    // Bill fields live under initial_parse; fall back to flat object for older API responses.
    const d = raw.initial_parse || raw;
    console.log('[wizard] scanData (raw):', JSON.stringify(raw).slice(0, 500));
    console.log('[wizard] using d (initial_parse or raw):', JSON.stringify(d).slice(0, 500));
    console.log('[wizard] d.billDate:', d.billDate, '| type:', typeof d.billDate);
    const _testParsed = this.parseBillDate(d.billDate);
    console.log('[wizard] parseBillDate result:', JSON.stringify(_testParsed));
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
    const billDateVal = this.parseBillDate(d.billDate);
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
    if (this.step === 4) {
      const v = this.billForm.value;
      const missing: string[] = [];
      if (!String(v.totalKwh || '').trim()) { missing.push('Total KWH'); }
      if (!String(v.kwPeak || '').trim())   { missing.push('KW Peak'); }
      if (!String(v.billAmount || '').trim()) { missing.push('Bill Amount'); }
      console.log('[Wizard step4] values:', JSON.stringify(v));
      console.log('[Wizard step4] missing:', missing);
      if (missing.length) {
        this.billFormTouched = true;
        this.step4MissingFields = missing;
        return;
      }
      this.billFormTouched = false;
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
    if (!this.projectForm.valid) {
      this.projectForm.markAllAsTouched();
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

    const electricBillAnalysis: any = {
      meterBills: [meterBill],
      ...meterBill,
    };
    if (this.billGpuJobId) {
      electricBillAnalysis.gpuJobId = this.billGpuJobId;
    }

    // Pull address fields from scan data so the savings report page pre-populates them
    const _sd = this.scanData || {};
    const _clientVals = this.clientForm ? this.clientForm.value : {};
    const payload: any = {
      project: {
        ...this.projectForm.value,
        currencyExchangeRate,
        reportFields: {
          numberOfMeters: meterCount,
          // Project facility address (from bill scan service location)
          facility_address: _sd.serviceAddress || _clientVals.address || '',
          facility_city:    _sd.serviceCity    || _clientVals.city    || '',
          facility_state:   _sd.serviceState   || _clientVals.state   || '',
          facility_zip:     _sd.serviceZip     || _clientVals.zip     || '',
          // Client billing address (cp_ prefix = "client/counterparty")
          cp_address: _clientVals.address || _sd.serviceAddress || '',
          cp_city:    _clientVals.city    || _sd.serviceCity    || '',
          cp_state:   _clientVals.state   || _sd.serviceState   || '',
          cp_zip:     _clientVals.zip     || _sd.serviceZip     || '',
          // Client contact
          company:       _clientVals.name        || '',
          contact:       _clientVals.contactName || '',
          contact_phone: _clientVals.contactPhone || '',
        },
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
        // Project created — remove pending resume marker
        try { localStorage.removeItem(PENDING_BILL_PROJECT_KEY); } catch (_) {}
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
      this.router.navigate(['/project/pipeline', this.createdProject.id]);
    }
  }

  cancel() {
    this.router.navigate(['/project/pipeline']);
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
