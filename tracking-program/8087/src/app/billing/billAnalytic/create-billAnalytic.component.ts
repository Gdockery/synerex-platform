import {Component, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from "@angular/router";
import {BillAnalyticService} from "./billAnalytic.service";
import {CurrentUserService} from "../../shared/user/currentUser.service";
import {CreateFromBillService} from "../../project/create-from-bill/create-from-bill.service";

@Component({
  template: `
    <div class="content-box-white">
      <button class="default-button green-button" [routerLink]="['/billing/bill-analytic/list']">Back to bill analytic list</button>
    </div>
    <div class="content-box" *ngIf="step==0">
      <div class="row">
        <div class="col-md-12">
          <h3>Scan Bill from PDF</h3>
          <p>Upload an electric bill PDF to auto-fill the form below. You can edit any extracted data before saving.</p>
          <div class="form-inline">
            <input type="file" accept=".pdf" (change)="onFileSelect($event)" #fileInput class="form-control" style="max-width: 300px;" />
            <button type="button" class="default-button green-button" (click)="scanBill()" [disabled]="!selectedFile || scanning">
              {{ scanning ? 'Scanning...' : 'Scan bill' }}
            </button>
          </div>
          <div *ngIf="scanError" class="alert alert-danger" style="margin-top: 10px;">{{ scanError }}</div>
        </div>
      </div>
    </div>
    <bill-analytic-form *ngIf="step==0" 
                        [billAnalytic]="analytic" 
                        [billIndex]="index"
                        [scanData]="scanData"
                        (submitEvent)="submitStep1($event)"></bill-analytic-form>
  `
})
export class CreateBillAnalyticComponent implements OnInit {

  /**
   * Which step of bill analytic user is on (bill analytic/identify equipment)
   * @type {number}
   */
  private step = 0;

  private analytic;
  private equipment;
  private index;

  selectedFile: File | null = null;
  scanData: any = null;
  scanError: string | null = null;
  scanning = false;

  constructor(
    private billAnalyticService: BillAnalyticService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: CurrentUserService,
    private createFromBillService: CreateFromBillService
  ) {
    this.index = route.snapshot.params['index'];
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      this.selectedFile = input.files[0];
      this.scanError = null;
    }
  }

  scanBill() {
    if (!this.selectedFile || !this.selectedFile.name.toLowerCase().endsWith('.pdf')) {
      this.scanError = 'Please select a PDF file.';
      return;
    }
    if (this.selectedFile.size > 10 * 1024 * 1024) {
      this.scanError = 'File must be 10 MB or smaller.';
      return;
    }
    this.scanError = null;
    this.scanning = true;
    this.createFromBillService.analyzeBill(this.selectedFile).subscribe(
      (res: any) => {
        this.scanning = false;
        const data = res.data || res;
        if (res.success !== false && data && Object.keys(data).length > 0) {
          this.scanData = data;
        } else {
          this.scanError = res.error || 'Could not extract bill data. Please enter information manually.';
        }
      },
      err => {
        this.scanning = false;
        this.scanError = (err?.error?.error || err?.error?.message || 'Upload failed. Please try again.') as string;
      }
    );
  }

  ngOnInit() {
    this.billAnalyticService.getAnalytic().subscribe(billAnalytic => {
      this.analytic = billAnalytic;

    });
    this.billAnalyticService.getEquipment().subscribe(equipmentInfo => {
      this.equipment = equipmentInfo;

    });
  }

  submitStep1(billAnalytic) {
      this.analytic = billAnalytic;
      if (this.index) {
        this.router.navigate(['/billing/bill-analytic/equipments', billAnalytic.meterBills[this.index].meterNumber]);
      } else {
        this.router.navigate(['/billing/bill-analytic/equipments', billAnalytic.meterNumber]);
      }
  }

  submitStep2(billAnalytic) {
    if (this.analytic.meterBills.length() == this.userService.user.selectedProject.reportFields.numberOfMeters) {
      this.router.navigate(['/billing/bill-analytic/equipments']);
    }
  }
}
